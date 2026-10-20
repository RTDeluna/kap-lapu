export interface LatLng {
  lat: number;
  lng: number;
}

/** Mariveles, Bataan: where Laot starts. */
export const MARIVELES: LatLng = { lat: 14.4333, lng: 120.4833 };

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great circle distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The point `distance` metres from `origin` on a bearing in degrees. */
export function destination(origin: LatLng, distance: number, bearingDeg: number): LatLng {
  const delta = distance / EARTH_RADIUS_M;
  const theta = toRad(bearingDeg);
  const phi1 = toRad(origin.lat);
  const lambda1 = toRad(origin.lng);
  const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
  const lambda2 =
    lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
  return { lat: toDeg(phi2), lng: ((toDeg(lambda2) + 540) % 360) - 180 };
}

/**
 * A closed GeoJSON ring ([lng, lat] pairs) approximating a circle on the ground.
 * Used to draw an approximate area at its true size at every zoom.
 */
export function circleRing(center: LatLng, radiusMeters: number, steps = 64): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const p = destination(center, radiusMeters, (360 * i) / steps);
    ring.push([p.lng, p.lat]);
  }
  ring.push(ring[0]);
  return ring;
}
