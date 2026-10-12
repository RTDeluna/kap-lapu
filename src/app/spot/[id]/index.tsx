import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { FreshCatchTag } from '@/components/Badges';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { CaretLeftIcon, FishIcon, MapPinIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { PrivacyLine } from '@/components/PrivacyLine';
import { SeaHeader } from '@/components/SeaHeader';
import { STICKY_BAR_HEIGHT, StickyBar } from '@/components/StickyBar';
import { useAuth, useRequireAuth } from '@/data/auth';
import { useSpotCatches } from '@/data/catches';
import { useSpot } from '@/data/spots';
import type { CatchRow } from '@/data/types';
import { directionsUrl } from '@/lib/directions';
import { formatWeightKg } from '@/lib/format';
import { privacyDetail, privacyLine } from '@/lib/privacy';
import { relativeDay } from '@/lib/time';

export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { userId } = useAuth();
  const requireAuth = useRequireAuth();
  const spotQuery = useSpot(id);
  const catchesQuery = useSpotCatches(id);
  const spot = spotQuery.data;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (spotQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.dagat} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Hindi makita ang spot"
          body="Baka private na ito o tinanggal na ng nag pin."
          action={<Button label="Balik sa mapa" onPress={back} />}
        />
      </View>
    );
  }

  const openDirections = async () => {
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    const url = directionsUrl(spot.lat, spot.lng, spot.name, platform);
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(directionsUrl(spot.lat, spot.lng, spot.name, 'web')).catch(() =>
        Alert.alert('Walang maps app', 'Hindi mabuksan ang maps app sa phone na ito.'),
      );
    }
  };

  const logCatch = () => {
    const path = `/spot/${spot.id}/log-catch`;
    requireAuth(() => router.push({ pathname: '/spot/[id]/log-catch', params: { id: spot.id } }), path);
  };

  const methods = spot.methods.length ? spot.methods.join(', ') : 'Wala pang tag';
  const catches = catchesQuery.data ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SeaHeader height={236}>
          <View style={styles.headerButtons}>
            <IconButton accessibilityLabel="Back" floating onPress={back}>
              <CaretLeftIcon size={22} color={theme.colors.ink} weight="bold" />
            </IconButton>
          </View>
        </SeaHeader>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <AppText variant="titleLg" accessibilityRole="header">
              {spot.name}
            </AppText>
            <AppText variant="bodySm" tone="muted">
              Pinned by @{spot.author_handle} · {relativeDay(spot.created_at)}
            </AppText>
            <PrivacyLine line={privacyLine(spot, userId)} text={privacyDetail(spot, userId)} />
            <View style={styles.tags}>
              {spot.has_fresh_catch ? <FreshCatchTag /> : null}
              {spot.pinned_on_site ? (
                <View style={styles.onSite}>
                  <MapPinIcon size={14} color={theme.colors.dagat} weight="bold" />
                  <AppText variant="label" tone="dagat">
                    Pinned on site
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText variant="headline" tabular>
                {spot.catch_count}
              </AppText>
              <AppText variant="label" tone="muted">
                catches logged
              </AppText>
            </View>
            <View style={styles.stat}>
              <AppText variant="headline" numberOfLines={1}>
                {spot.species[0] ?? 'Iba-iba'}
              </AppText>
              <AppText variant="label" tone="muted">
                huli dito
              </AppText>
            </View>
            <View style={styles.stat}>
              <AppText variant="headline" numberOfLines={1}>
                {spot.methods[0] ?? 'Kahit ano'}
              </AppText>
              <AppText variant="label" tone="muted" numberOfLines={1}>
                {methods}
              </AppText>
            </View>
          </View>

          {spot.notes ? <AppText>{spot.notes}</AppText> : null}

          <View>
            <AppText variant="title" accessibilityRole="header" style={styles.sectionTitle}>
              Huli dito
            </AppText>
            {catchesQuery.isPending ? (
              <ActivityIndicator color={theme.colors.dagat} />
            ) : catches.length === 0 ? (
              <AppText tone="muted">Wala pang huli dito. Ikaw na ang mauna.</AppText>
            ) : (
              catches.map((c) => <CatchItem key={c.id} item={c} />)
            )}
          </View>
        </View>
      </ScrollView>

      <StickyBar>
        <Button label="Directions" onPress={() => void openDirections()} accessibilityHint="Opens your maps app" />
        <Button label="Log a catch here" tone="primary" fill onPress={logCatch} />
      </StickyBar>
    </View>
  );
}

function CatchItem({ item }: { item: CatchRow }) {
  const { theme } = useUnistyles();
  styles.useVariants({ fresh: item.fresh_capture });
  const title = item.weight_kg != null ? `${item.species}, ${formatWeightKg(item.weight_kg)}` : item.species;
  const meta = [item.angler ? `@${item.angler.handle}` : null, item.method, relativeDay(item.caught_at)]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.catchRow}>
      <View style={styles.catchIcon}>
        <FishIcon size={22} color={item.fresh_capture ? theme.colors.lapuInk : theme.colors.ink} />
      </View>
      <View style={styles.catchText}>
        <AppText variant="bodyStrong" tabular>
          {title}
        </AppText>
        <AppText variant="bodySm" tone="muted">
          {meta}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.space[4], backgroundColor: theme.colors.surface },
  scroll: { paddingBottom: STICKY_BAR_HEIGHT + rt.insets.bottom + theme.space[6] },
  headerButtons: {
    position: 'absolute',
    top: rt.insets.top + theme.space[4],
    left: theme.space[4],
  },
  body: { paddingTop: theme.space[5], paddingHorizontal: theme.space[4], gap: theme.space[5] },
  titleBlock: { gap: 6 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  onSite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.dagatSoft,
  },
  stats: { flexDirection: 'row', gap: theme.space[2] },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    padding: theme.space[3],
    gap: 2,
  },
  sectionTitle: { marginBottom: 6 },
  catchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  catchIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      fresh: {
        true: { backgroundColor: theme.colors.lapuSoft },
        false: { backgroundColor: theme.colors.surfaceSunk },
      },
    },
  },
  catchText: { flex: 1 },
}));
