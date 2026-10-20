import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { MapTrifoldIcon } from '@/components/icons';

/** Shown on the web, where the map is not available yet. */
export function MapFallback({ compact = false }: { compact?: boolean }) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.panel}>
      <MapTrifoldIcon size={compact ? 28 : 40} color={theme.colors.dagat} weight="duotone" />
      <AppText variant={compact ? 'headline' : 'title'} style={styles.center}>
        Nasa phone app ang mapa
      </AppText>
      {compact ? null : (
        <AppText tone="muted" style={styles.center}>
          The map is on the Laot phone app for Android and iPhone.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[3],
    padding: theme.space[6],
    backgroundColor: theme.colors.mapWater,
  },
  center: { textAlign: 'center' },
}));
