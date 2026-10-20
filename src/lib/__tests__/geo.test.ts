import { circleRing, destination, distanceMeters, MARIVELES } from '../geo';

describe('geo', () => {
  it('measures distance roughly right', () => {
    // Mariveles to Balanga is about 26 km.
    const d = distanceMeters(MARIVELES, { lat: 14.6766, lng: 120.5363 });
    expect(d).toBeGreaterThan(26_000);
    expect(d).toBeLessThan(28_500);
  });

  it('round trips a destination', () => {
    const p = destination(MARIVELES, 1000, 45);
    expect(distanceMeters(MARIVELES, p)).toBeCloseTo(1000, 0);
  });

  it('builds a closed ring at the given radius', () => {
    const ring = circleRing(MARIVELES, 500, 32);
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
    for (const [lng, lat] of ring) {
      expect(distanceMeters(MARIVELES, { lat, lng })).toBeCloseTo(500, 0);
    }
  });
});
