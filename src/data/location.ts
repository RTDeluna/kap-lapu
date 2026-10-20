import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import type { LatLng } from '@/lib/geo';

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'error';

/**
 * Foreground location only. Asks for permission the first time it is needed and
 * returns a single fix. Never tracks in the background.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [fix, setFix] = useState<LatLng | null>(null);

  const locate = useCallback(async (): Promise<LatLng | null> => {
    setStatus('locating');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setStatus('denied');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setFix(next);
      setStatus('granted');
      return next;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { status, fix, locate };
}
