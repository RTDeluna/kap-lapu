export type MapsPlatform = 'ios' | 'android' | 'web';

/**
 * A URL that opens the phone's maps app with directions to the point shown.
 * We only ever pass the point the viewer can already see (exact pin or area center).
 */
export function directionsUrl(lat: number, lng: number, label: string, platform: MapsPlatform): string {
  const ll = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const q = encodeURIComponent(label);
  switch (platform) {
    case 'ios':
      return `maps:?daddr=${ll}&q=${q}`;
    case 'android':
      return `geo:${ll}?q=${ll}(${q})`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
  }
}
