import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from './AppText';
import { CaretRightIcon } from './icons';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: (color: string) => ReactNode;
  onPress?: () => void;
  tone?: 'ink' | 'danger';
  accessibilityHint?: string;
}

export function ListRow({ title, subtitle, icon, onPress, tone = 'ink', accessibilityHint }: ListRowProps) {
  const { theme } = useUnistyles();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.ink;
  const body = (
    <>
      {icon?.(color)}
      <View style={styles.text}>
        <AppText variant="bodyStrong" tone={tone}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {onPress ? <CaretRightIcon size={20} color={theme.colors.inkMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
}));
