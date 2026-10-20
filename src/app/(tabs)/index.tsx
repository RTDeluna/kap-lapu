import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { ICON_INLINE, MagnifyingGlassIcon, MapPinIcon, XIcon } from '@/components/icons';
import { SpotCard } from '@/components/SpotCard';
import { useAuth, useRequireAuth } from '@/data/auth';
import { useNearbySpots, type SpotFilter } from '@/data/spots';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { MARIVELES, type LatLng } from '@/lib/geo';
import { SpotsMap } from '@/map/SpotsMap';

const FILTERS: { key: SpotFilter; label: string }[] = [
  { key: 'all', label: 'Spots' },
  { key: 'shore', label: 'Shore' },
  { key: 'jigging', label: 'Jigging' },
  { key: 'fresh', label: 'Fresh catch' },
];

export default function MapaScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();
  const { userId } = useAuth();
  const requireAuth = useRequireAuth();
  const reduceMotion = useReduceMotion();

  const [center, setCenter] = useState<LatLng>(MARIVELES);
  const [filter, setFilter] = useState<SpotFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const spotsQuery = useNearbySpots(center, filter);
  const spots = useMemo(() => {
    const all = spotsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) => s.name.toLowerCase().includes(q) || s.species.some((sp) => sp.toLowerCase().includes(q)),
    );
  }, [spotsQuery.data, search]);
  const selected = spots.find((s) => s.id === selectedId) ?? null;
  const showEmpty = !selected && spotsQuery.isSuccess && spots.length === 0;
  const showError = !selected && spotsQuery.isError;

  const pinThisSpot = () => requireAuth(() => router.push('/pin-spot'), '/pin-spot');

  return (
    <View style={styles.screen}>
      <SpotsMap
        initialCenter={MARIVELES}
        spots={spots}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCenterChange={setCenter}
        reduceMotion={reduceMotion}
        bottomInset={selected ? 180 : 80}
      />

      <View style={styles.top} pointerEvents="box-none">
        <View style={styles.search}>
          <MagnifyingGlassIcon size={ICON_INLINE} color={theme.colors.inkMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Saan tayo mangingisda?"
            placeholderTextColor={theme.colors.inkMuted}
            selectionColor={theme.colors.dagat}
            accessibilityLabel="Search spots"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clear}>
              <XIcon size={ICON_INLINE} color={theme.colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          accessibilityRole="tablist">
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.fabRow} pointerEvents="box-none">
          <Pressable
            onPress={pinThisSpot}
            accessibilityRole="button"
            accessibilityHint={userId ? undefined : 'Mag sign in muna'}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
            <MapPinIcon size={ICON_INLINE} color={theme.colors.onMango} weight="bold" />
            <AppText variant="bodyStrong" tone="onMango" style={styles.fabLabel}>
              Pin this spot
            </AppText>
          </Pressable>
        </View>

        {selected ? <SpotCard spot={selected} viewerId={userId} reduceMotion={reduceMotion} /> : null}

        {showEmpty ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <AppText variant="bodyStrong">
              {search ? 'Walang tugma dito.' : 'Wala pang spot dito. Ikaw na ang mauna.'}
            </AppText>
          </View>
        ) : null}

        {showError ? (
          <Pressable
            style={styles.notice}
            onPress={() => void spotsQuery.refetch()}
            accessibilityRole="button"
            accessibilityLiveRegion="polite">
            <AppText variant="bodyStrong" tone="danger">
              Hindi ma-load ang mga spot.
            </AppText>
            <AppText variant="bodySm" tone="dagat">
              Subukan ulit
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, backgroundColor: theme.colors.mapWater },
  top: {
    position: 'absolute',
    top: rt.insets.top + theme.space[4],
    left: 0,
    right: 0,
    gap: theme.space[1],
  },
  search: {
    marginHorizontal: theme.space[4],
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: theme.space[4],
    paddingRight: theme.space[1],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.shadow.card,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.ink,
    fontFamily: theme.text.body.fontFamily,
    fontSize: theme.text.body.fontSize,
  },
  clear: { width: theme.size.tapMin, height: theme.size.tapMin, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: theme.space[2], paddingHorizontal: theme.space[4] },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: theme.space[3] },
  fabRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: theme.space[4] },
  fab: {
    height: 52,
    paddingHorizontal: theme.space[5],
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.mango,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    boxShadow: theme.shadow.card,
  },
  fabLabel: { fontFamily: theme.text.headline.fontFamily },
  pressed: { opacity: 0.85 },
  notice: {
    marginHorizontal: theme.space[4],
    marginBottom: theme.space[4],
    minHeight: theme.size.tapMin,
    padding: theme.space[4],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.shadow.card,
    gap: theme.space[1],
  },
}));
