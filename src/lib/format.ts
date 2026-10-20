const pesoFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** 2500 -> ₱2,500. 349.5 -> ₱349.50. */
export function formatPeso(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const body = Number.isInteger(abs)
    ? pesoFormatter.format(abs)
    : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return `${sign}₱${body}`;
}

/** Metres -> "850 m", "4.2 km", "18 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** 1 -> "1 catch", 18 -> "18 catches". */
export function formatCatchCount(count: number): string {
  return `${count} ${count === 1 ? 'catch' : 'catches'}`;
}

/** 2.1 -> "2.1 kg", 2 -> "2 kg". */
export function formatWeightKg(kg: number): string {
  const rounded = Math.round(kg * 100) / 100;
  return `${rounded} kg`;
}

/** Parses "2.1" or "2,1" into kilograms. Empty is null. Anything else is NaN. */
export function parseWeightKg(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}
