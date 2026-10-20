import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from './AppText';
import { InfoIcon, ShieldCheckIcon, WarningIcon } from './icons';

export type BannerTone = 'trust' | 'caution' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  children: ReactNode;
  title?: string;
}

/**
 * Safety and trust lines. trust is dagat, caution is mango-soft with mango-ink,
 * danger is danger-soft and always carries an icon with the words.
 */
export function Banner({ tone = 'trust', title, children }: BannerProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ tone });
  const color = tone === 'trust' ? theme.colors.dagat : tone === 'caution' ? theme.colors.mangoInk : theme.colors.danger;
  const Icon = tone === 'trust' ? ShieldCheckIcon : tone === 'caution' ? InfoIcon : WarningIcon;
  return (
    <View style={styles.banner} accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}>
      <Icon size={20} color={color} weight="bold" />
      <View style={styles.text}>
        {title ? (
          <AppText variant="bodyStrong" style={styles.color(color)}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="bodySm" style={styles.color(tone === 'trust' ? theme.colors.ink : color)}>
          {children}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  banner: {
    flexDirection: 'row',
    gap: theme.space[3],
    alignItems: 'flex-start',
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    variants: {
      tone: {
        trust: { backgroundColor: theme.colors.dagatSoft },
        caution: { backgroundColor: theme.colors.mangoSoft },
        danger: { backgroundColor: theme.colors.dangerSoft },
      },
    },
  },
  text: { flex: 1, gap: 2 },
  color: (color: string) => ({ color }),
}));
