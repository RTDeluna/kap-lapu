import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { BoatBadge } from '@/data/types';

import { AppText } from './AppText';
import { FlameIcon, IdentificationCardIcon, ShieldCheckIcon } from './icons';

/** Licensed: MARINA papers passed review. dagat on dagat-soft with a shield. */
export function LicensedBadge() {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.badge, styles.licensed]} accessibilityLabel="Licensed">
      <ShieldCheckIcon size={14} color={theme.colors.dagat} weight="bold" />
      <AppText variant="label" tone="dagat">
        Licensed
      </AppText>
    </View>
  );
}

/** ID verified: the owner passed the ID and selfie check. ink on surface-sunk. */
export function VerifiedBadge() {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.badge, styles.verified]} accessibilityLabel="ID verified">
      <IdentificationCardIcon size={14} color={theme.colors.ink} weight="bold" />
      <AppText variant="label">ID verified</AppText>
    </View>
  );
}

/** Both badges a boat has earned: Licensed implies the ID check passed too. */
export function BoatBadges({ badge }: { badge: BoatBadge }) {
  if (badge === 'none') return null;
  return (
    <View style={styles.row}>
      {badge === 'licensed' ? <LicensedBadge /> : null}
      <VerifiedBadge />
    </View>
  );
}

/** Fresh catch: lapu-ink on lapu-soft, never text on lapu. */
export function FreshCatchTag() {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.badge, styles.fresh]}>
      <FlameIcon size={14} color={theme.colors.lapuInk} weight="bold" />
      <AppText variant="label" tone="lapuInk">
        Fresh catch
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[1],
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: theme.radius.pill,
  },
  licensed: { backgroundColor: theme.colors.dagatSoft },
  verified: { backgroundColor: theme.colors.surfaceSunk },
  fresh: { backgroundColor: theme.colors.lapuSoft },
}));
