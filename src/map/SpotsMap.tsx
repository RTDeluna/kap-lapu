import { Camera, GeoJSONSource, Layer, Map, Marker, type PressEventWithFeatures } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { SpotPin } from '@/components/SpotPin';

import { buildLaotStyle } from './laotStyle';
import { areaCenterFeatures, areaFeatures } from './spotFeatures';
import type { SpotsMapProps } from './types';

export function SpotsMap({
  initialCenter,
  spots,
  selectedId,
  onSelect,
  onCenterChange,
  reduceMotion,
  bottomInset,
}: SpotsMapProps) {
  const { theme } = useUnistyles();
  const mapStyle = useMemo(() => buildLaotStyle(theme.id), [theme.id]);
  const { dagat, lapu } = theme.colors;
  const areas = useMemo(() => areaFeatures(spots, { dagat, lapu }), [spots, dagat, lapu]);
  const centers = useMemo(() => areaCenterFeatures(spots, { dagat, lapu }), [spots, dagat, lapu]);
  const exact = spots.filter((s) => s.is_exact);

  const pressArea = (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
    e.stopPropagation();
    const id = e.nativeEvent.features[0]?.properties?.id;
    if (typeof id === 'string') onSelect(id);
  };

  return (
    <Map
      style={styles.map}
      mapStyle={mapStyle}
      logo={false}
      compass={false}
      touchPitch={false}
      attribution
      attributionPosition={{ bottom: bottomInset + 8, left: 8 }}
      tintColor={theme.colors.dagat}
      onPress={() => onSelect(null)}
      onRegionDidChange={(e) => {
        if (!e.nativeEvent.userInteraction) return;
        const [lng, lat] = e.nativeEvent.center;
        onCenterChange({ lat, lng });
      }}
      accessibilityLabel="Map of fishing spots">
      <Camera initialViewState={{ center: [initialCenter.lng, initialCenter.lat], zoom: 12 }} minZoom={6} maxZoom={18} />

      <GeoJSONSource id="spot-areas" data={areas} onPress={pressArea}>
        <Layer id="spot-area-fill" type="fill" paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.14 }} />
        <Layer
          id="spot-area-edge"
          type="line"
          paint={{ 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 1.5] }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="spot-area-centers" data={centers} onPress={pressArea} hitbox={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Layer id="spot-area-dot" type="circle" paint={{ 'circle-radius': 5, 'circle-color': ['get', 'color'] }} />
      </GeoJSONSource>

      {exact.map((s) => (
        <Marker
          key={s.id}
          id={`pin-${s.id}`}
          lngLat={[s.lng, s.lat]}
          anchor="bottom"
          selected={s.id === selectedId}
          onPress={() => onSelect(s.id)}
          accessibilityRole="button"
          accessibilityLabel={`Spot ${s.name}`}>
          <SpotPin fresh={s.has_fresh_catch} selected={s.id === selectedId} reduceMotion={reduceMotion} />
        </Marker>
      ))}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
