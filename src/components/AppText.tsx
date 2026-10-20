import { Text, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { TextVariant } from '@/theme/themes';

export type TextTone = 'ink' | 'muted' | 'dagat' | 'mangoInk' | 'lapuInk' | 'danger' | 'onMango' | 'onDagat';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Tabular figures for prices, distances, weights and counts. */
  tabular?: boolean;
}

/** All text in the app goes through here so it follows the type scale in tokens.json. */
export function AppText({ variant = 'body', tone = 'ink', tabular = false, style, ...rest }: AppTextProps) {
  styles.useVariants({ variant, tone, tabular });
  return <Text maxFontSizeMultiplier={1.6} {...rest} style={[styles.text, style]} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: {
        display: theme.text.display,
        titleLg: theme.text.titleLg,
        title: theme.text.title,
        headline: theme.text.headline,
        body: theme.text.body,
        bodyStrong: theme.text.bodyStrong,
        bodySm: theme.text.bodySm,
        label: theme.text.label,
        caption: theme.text.caption,
      },
      tone: {
        ink: { color: theme.colors.ink },
        muted: { color: theme.colors.inkMuted },
        dagat: { color: theme.colors.dagat },
        mangoInk: { color: theme.colors.mangoInk },
        lapuInk: { color: theme.colors.lapuInk },
        danger: { color: theme.colors.danger },
        onMango: { color: theme.colors.onMango },
        onDagat: { color: theme.colors.onDagat },
      },
      tabular: {
        true: { fontVariant: ['tabular-nums'] },
        false: {},
      },
    },
  },
}));
