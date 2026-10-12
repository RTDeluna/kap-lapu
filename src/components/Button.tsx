import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from './AppText';

export type ButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  /** primary is mango: use it for the one main action on a screen only. */
  tone?: ButtonTone;
  icon?: (color: string) => ReactNode;
  loading?: boolean;
  /** 56px for actions owners take on the water; 52px otherwise. */
  size?: 'regular' | 'large';
  fill?: boolean;
}

export function Button({
  label,
  tone = 'secondary',
  icon,
  loading = false,
  disabled,
  size = 'regular',
  fill = false,
  ...rest
}: ButtonProps) {
  const { theme } = useUnistyles();
  const isDisabled = disabled || loading;
  styles.useVariants({ tone, size, fill, disabled: !!isDisabled });

  const fg =
    tone === 'primary' ? theme.colors.onMango : tone === 'danger' ? theme.colors.danger : tone === 'quiet' ? theme.colors.dagat : theme.colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon?.(fg)}
          <AppText variant="bodyStrong" style={styles.label(fg)} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    minHeight: theme.size.tapMin,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space[5],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    variants: {
      tone: {
        primary: { backgroundColor: theme.colors.mango, borderColor: theme.colors.mango },
        secondary: { backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.lineStrong },
        quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
        danger: { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger },
      },
      size: {
        regular: { height: 52 },
        large: { height: 56 },
      },
      fill: {
        true: { flex: 1 },
        false: {},
      },
      disabled: {
        true: { opacity: 0.5 },
        false: {},
      },
    },
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  label: (color: string) => ({ color }),
}));
