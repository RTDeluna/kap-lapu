const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Taglish relative day: "ngayon", "kahapon", "3 araw na", then "14 Nov". */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (days <= 0) return 'ngayon';
  if (days === 1) return 'kahapon';
  if (days < 7) return `${days} araw na`;
  const month = then.toLocaleString('en-US', { month: 'short' });
  return `${then.getDate()} ${month}`;
}

/** 5:00 AM style clock time. */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
