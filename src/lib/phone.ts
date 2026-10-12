/**
 * Philippine mobile numbers for phone sign in.
 * Accepts 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX, with spaces, dashes, dots or
 * parentheses, and returns E.164 (+639XXXXXXXXX). Returns null for anything else.
 */
export function normalizePhPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  let national: string | null = null;
  if (!hasPlus && /^09\d{9}$/.test(digits)) national = digits.slice(1);
  else if (/^639\d{9}$/.test(digits)) national = digits.slice(2);

  return national ? `+63${national}` : null;
}

/** +639171234567 -> +63 917 123 4567, for showing the number back to the person. */
export function formatPhPhone(e164: string): string {
  const m = /^\+63(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+63 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
