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

  if (sanitized.length > 254) {
    return fail(sanitized, 'Email address must not exceed 254 characters.');
  }

  const atIdx = sanitized.indexOf('@');
  if (atIdx === -1) {
    return fail(sanitized, 'Email address must contain "@".');
  }

  if (sanitized.indexOf('@', atIdx + 1) !== -1) {
    return fail(sanitized, 'Email address must contain exactly one "@".');
  }

  const local = sanitized.slice(0, atIdx);
  const domain = sanitized.slice(atIdx + 1);

  // ── Google / Gmail Domain Check ──────────────────────────────────────────
  const allowedGoogleDomains = ['gmail.com', 'googlemail.com'];
  if (!allowedGoogleDomains.includes(domain)) {
    return fail(sanitized, 'Only Google email addresses (@gmail.com) are supported.');
  }

  // ── Local part (Google Rules) ────────────────────────────────────────────
  if (local.length === 0) {
    return fail(sanitized, 'The email username cannot be empty.');
  }

  // Handle Gmail aliases (e.g., username+alias@gmail.com)
  const baseUsername = local.split('+')[0];

  if (baseUsername.length < 6 || baseUsername.length > 30) {
    return fail(sanitized, 'The Google username (before +) must be between 6 and 30 characters long.');
  }

  if (!/^[a-z0-9.]+$/.test(baseUsername)) {
    return fail(sanitized, 'The Google username can only contain letters (a-z), numbers (0-9), and periods (.).');
  }

  if (baseUsername.startsWith('.') || baseUsername.endsWith('.')) {
    return fail(sanitized, 'The Google username cannot start or end with a period.');
  }

  if (baseUsername.includes('..')) {
    return fail(sanitized, 'The Google username cannot contain consecutive periods.');
  }

  // Check the alias part (if any)
  if (local.includes('+')) {
    const aliasPart = local.slice(baseUsername.length); // includes the '+'
    if (!/^[a-z0-9._%+\-]+$/.test(aliasPart)) {
      return fail(sanitized, 'The alias part of the email contains invalid characters.');
    }
  }

  return { valid: true, sanitized, error: null };
}
