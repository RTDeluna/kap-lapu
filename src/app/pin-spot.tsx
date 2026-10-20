import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CameraIcon, XIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { RadioCard } from '@/components/RadioCard';
import { StickyBar, STICKY_BAR_HEIGHT } from '@/components/StickyBar';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/data/auth';
import { useDeviceLocation } from '@/data/location';
import { usePinSpot } from '@/data/spots';
import { errorMessage } from '@/data/supabase';
import type { SpotVisibility } from '@/data/types';
import { MARIVELES, type LatLng } from '@/lib/geo';
import { PinPreviewMap } from '@/map/PinPreviewMap';

const VISIBILITY: { value: SpotVisibility; title: string; description: string }[] = [
  { value: 'private', title: 'Only you', description: 'Your secret spot. Nobody else sees it.' },
  { value: 'followers', title: 'Followers', description: 'Your barkada sees the exact pin.' },
  {
    value: 'public',
    title: 'Everyone, approximate area',
    description: 'Others see a circle about 1 km wide, never the exact point.',
  },
];

export default function PinSpotScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { userId, loading } = useAuth();
  const pinSpot = usePinSpot();
  const location = useDeviceLocation();

  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<SpotVisibility>('public');
  const [point, setPoint] = useState<LatLng | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const { locate } = location;

  useEffect(() => {
    void locate();
  }, [locate]);

  if (!loading && !userId) return <Redirect href="/sign-in?next=%2Fpin-spot" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const previewCenter = location.fix ?? MARIVELES;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Lagyan ng pangalan ang spot.');
      return;
    }
    setNameError(null);
    pinSpot.mutate(
      {
        name: trimmed,
        // The point under the pin; with no map (web) it is where the phone is.
        point: point ?? previewCenter,
        visibility,
        device: location.fix,
      },
      {
        onSuccess: (spotId) => router.replace({ pathname: '/spot/[id]', params: { id: spotId } }),
      },
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <IconButton accessibilityLabel="Close" onPress={close}>
              <XIcon size={22} color={theme.colors.ink} weight="bold" />
            </IconButton>
            <AppText variant="title" accessibilityRole="header">
              Pin this spot
            </AppText>
          </View>

          <View style={styles.preview}>
            <PinPreviewMap center={previewCenter} onCenterChange={setPoint} />
            <View style={styles.previewHint} pointerEvents="none">
              <AppText variant="caption" style={styles.previewHintText}>
                Drag the map to adjust
              </AppText>
            </View>
          </View>

          {location.status === 'denied' ? (
            <Banner tone="caution">
              Walang access sa location. Pwede pa ring mag pin, pero walang Pinned on site badge.
            </Banner>
          ) : location.status === 'granted' ? (
            <AppText variant="bodySm" tone="dagat">
              Kung nasa mismong spot ka, may Pinned on site badge ito.
            </AppText>
          ) : null}

          <TextField
            label="Pangalan ng spot"
            placeholder="Lucanin rocks, north side"
            value={name}
            onChangeText={setName}
            maxLength={80}
            error={nameError}
            autoCapitalize="sentences"
          />

          <View style={styles.photos}>
            <View
              style={styles.photoTile}
              accessible
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Add photo. Photos soon.">
              <CameraIcon size={24} color={theme.colors.inkMuted} />
              <AppText variant="label" tone="muted">
                Photos soon
              </AppText>
            </View>
            <AppText variant="bodySm" tone="muted" style={styles.flex}>
              Location data will be removed from photos.
            </AppText>
          </View>

          <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Sino ang makakakita?">
            <AppText variant="title" accessibilityRole="header">
              Sino ang makakakita?
            </AppText>
            {VISIBILITY.map((v) => (
              <RadioCard
                key={v.value}
                title={v.title}
                description={v.description}
                selected={visibility === v.value}
                onPress={() => setVisibility(v.value)}
              />
            ))}
          </View>

          {pinSpot.error ? <Banner tone="danger">{errorMessage(pinSpot.error)}</Banner> : null}
        </ScrollView>

        <StickyBar>
          <Button label="Pin this spot" tone="primary" size="large" fill loading={pinSpot.isPending} onPress={submit} />
        </StickyBar>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  scroll: {
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingBottom: STICKY_BAR_HEIGHT + rt.insets.bottom + theme.space[6],
    gap: theme.space[4],
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  preview: { height: 160, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.mapWater },
  previewHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceRaised,
  },
  previewHintText: { fontFamily: theme.text.label.fontFamily, color: theme.colors.ink },
  photos: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  photoTile: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.lineStrong,
    backgroundColor: theme.colors.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    opacity: 0.7,
  },
  group: { gap: theme.space[2] },
}));
