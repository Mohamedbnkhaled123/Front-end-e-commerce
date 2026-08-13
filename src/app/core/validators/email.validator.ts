/**
 * email.validator.ts
 */

export interface EmailValidationResult {
  valid: boolean;
  /** Trimmed and lowercased version of the input, regardless of validity. */
  sanitized: string;
  error: string | null;
}


export function validateEmail(raw: string): EmailValidationResult {
  const fail = (sanitized: string, error: string): EmailValidationResult =>
    ({ valid: false, sanitized, error });

  if (!raw || typeof raw !== 'string') {
    return fail('', 'Email address is required.');
  }

  const sanitized = raw.trim().toLowerCase();

  if (!sanitized) {
    return fail('', 'Email address is required.');
  }

  // ── RFC 5321 total length ──────────────────────────────────────────────────
  if (sanitized.length > 254) {
    return fail(sanitized, 'Email address must not exceed 254 characters.');
  }

  // ── Split at @ ────────────────────────────────────────────────────────────
  const atIdx = sanitized.indexOf('@');
  if (atIdx === -1) {
    return fail(sanitized, 'Email address must contain "@".');
  }

  // Reject multiple @ signs
  if (sanitized.indexOf('@', atIdx + 1) !== -1) {
    return fail(sanitized, 'Email address must contain exactly one "@".');
  }

  const local = sanitized.slice(0, atIdx);
  const domain = sanitized.slice(atIdx + 1);

  // ── Local part ────────────────────────────────────────────────────────────
  if (local.length === 0 || local.length > 64) {
    return fail(sanitized, 'The part before "@" must be between 1 and 64 characters.');
  }

  if (local.startsWith('.') || local.endsWith('.')) {
    return fail(sanitized, 'The part before "@" cannot start or end with a period.');
  }

  if (local.includes('..')) {
    return fail(sanitized, 'The part before "@" cannot contain consecutive periods.');
  }

  // Whitelist: alphanumeric + . _ % + -
  if (!/^[a-z0-9._%+\-]+$/.test(local)) {
    return fail(sanitized, 'The part before "@" contains invalid characters.');
  }

  // ── Domain ────────────────────────────────────────────────────────────────
  if (!domain || domain.length < 3) {
    return fail(sanitized, 'Email domain is missing or too short.');
  }

  if (!domain.includes('.')) {
    return fail(sanitized, 'Email domain must contain at least one period.');
  }

  const labels = domain.split('.');

  for (const label of labels) {
    if (label.length === 0) {
      return fail(sanitized, 'Email domain contains consecutive periods.');
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return fail(sanitized, 'Email domain labels cannot start or end with a hyphen.');
    }
    if (!/^[a-z0-9\-]+$/.test(label)) {
      return fail(sanitized, 'Email domain contains invalid characters.');
    }
  }

  // ── TLD ───────────────────────────────────────────────────────────────────
  const tld = labels[labels.length - 1];
  if (tld.length < 2) {
    return fail(sanitized, 'Email top-level domain must be at least 2 characters.');
  }

  return { valid: true, sanitized, error: null };
}
