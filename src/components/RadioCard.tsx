import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface RadioCardProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

/** One option in a radio group: dagat-soft with a dagat edge when chosen. */
export function RadioCard({ title, description, selected, onPress }: RadioCardProps) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.radio}>{selected ? <View style={styles.dot} /> : null}</View>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="bodySm" tone={selected ? 'ink' : 'muted'}>
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    minHeight: theme.size.tapMin,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.dagatSoft, borderWidth: 2, borderColor: theme.colors.dagat },
        false: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1.5, borderColor: theme.colors.lineStrong },
      },
    },
  },
  pressed: { opacity: 0.85 },
  radio: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      selected: {
        true: { borderColor: theme.colors.dagat },
        false: { borderColor: theme.colors.lineStrong },
      },
    },
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.dagat },
  text: { flex: 1, gap: 2 },
}));
