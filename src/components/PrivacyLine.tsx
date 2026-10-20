import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { PrivacyLine as PrivacyLineText } from '@/lib/privacy';

import { AppText } from './AppText';
import { CircleDashedIcon, LockSimpleIcon, MapPinIcon, UsersThreeIcon } from './icons';

export interface PrivacyLineProps {
  line: PrivacyLineText;
  /** Optional longer text replacing the short line (spot detail). */
  text?: string;
  /** Appended after a dot, like "@kuyajun". */
  suffix?: string;
}

const ICONS = {
  'Approximate area': CircleDashedIcon,
  'Exact pin': MapPinIcon,
  'Followers only': UsersThreeIcon,
  'Only you': LockSimpleIcon,
} as const;

/** Every spot shows who can see what. Dagat, because it is about trust. */
export function PrivacyLine({ line, text, suffix }: PrivacyLineProps) {
  const { theme } = useUnistyles();
  const Icon = ICONS[line];
  return (
    <View style={styles.row}>
      <Icon size={16} color={theme.colors.dagat} weight="bold" />
      <AppText variant="bodySm" tone="dagat" style={styles.text}>
        {text ?? line}
        {suffix ? ` · ${suffix}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  text: { fontFamily: theme.text.bodyStrong.fontFamily, flexShrink: 1 },
}));
