import { rateLines } from '../rates';

describe('rateLines', () => {
  it('says what each price covers', () => {
    expect(rateLines({ day_rate_php: 2500, seat_rate_php: 350 })).toEqual([
      '₱2,500 per boat, day trip',
      '₱350 per seat',
    ]);
  });
  it('skips missing rates', () => {
    expect(rateLines({ day_rate_php: null, seat_rate_php: 300 })).toEqual(['₱300 per seat']);
    expect(rateLines(null)).toEqual([]);
  });
});
