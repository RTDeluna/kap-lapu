import { MapFallback } from './MapFallback';
import type { SpotsMapProps } from './types';

/** The web build has no MapLibre native view; the map lives in the phone app. */
export function SpotsMap(_props: SpotsMapProps) {
  return <MapFallback />;
}
