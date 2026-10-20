import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Filter chip. The selected chip is mango, the only other place mango is allowed.
 * The pill is 40px like the mockup, inside a 48px tall touch target.
 */
export function Chip({ label, selected, onPress }: ChipProps) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.target, pressed && styles.pressed]}>
      <View style={styles.chip}>
        <AppText variant="bodySm" style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  target: {
    minHeight: theme.size.tapMin,
    justifyContent: 'center',
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    boxShadow: theme.shadow.card,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.mango, borderColor: theme.colors.mango },
        false: { backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.lineStrong },
      },
    },
  },
  label: {
    variants: {
      selected: {
        true: { color: theme.colors.onMango, fontFamily: theme.text.headline.fontFamily },
        false: { color: theme.colors.ink, fontFamily: theme.text.bodyStrong.fontFamily },
      },
    },
  },
  pressed: { opacity: 0.85 },
}));
