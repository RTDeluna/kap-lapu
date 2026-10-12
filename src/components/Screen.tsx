import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Leave room at the bottom for a sticky action bar. */
  bottomInset?: number;
  /** Respect the status bar inset (tabs and screens without a header). */
  topInset?: boolean;
}

/** The sand (or night sea) page with the 16px gutter. */
export function Screen({ children, scroll = true, bottomInset = 0, topInset = true }: ScreenProps) {
  if (!scroll) return <View style={[styles.page, styles.content(bottomInset, topInset)]}>{children}</View>;
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content(bottomInset, topInset)}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  page: { flex: 1, backgroundColor: theme.colors.surface },
  content: (bottomInset: number, topInset: boolean) => ({
    paddingHorizontal: theme.space[4],
    paddingTop: topInset ? rt.insets.top + theme.space[5] : theme.space[4],
    paddingBottom: theme.space[6] + bottomInset,
    gap: theme.space[4],
  }),
}));
