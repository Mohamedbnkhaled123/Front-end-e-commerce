/**
 * Unit tests: email.validator.ts
 *
 * Tests cover:
 *   - Valid addresses (diverse formats)
 *   - Sanitization (trim, lowercase)
 *   - RFC 5321 length constraints
 *   - Structural failures (missing @, multiple @)
 *   - Local part rules (dot start/end, consecutive dots, invalid chars)
 *   - Domain rules (label hyphen start/end, consecutive dots, invalid chars)
 *   - TLD minimum length
 */
import { describe, expect, it } from 'vitest';
import { validateEmail } from './email.validator';

describe('validateEmail', () => {

  // ── Valid addresses ──────────────────────────────────────────────────────────

  it('accepts a standard email address', () => {
    const result = validateEmail('user@gmail.com');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.sanitized).toBe('user@gmail.com');
  });

  it('accepts email with plus sign in local part', () => {
    expect(validateEmail('user+tag@gmail.com').valid).toBe(true);
  });

  it('accepts googlemail.com domain', () => {
    expect(validateEmail('first.last-test@googlemail.com').valid).toBe(true);
  });

  it('rejects non-Google domains like university emails', () => {
    const result = validateEmail('student@alexu.edu.eg');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Google email addresses');
  });

  // ── Sanitization ────────────────────────────────────────────────────────────

  it('trims whitespace and lowercases', () => {
    const result = validateEmail('  TEST@GMAIL.COM  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('test@gmail.com');
  });

  it('returns sanitized string even for invalid input', () => {
    const result = validateEmail('  INVALID  ');
    expect(result.valid).toBe(false);
    expect(result.sanitized).toBe('invalid');
  });

  // ── Null / empty guards ──────────────────────────────────────────────────────

  it('rejects null-like input', () => {
    expect(validateEmail('').valid).toBe(false);
    expect(validateEmail('   ').valid).toBe(false);
    // @ts-expect-error - testing runtime guard
    expect(validateEmail(null).valid).toBe(false);
  });

  // ── RFC 5321 length ──────────────────────────────────────────────────────────

  it('rejects email longer than 254 characters', () => {
    const longEmail = 'a'.repeat(60) + '@' + 'b'.repeat(60) + '.' + 'c'.repeat(60) + '.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('254');
  });

  it('rejects local part longer than 64 characters', () => {
    const result = validateEmail('a'.repeat(65) + '@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('64');
  });

  it('accepts local part of exactly 64 characters', () => {
    expect(validateEmail('a'.repeat(64) + '@example.com').valid).toBe(true);
  });

  // ── @ sign rules ─────────────────────────────────────────────────────────────

  it('rejects email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('"@"');
  });

  it('rejects email with multiple @ signs', () => {
    expect(validateEmail('user@@example.com').valid).toBe(false);
    expect(validateEmail('us@er@example.com').valid).toBe(false);
  });

  // ── Local part rules ─────────────────────────────────────────────────────────

  it('rejects local part starting with a dot', () => {
    const result = validateEmail('.user@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('start or end with a period');
  });

  it('rejects local part ending with a dot', () => {
    expect(validateEmail('user.@example.com').valid).toBe(false);
  });

  it('rejects consecutive dots in local part', () => {
    const result = validateEmail('us..er@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('consecutive periods');
  });

  it('rejects invalid characters in local part', () => {
    expect(validateEmail('user name@example.com').valid).toBe(false);
    expect(validateEmail('user<>@example.com').valid).toBe(false);
    expect(validateEmail('user"quote@example.com').valid).toBe(false);
  });

  // ── Domain rules ─────────────────────────────────────────────────────────────

  it('rejects domain without a dot', () => {
    expect(validateEmail('user@localhost').valid).toBe(false);
  });

  it('rejects domain label starting with a hyphen', () => {
    const result = validateEmail('user@-example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('hyphen');
  });

  it('rejects domain label ending with a hyphen', () => {
    expect(validateEmail('user@example-.com').valid).toBe(false);
  });

  it('rejects domain with consecutive dots', () => {
    expect(validateEmail('user@ex..ample.com').valid).toBe(false);
  });

  it('rejects domain with invalid characters', () => {
    expect(validateEmail('user@exam_ple.com').valid).toBe(false);
    expect(validateEmail('user@exam!ple.com').valid).toBe(false);
  });

  // ── TLD rules ─────────────────────────────────────────────────────────────────

  it('rejects TLD shorter than 2 characters', () => {
    const result = validateEmail('user@example.c');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('top-level domain');
  });

  it('accepts TLD of exactly 2 characters', () => {
    expect(validateEmail('user@example.co').valid).toBe(true);
  });
});
