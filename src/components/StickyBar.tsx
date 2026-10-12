import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** The raised bar at the bottom of detail screens. Floats, so it gets shadow-sheet. */
export function StickyBar({ children }: { children: ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

export const STICKY_BAR_HEIGHT = 84;

const styles = StyleSheet.create((theme, rt) => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingBottom: Math.max(rt.insets.bottom, theme.space[5]),
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.shadow.sheet,
  },
}));
