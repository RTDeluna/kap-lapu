import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Required: icon-only buttons must say what they do. */
  accessibilityLabel: string;
  children: ReactNode;
  /** Floats over the map or a photo, so it gets a raised surface and shadow. */
  floating?: boolean;
}

export function IconButton({ children, floating = false, ...rest }: IconButtonProps) {
  styles.useVariants({ floating });
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      {...rest}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    width: theme.size.tapMin,
    height: theme.size.tapMin,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      floating: {
        true: { backgroundColor: theme.colors.surfaceRaised, boxShadow: theme.shadow.card },
        false: {},
      },
    },
  },
  pressed: { opacity: 0.7 },
}));
