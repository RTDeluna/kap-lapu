import { formatCatchCount, formatDistance, formatPeso, formatWeightKg, parseWeightKg } from '../format';

describe('formatPeso', () => {
  it('uses the peso sign and commas', () => {
    expect(formatPeso(2500)).toBe('₱2,500');
    expect(formatPeso(350)).toBe('₱350');
    expect(formatPeso(1250000)).toBe('₱1,250,000');
    expect(formatPeso(0)).toBe('₱0');
  });
  it('keeps centavos to two places', () => {
    expect(formatPeso(349.5)).toBe('₱349.50');
  });
  it('puts the minus before the sign', () => {
    expect(formatPeso(-70)).toBe('-₱70');
  });
});

describe('formatDistance', () => {
  it('shows metres under 1 km, rounded to 10 m', () => {
    expect(formatDistance(847)).toBe('850 m');
    expect(formatDistance(3)).toBe('10 m');
  });
  it('shows one decimal under 10 km', () => {
    expect(formatDistance(4200)).toBe('4.2 km');
    expect(formatDistance(4249)).toBe('4.2 km');
    expect(formatDistance(1000)).toBe('1.0 km');
  });
  it('drops the decimal from 10 km', () => {
    expect(formatDistance(18_400)).toBe('18 km');
  });
  it('returns empty for bad input', () => {
    expect(formatDistance(Number.NaN)).toBe('');
    expect(formatDistance(-1)).toBe('');
  });
});

describe('catch helpers', () => {
  it('pluralises catches', () => {
    expect(formatCatchCount(1)).toBe('1 catch');
    expect(formatCatchCount(18)).toBe('18 catches');
    expect(formatCatchCount(0)).toBe('0 catches');
  });
  it('formats kilograms', () => {
    expect(formatWeightKg(2.1)).toBe('2.1 kg');
    expect(formatWeightKg(2)).toBe('2 kg');
    expect(formatWeightKg(1.236)).toBe('1.24 kg');
  });
  it('parses weights', () => {
    expect(parseWeightKg('')).toBeNull();
    expect(parseWeightKg(' 2.1 ')).toBe(2.1);
    expect(parseWeightKg('2,5')).toBe(2.5);
    expect(parseWeightKg('abc')).toBeNaN();
    expect(parseWeightKg('-1')).toBeNaN();
  });
});
