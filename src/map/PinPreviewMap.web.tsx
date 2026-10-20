import { MapFallback } from './MapFallback';
import type { PinPreviewMapProps } from './types';

/** On the web the pin goes where the browser says you are; no map preview yet. */
export function PinPreviewMap(_props: PinPreviewMapProps) {
  return <MapFallback compact />;
}
