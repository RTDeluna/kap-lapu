import { clockTime, relativeDay } from '../time';

describe('relativeDay', () => {
  const now = new Date(2026, 10, 14, 9, 0);
  it('says ngayon for today', () => {
    expect(relativeDay(new Date(2026, 10, 14, 5, 0).toISOString(), now)).toBe('ngayon');
  });
  it('says kahapon for yesterday', () => {
    expect(relativeDay(new Date(2026, 10, 13, 23, 0).toISOString(), now)).toBe('kahapon');
  });
  it('counts days within a week', () => {
    expect(relativeDay(new Date(2026, 10, 11, 12, 0).toISOString(), now)).toBe('3 araw na');
  });
  it('falls back to a date', () => {
    expect(relativeDay(new Date(2026, 10, 1, 12, 0).toISOString(), now)).toBe('1 Nov');
  });
  it('handles junk', () => {
    expect(relativeDay('nope', now)).toBe('');
  });
});

describe('clockTime', () => {
  it('formats AM and PM', () => {
    expect(clockTime(new Date(2026, 10, 14, 5, 0).toISOString())).toBe('5:00 AM');
    expect(clockTime(new Date(2026, 10, 14, 0, 7).toISOString())).toBe('12:07 AM');
    expect(clockTime(new Date(2026, 10, 14, 18, 30).toISOString())).toBe('6:30 PM');
  });
});
