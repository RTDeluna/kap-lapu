import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { MessageRow } from '@/data/types';
import { clockTime } from '@/lib/time';

import { AppText } from './AppText';
import { WarningIcon } from './icons';

/** The exact copy from docs/api-contract.md, shown above a flagged message. */
export const FLAGGED_WARNING = 'Ingat po. Hindi kailanman hihingi ang Laot ng OTP, at hindi ka magbabayad bago sumakay.';

export function FlaggedWarning() {
  const { theme } = useUnistyles();
  return (
    <View style={styles.warning} accessibilityRole="alert">
      <WarningIcon size={20} color={theme.colors.danger} weight="bold" />
      <AppText variant="bodySm" tone="danger" style={styles.warningText}>
        {FLAGGED_WARNING}
      </AppText>
    </View>
  );
}

export function MessageBubble({ message, mine }: { message: MessageRow; mine: boolean }) {
  styles.useVariants({ mine });
  return (
    <View style={styles.wrap}>
      {message.flagged ? <FlaggedWarning /> : null}
      <View style={styles.bubble}>
        <AppText selectable>{message.body}</AppText>
        <AppText variant="caption" tone="muted" tabular style={styles.time}>
          {clockTime(message.created_at)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    gap: 6,
    variants: {
      mine: {
        true: { alignItems: 'flex-end' },
        false: { alignItems: 'flex-start' },
      },
    },
  },
  bubble: {
    maxWidth: '82%',
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.md,
    gap: 2,
    variants: {
      mine: {
        true: { backgroundColor: theme.colors.dagatSoft, borderBottomRightRadius: 4 },
        false: { backgroundColor: theme.colors.surfaceRaised, borderBottomLeftRadius: 4 },
      },
    },
  },
  time: { alignSelf: 'flex-end' },
  warning: {
    flexDirection: 'row',
    gap: theme.space[2],
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSoft,
  },
  warningText: { flex: 1, fontFamily: theme.text.bodyStrong.fontFamily },
}));
