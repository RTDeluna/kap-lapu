import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import type { SpotRow } from '@/data/types';
import { formatCatchCount, formatDistance } from '@/lib/format';
import { privacyLine } from '@/lib/privacy';

import { AppText } from './AppText';
import { FreshCatchTag } from './Badges';
import { PrivacyLine } from './PrivacyLine';

export interface SpotCardProps {
  spot: SpotRow;
  viewerId: string | null;
  reduceMotion: boolean;
}

/** The bottom card when a pin or area is tapped on the map. */
export function SpotCard({ spot, viewerId, reduceMotion }: SpotCardProps) {
  const meta = [formatDistance(spot.distance_m), formatCatchCount(spot.catch_count), ...spot.methods.slice(0, 2)]
    .filter(Boolean)
    .join(' · ');
  return (
    <Animated.View
      entering={reduceMotion ? undefined : SlideInDown.springify().damping(18)}
      style={styles.card}
      accessibilityLabel={`Selected spot ${spot.name}`}>
      <View style={styles.grip} />
      <View style={styles.titleRow}>
        <AppText variant="title" numberOfLines={1} style={styles.title}>
          {spot.name}
        </AppText>
        {spot.has_fresh_catch ? <FreshCatchTag /> : null}
      </View>
      <AppText variant="bodySm" tone="muted" tabular numberOfLines={1}>
        {meta}
      </AppText>
      <View style={styles.footer}>
        <PrivacyLine line={privacyLine(spot, viewerId)} suffix={`@${spot.author_handle}`} />
        <Link href={{ pathname: '/spot/[id]', params: { id: spot.id } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`Tingnan ${spot.name}`} style={styles.link}>
            <AppText variant="bodySm" tone="dagat" style={styles.linkText}>
              Tingnan
            </AppText>
          </Pressable>
        </Link>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingTop: 10,
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[3],
    gap: theme.space[2],
    boxShadow: theme.shadow.sheet,
  },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: theme.radius.pill, backgroundColor: theme.colors.line },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[2] },
  title: { flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: theme.space[1],
    gap: theme.space[2],
  },
  link: { minHeight: theme.size.tapMin, minWidth: theme.size.tapMin, justifyContent: 'center', alignItems: 'flex-end' },
  linkText: { fontFamily: theme.text.headline.fontFamily },
}));
