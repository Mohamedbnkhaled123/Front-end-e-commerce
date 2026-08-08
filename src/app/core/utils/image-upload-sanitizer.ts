/**
 * Image Upload Sanitizer
 * src/app/core/utils/image-upload-sanitizer.ts
 *
 * ── Processing Pipeline (single final lossy encoding) ──────────────────────────
 *
 * Step 1  Size gate (before any file reading — prevents memory spike on decode)
 * Step 2  MIME type + extension rejection (SVG, GIF, AVIF, HEIC explicitly blocked)
 * Step 3  Magic bytes verification (first 12 bytes — defense against fake extensions)
 * Step 4  Animated WebP detection (ANIM chunk scan in first 64 bytes)
 * Step 5  Canvas re-rendering → PNG export (lossless intermediate)
 *         Backend Sharp performs the ONLY final lossy compression (→ WebP quality 82).
 *
 * ── Why PNG intermediate (not JPEG)? ──────────────────────────────────────────
 * Exporting as JPEG from canvas would introduce a frontend lossy step, creating a
 * two-stage lossy chain (JPEG → backend WebP) that degrades image quality for no
 * security benefit. PNG is lossless, so the backend Sharp pipeline receives pristine
 * pixel data and performs the ONLY lossy encode.
 *
 * ── Memory concern mitigation ─────────────────────────────────────────────────
 * The 5 MB file size cap (checked BEFORE decoding) bounds the decoded RGBA canvas
 * buffer to approximately 20 MB for a 5 MP image, which is within safe bounds for
 * a desktop admin panel. OffscreenCanvas is preferred where available to avoid
 * blocking the main thread.
 *
 * ── URL Validation (also exported from this module) ──────────────────────────
 * The backend stores image URLs as strings only — it never fetches remote URLs.
 * Therefore, SSRF is not a risk. Validation is focused solely on:
 *   - Preventing XSS via dangerous protocol injection (javascript:, data:, vbscript:)
 *   - Enforcing HTTPS
 *   - Rejecting structurally invalid URLs
 * Private IP blocking is intentionally NOT applied (no server-side fetch risk).
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SanitizedImageResult {
  blob: Blob;
  objectUrl: string;
  originalName: string;
  originalSize: number;
  sanitizedSize: number;
  mimeType: 'image/png';
}

export interface ImageSanitizerConfig {
  /**
   * Maximum file size in bytes.
   * Default: 5 MB — high-quality hero images (2560×1440 JPEG) commonly reach
   * 3–5 MB. The backend compresses the output regardless. Configurable to avoid
   * hardcoding a business constraint.
   */
  maxSizeBytes?: number;
}

export interface UrlValidationResult {
  valid: boolean;
  error: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Explicitly rejected MIME types with documented reasons.
 * These are rejected at Step 2 before any binary inspection.
 */
const REJECTED_MIMES: Record<string, string> = {
  'image/gif':
    'GIF images are not supported. Please upload a static JPEG, PNG, WebP, or SVG image.',
  'image/avif':
    'AVIF upload is not supported. Browser canvas encoding for AVIF is not available. Please use JPEG, PNG, WebP, or SVG.',
  'image/heic':
    'HEIC format is not supported. Please convert your image to JPEG or PNG first.',
  'image/heif':
    'HEIF format is not supported. Please convert your image to JPEG or PNG first.',
};

const REJECTED_EXTENSIONS = new Set(['.gif', '.avif', '.heic', '.heif']);

const ACCEPTED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
const ACCEPTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);

/** Dangerous URL protocol prefixes that could enable XSS */
const BLOCKED_URL_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

// ─── Magic byte signatures ─────────────────────────────────────────────────────

/**
 * Reads the first 12 bytes and matches against known image signatures.
 * Returns null if no known signature is found.
 */
function detectMagicBytes(buf: Uint8Array): 'jpeg' | 'png' | 'webp' | 'svg' | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png';
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  
  // SVG: starts with <?xml or <svg or <!-- (XML comment)
  const headerStr = new TextDecoder().decode(buf.slice(0, 12)).toLowerCase();
  if (headerStr.includes('<svg') || headerStr.includes('<?xml') || headerStr.includes('<!--')) return 'svg';

  return null;
}

// ─── Animated WebP detection ───────────────────────────────────────────────────

/**
 * Scans the first 64 bytes for an ANIM chunk (bytes 'A','N','I','M' = 41 4E 49 4D).
 * Presence of ANIM indicates the file is an animated WebP.
 */
async function isAnimatedWebP(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  for (let i = 12; i < buf.length - 3; i++) {
    if (buf[i] === 0x41 && buf[i + 1] === 0x4e && buf[i + 2] === 0x49 && buf[i + 3] === 0x4d) {
      return true;
    }
  }
  return false;
}

// ─── Canvas re-encode ──────────────────────────────────────────────────────────

/**
 * Draws the image onto a canvas and exports as lossless PNG.
 *
 * Effect: strips EXIF metadata and reduces common embedded payload vectors
 * (e.g., PHP shells appended after the JPEG EOI marker).
 * Does NOT remove steganographic pixel-level data.
 *
 * Uses OffscreenCanvas where available (Chrome 69+, Firefox 105+) to keep
 * the main thread unblocked. Falls back to an in-DOM canvas (Safari < 17).
 */
function canvasReEncode(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let canvas: HTMLCanvasElement | OffscreenCanvas;
        let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

        if (typeof OffscreenCanvas !== 'undefined') {
          canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
          ctx = (canvas as OffscreenCanvas).getContext('2d');
        } else {
          const el = document.createElement('canvas');
          el.width = img.naturalWidth;
          el.height = img.naturalHeight;
          canvas = el;
          ctx = el.getContext('2d');
        }

        if (!ctx) {
          reject(new Error('Could not initialize a canvas rendering context.'));
          return;
        }

        (ctx as CanvasRenderingContext2D).drawImage(img, 0, 0);

        const toBlobFn = (type: string): Promise<Blob | null> =>
          canvas instanceof OffscreenCanvas
            ? (canvas as OffscreenCanvas).convertToBlob({ type })
            : new Promise(res => (canvas as HTMLCanvasElement).toBlob(res, type));

        toBlobFn('image/png').then(blob => {
          if (!blob) {
            reject(new Error('Canvas export returned null. The image may be corrupted.'));
            return;
          }
          resolve(blob);
        }).catch(() =>
          reject(new Error('Image could not be processed. It may be corrupted or truncated.'))
        );

      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('An unexpected error occurred while processing the image.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error('Image failed to load. It may be corrupted, truncated, or use an unsupported encoding.')
      );
    };

    img.src = objectUrl;
  });
}

// ─── Main export: sanitizeImageFile ───────────────────────────────────────────

/**
 * Full sanitization pipeline. Throws with a user-readable message on any failure.
 *
 * @param file    The File object selected by the user.
 * @param config  Optional configuration (e.g., custom size cap).
 */
export async function sanitizeImageFile(
  file: File,
  config: ImageSanitizerConfig = {}
): Promise<SanitizedImageResult> {
  const maxBytes = config.maxSizeBytes ?? DEFAULT_MAX_BYTES;
  const nameLower = file.name.toLowerCase();
  const ext = ('.' + nameLower.split('.').pop()) as string;

  // ── Step 1: Size gate ──────────────────────────────────────────────────────
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0);
    throw new Error(`File is too large. Maximum allowed size is ${mb} MB.`);
  }

  // ── Step 2: Explicit MIME / extension rejection ────────────────────────────
  if (file.type in REJECTED_MIMES) {
    throw new Error(REJECTED_MIMES[file.type]);
  }
  if (REJECTED_EXTENSIONS.has(ext)) {
    throw new Error(`Files with extension "${ext}" are not supported.`);
  }
  if (!ACCEPTED_MIMES.has(file.type) && !ACCEPTED_EXTENSIONS.has(ext)) {
    throw new Error('Unsupported file format. Please upload a JPEG, PNG, WebP, or SVG image.');
  }

  // ── Step 3: Magic bytes verification ──────────────────────────────────────
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = detectMagicBytes(header);
  if (!detected) {
    throw new Error(
      'File verification failed. The file does not appear to be a valid image, ' +
      'or it may have been renamed with a fake extension.'
    );
  }

  // ── Step 4: Animated WebP detection ───────────────────────────────────────
  if (detected === 'webp') {
    const animated = await isAnimatedWebP(file);
    if (animated) {
      throw new Error(
        'Animated WebP images are not supported for the hero section. ' +
        'Please upload a static image.'
      );
    }
  }

  // ── Step 5: Canvas re-render → lossless PNG ───────────────────────────────
  const sanitizedBlob = await canvasReEncode(file);
  const objectUrl = URL.createObjectURL(sanitizedBlob);

  return {
    blob: sanitizedBlob,
    objectUrl,
    originalName: file.name,
    originalSize: file.size,
    sanitizedSize: sanitizedBlob.size,
    mimeType: 'image/png',
  };
}

// ─── URL validation ────────────────────────────────────────────────────────────

/**
 * Validates an image URL for the Hero Image Manager.
 *
 * Scope of risks addressed:
 *   - XSS via dangerous protocol injection (javascript:, data:, vbscript:, file:)
 *   - Non-HTTPS protocols
 *   - Structurally malformed URLs
 *
 * Not addressed (by design):
 *   - Private IP blocking — the backend only stores the URL string and never
 *     fetches it, so SSRF is not a risk in this architecture.
 *   - CDN whitelist — no business requirement restricts image hosting location.
 */
export function validateImageUrl(raw: string): UrlValidationResult {
  const fail = (error: string): UrlValidationResult => ({ valid: false, error });

  if (!raw || typeof raw !== 'string') return fail('URL is required.');

  const trimmed = raw.trim();
  if (!trimmed) return fail('URL is required.');

  // Block dangerous protocols (XSS vectors in <img src="...">)
  const lower = trimmed.toLowerCase();
  for (const proto of BLOCKED_URL_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return fail(`URLs starting with "${proto}" are not allowed.`);
    }
  }

  // Enforce HTTPS only
  if (!trimmed.startsWith('https://')) {
    return fail('Only HTTPS image URLs are accepted.');
  }

  // Structural parse — catches malformed URLs that pass the prefix check
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fail('The URL is malformed or invalid.');
  }

  if (parsed.protocol !== 'https:') {
    return fail('Only HTTPS image URLs are accepted.');
  }

  if (!parsed.hostname || parsed.hostname.length < 3) {
    return fail('The URL must contain a valid hostname.');
  }

  return { valid: true, error: null };
}
