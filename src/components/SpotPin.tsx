import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { FishSimpleIcon, FlameIcon } from './icons';

export interface SpotPinProps {
  fresh: boolean;
  selected: boolean;
  reduceMotion: boolean;
}

/**
 * The exact-pin teardrop. dagat by default, lapu with a lapu-soft halo for a fresh
 * catch, and a mango fill with an ink ring when selected. Icons only, never text.
 */
export function SpotPin({ fresh, selected, reduceMotion }: SpotPinProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ tone: selected ? 'selected' : fresh ? 'fresh' : 'base' });
  const glyph = selected ? theme.colors.onMango : fresh ? theme.colors.onLapu : theme.colors.onDagat;
  const Icon = fresh ? FlameIcon : FishSimpleIcon;
  return (
    <Animated.View entering={reduceMotion ? undefined : ZoomIn.springify().damping(14)} style={styles.hit}>
      <View style={styles.pin}>
        <View style={styles.glyph}>
          <Icon size={16} color={glyph} weight="bold" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // 48px touch target around the 36px pin.
  hit: { width: theme.size.tapMin, height: theme.size.tapMin, alignItems: 'center', justifyContent: 'center' },
  pin: {
    width: theme.size.pin,
    height: theme.size.pin,
    borderTopLeftRadius: theme.size.pin / 2,
    borderTopRightRadius: theme.size.pin / 2,
    borderBottomRightRadius: theme.size.pin / 2,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      tone: {
        base: { backgroundColor: theme.colors.dagat, boxShadow: theme.shadow.card },
        fresh: { backgroundColor: theme.colors.lapu, boxShadow: `0 0 0 6px ${theme.colors.lapuSoft}` },
        selected: { backgroundColor: theme.colors.mango, outlineColor: theme.colors.ink, outlineWidth: 3, outlineOffset: 2 },
      },
    },
  },
  glyph: { transform: [{ rotate: '45deg' }] },
}));
