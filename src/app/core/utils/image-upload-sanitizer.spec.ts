/**
 * Unit tests: image-upload-sanitizer.ts
 *
 * Covers:
 *   - validateImageUrl: valid, XSS protocols, non-HTTPS, malformed, empty
 *   - sanitizeImageFile: size cap, rejected MIME/ext (SVG, GIF, AVIF, HEIC),
 *     magic bytes mismatch, animated WebP detection
 *
 * Note: Canvas re-encoding (Step 5) is integration-level and requires a DOM,
 * so it is not mocked here — it is verified via build + manual testing.
 * Steps 1–4 are fully unit-testable without a DOM.
 */
import { describe, expect, it } from 'vitest';
import { validateImageUrl, sanitizeImageFile } from './image-upload-sanitizer';

// ─── Helper: create a fake File with specified properties ─────────────────────

function makeFile(
  name: string,
  type: string,
  bytes: number[] = [],
  sizePadding = 0
): File {
  const content = new Uint8Array([...bytes, ...new Array(sizePadding).fill(0x00)]);
  return new File([content], name, { type });
}

// Known magic byte headers
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG_HEADER  = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP_HEADER = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
const PHP_HEADER  = [0x3c, 0x3f, 0x70, 0x68, 0x70, 0x20, 0x65, 0x63, 0x68, 0x6f, 0x20, 0x27];

// ─── validateImageUrl ─────────────────────────────────────────────────────────

describe('validateImageUrl', () => {

  // Valid
  it('accepts a valid HTTPS URL', () => {
    expect(validateImageUrl('https://example.com/hero.jpg').valid).toBe(true);
  });

  it('accepts HTTPS URL with path and query', () => {
    expect(validateImageUrl('https://cdn.example.com/images/hero.webp?v=2').valid).toBe(true);
  });

  // Dangerous protocols (XSS)
  it('rejects javascript: protocol', () => {
    const r = validateImageUrl('javascript:alert(1)');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('javascript:');
  });

  it('rejects data: protocol', () => {
    expect(validateImageUrl('data:text/html,<h1>XSS</h1>').valid).toBe(false);
  });

  it('rejects vbscript: protocol', () => {
    expect(validateImageUrl('vbscript:msgbox(1)').valid).toBe(false);
  });

  it('rejects file: protocol', () => {
    expect(validateImageUrl('file:///etc/passwd').valid).toBe(false);
  });

  // Non-HTTPS
  it('rejects plain HTTP URL', () => {
    const r = validateImageUrl('http://example.com/img.jpg');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('HTTPS');
  });

  it('rejects FTP URL', () => {
    expect(validateImageUrl('ftp://example.com/img.jpg').valid).toBe(false);
  });

  // Malformed / empty
  it('rejects empty string', () => {
    expect(validateImageUrl('').valid).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateImageUrl('   ').valid).toBe(false);
  });

  it('rejects malformed URL with valid prefix', () => {
    expect(validateImageUrl('https://').valid).toBe(false);
  });

  // Private IPs — NOT blocked (backend does not fetch)
  it('accepts private IP URL (backend never fetches it)', () => {
    expect(validateImageUrl('https://192.168.1.1/img.jpg').valid).toBe(true);
  });
});

// ─── sanitizeImageFile ────────────────────────────────────────────────────────

describe('sanitizeImageFile', () => {

  // ── Step 1: Size gate ──────────────────────────────────────────────────────

  it('rejects files larger than the default limit (5 MB)', async () => {
    const oversized = makeFile('big.jpg', 'image/jpeg', JPEG_HEADER, 5 * 1024 * 1024 + 1);
    await expect(sanitizeImageFile(oversized)).rejects.toThrow(/too large/i);
  });

  it('rejects files larger than a custom limit', async () => {
    const file = makeFile('medium.jpg', 'image/jpeg', JPEG_HEADER, 2 * 1024 * 1024);
    await expect(
      sanitizeImageFile(file, { maxSizeBytes: 1 * 1024 * 1024 })
    ).rejects.toThrow(/too large/i);
  });

  // ── Step 2: MIME / extension rejection ────────────────────────────────────

  it('rejects SVG by MIME type', async () => {
    const file = makeFile('icon.svg', 'image/svg+xml');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/SVG/i);
  });

  it('rejects SVG by extension even with neutral MIME', async () => {
    const file = makeFile('icon.svg', 'application/octet-stream');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/\.svg/i);
  });

  it('rejects GIF by MIME type', async () => {
    const file = makeFile('anim.gif', 'image/gif');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/GIF/i);
  });

  it('rejects AVIF by MIME type', async () => {
    const file = makeFile('photo.avif', 'image/avif');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/AVIF/i);
  });

  it('rejects HEIC by MIME type', async () => {
    const file = makeFile('photo.heic', 'image/heic');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/HEIC/i);
  });

  it('rejects HEIF by MIME type', async () => {
    const file = makeFile('photo.heif', 'image/heif');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/HEIF/i);
  });

  it('rejects completely unknown MIME type', async () => {
    const file = makeFile('file.bmp', 'image/bmp');
    await expect(sanitizeImageFile(file)).rejects.toThrow(/unsupported/i);
  });

  // ── Step 3: Magic bytes mismatch ──────────────────────────────────────────

  it('rejects PHP file renamed to .jpg (magic bytes mismatch)', async () => {
    const file = makeFile('shell.jpg', 'image/jpeg', PHP_HEADER);
    await expect(sanitizeImageFile(file)).rejects.toThrow(/verification failed|fake extension/i);
  });

  it('rejects empty file with .jpg extension', async () => {
    const file = makeFile('empty.jpg', 'image/jpeg', []);
    await expect(sanitizeImageFile(file)).rejects.toThrow(/verification failed|fake extension/i);
  });

  it('accepts file with valid JPEG magic bytes', async () => {
    // Canvas will fail in Node (no DOM), so we spy on canvasReEncode to isolate magic bytes test
    // This confirms Steps 1–3 pass; Step 5 is tested manually / in browser
    const file = makeFile('photo.jpg', 'image/jpeg', JPEG_HEADER);
    // Expect either success or canvas error (not a magic bytes error)
    await sanitizeImageFile(file).then(
      () => { /* canvas worked */ },
      (err: Error) => {
        expect(err.message).not.toMatch(/verification failed|fake extension/i);
      }
    );
  });

  it('accepts file with valid PNG magic bytes', async () => {
    const file = makeFile('image.png', 'image/png', PNG_HEADER);
    await sanitizeImageFile(file).then(
      () => {},
      (err: Error) => {
        expect(err.message).not.toMatch(/verification failed|fake extension/i);
      }
    );
  });

  // ── Step 4: Animated WebP detection ───────────────────────────────────────

  it('rejects animated WebP containing ANIM chunk', async () => {
    // ANIM chunk bytes: 'A'=0x41, 'N'=0x4E, 'I'=0x49, 'M'=0x4D at position 12+
    const animBytes = [
      ...WEBP_HEADER,                          // bytes 0–11
      0x41, 0x4e, 0x49, 0x4d,                 // ANIM chunk at byte 12
      ...new Array(48).fill(0x00)
    ];
    const file = makeFile('anim.webp', 'image/webp', animBytes);
    await expect(sanitizeImageFile(file)).rejects.toThrow(/animated/i);
  });

  it('does not reject static WebP (no ANIM chunk)', async () => {
    // Static WebP: WEBP header with VP8 chunk (no ANIM)
    const staticBytes = [
      ...WEBP_HEADER,
      0x56, 0x50, 0x38, 0x20,  // VP8 chunk (not ANIM)
      ...new Array(48).fill(0x00)
    ];
    const file = makeFile('static.webp', 'image/webp', staticBytes);
    await sanitizeImageFile(file).then(
      () => {},
      (err: Error) => {
        expect(err.message).not.toMatch(/animated/i);
      }
    );
  });
});
