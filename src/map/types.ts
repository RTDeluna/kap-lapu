import type { SpotRow } from '@/data/types';
import type { LatLng } from '@/lib/geo';

export interface SpotsMapProps {
  initialCenter: LatLng;
  spots: SpotRow[];
  selectedId: string | null;
  onSelect: (spotId: string | null) => void;
  /** Called when the person stops panning, with the new map center. */
  onCenterChange: (center: LatLng) => void;
  reduceMotion: boolean;
  /** Space the floating card and FAB take at the bottom, so ornaments stay visible. */
  bottomInset: number;
}

export interface PinPreviewMapProps {
  /** Where the preview starts: the GPS fix, or Mariveles before there is one. */
  center: LatLng;
  /** The point under the center pin as the person drags the map. */
  onCenterChange: (center: LatLng) => void;
}
