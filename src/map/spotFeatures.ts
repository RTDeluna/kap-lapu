import type { SpotRow } from '@/data/types';
import { circleRing } from '@/lib/geo';

export interface AreaColors {
  dagat: string;
  lapu: string;
}

/** Approximate spots as true-size circles (fill + dashed edge) for MapLibre. */
export function areaFeatures(spots: SpotRow[], c: AreaColors): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: spots
      .filter((s) => !s.is_exact)
      .map((s) => ({
        type: 'Feature',
        id: s.id,
        properties: { id: s.id, color: s.has_fresh_catch ? c.lapu : c.dagat },
        geometry: { type: 'Polygon', coordinates: [circleRing({ lat: s.lat, lng: s.lng }, s.area_radius_m)] },
      })),
  };
}

/** A small dot at each approximate area's center so tiny circles stay findable when zoomed out. */
export function areaCenterFeatures(spots: SpotRow[], c: AreaColors): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: spots
      .filter((s) => !s.is_exact)
      .map((s) => ({
        type: 'Feature',
        id: s.id,
        properties: { id: s.id, color: s.has_fresh_catch ? c.lapu : c.dagat },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      })),
  };
}
