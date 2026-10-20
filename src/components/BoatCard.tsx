import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { BoatRow } from '@/data/types';
import { PAPERS_IN_REVIEW, rateLines } from '@/lib/rates';

import { AppText } from './AppText';
import { BoatBadges } from './Badges';
import { BoatIcon } from './icons';

/** A boat in the Bangka list. Prices only for Licensed boats. */
export function BoatCard({ boat }: { boat: BoatRow }) {
  const { theme } = useUnistyles();
  const licensed = boat.badge === 'licensed';
  const lines = licensed ? rateLines(boat.rates) : [];
  styles.useVariants({ licensed });
  return (
    <Link href={{ pathname: '/boat/[id]', params: { id: boat.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${boat.name}. ${licensed ? 'Licensed' : 'ID verified'}. ${lines.join('. ') || PAPERS_IN_REVIEW}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.thumb}>
          <BoatIcon size={32} color={licensed ? theme.colors.dagat : theme.colors.inkMuted} weight="duotone" />
        </View>
        <View style={styles.body}>
          <BoatBadges badge={boat.badge} />
          <AppText variant="title" numberOfLines={2}>
            {boat.name}
          </AppText>
          <AppText variant="bodySm" tone="muted" numberOfLines={1}>
            {boat.home_port} · Up to {boat.capacity} people
          </AppText>
          {licensed && lines.length > 0 ? (
            lines.map((line) => (
              <AppText key={line} variant="headline" tone="mangoInk" tabular>
                {line}
              </AppText>
            ))
          ) : (
            <AppText variant="bodySm" tone="muted">
              {licensed ? 'Rates coming soon. Chat to ask.' : PAPERS_IN_REVIEW}
            </AppText>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.space[3],
    padding: theme.space[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceRaised,
    variants: {
      licensed: {
        true: { borderWidth: 0 },
        false: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.line },
      },
    },
  },
  pressed: { opacity: 0.85 },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      licensed: {
        true: { backgroundColor: theme.colors.mapWater },
        false: { backgroundColor: theme.colors.surfaceSunk },
      },
    },
  },
  body: { flex: 1, gap: theme.space[1], minWidth: 0 },
}));
