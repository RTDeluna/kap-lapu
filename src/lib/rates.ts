import { formatPeso } from './format';

export interface RateInput {
  day_rate_php: number | null;
  seat_rate_php: number | null;
}

/** "₱2,500 per boat, day trip" and "₱350 per seat", in that order, skipping blanks. */
export function rateLines(rates: RateInput | null | undefined): string[] {
  if (!rates) return [];
  const lines: string[] = [];
  if (rates.day_rate_php != null) lines.push(`${formatPeso(rates.day_rate_php)} per boat, day trip`);
  if (rates.seat_rate_php != null) lines.push(`${formatPeso(rates.seat_rate_php)} per seat`);
  return lines;
}

export const PAPERS_IN_REVIEW = 'Papers in review. Chat to ask, booking opens once Licensed.';
