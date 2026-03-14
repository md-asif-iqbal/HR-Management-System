const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isNonEmptyText(value: unknown, minLength = 1): boolean {
  if (typeof value !== 'string') return false;
  return value.trim().length >= minLength;
}

export function toSafeNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function isNonNegativeNumber(value: unknown): boolean {
  const num = toSafeNumber(value);
  return num !== null && num >= 0;
}
