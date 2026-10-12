import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { buildLaotStyle } from './laotStyle';
import type { PinPreviewMapProps } from './types';

/** A small map with a fixed center pin. Dragging the map moves the point being pinned. */
export function PinPreviewMap({ center, onCenterChange }: PinPreviewMapProps) {
  const { theme } = useUnistyles();
  const mapStyle = useMemo(() => buildLaotStyle(theme.id), [theme.id]);
  const camera = useRef<CameraRef>(null);

  // When the GPS fix arrives after the map is up, jump to it.
  useEffect(() => {
    camera.current?.jumpTo({ center: [center.lng, center.lat], zoom: 15 });
  }, [center.lat, center.lng]);

  return (
    <View style={styles.wrap}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        logo={false}
        compass={false}
        touchRotate={false}
        touchPitch={false}
        attributionPosition={{ top: 8, left: 8 }}
        tintColor={theme.colors.dagat}
        onRegionDidChange={(e) => {
          const [lng, lat] = e.nativeEvent.center;
          onCenterChange({ lat, lng });
        }}
        accessibilityLabel="Drag the map to adjust the pin">
        <Camera ref={camera} initialViewState={{ center: [center.lng, center.lat], zoom: 15 }} />
      </Map>
      <View pointerEvents="none" style={styles.pinLayer}>
        <View style={styles.pin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { flex: 1 },
  map: { flex: 1 },
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The tip of the rotated teardrop sits on the exact map center.
  pin: {
    width: 32,
    height: 32,
    marginBottom: 45,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-45deg' }],
    backgroundColor: theme.colors.mango,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    boxShadow: theme.shadow.card,
  },
}));
