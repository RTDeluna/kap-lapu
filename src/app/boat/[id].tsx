import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { BoatBadges } from '@/components/Badges';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { CaretLeftIcon, CheckIcon, LifebuoyIcon, WavesIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { SeaHeader } from '@/components/SeaHeader';
import { STICKY_BAR_HEIGHT, StickyBar } from '@/components/StickyBar';
import { useAuth, useRequireAuth } from '@/data/auth';
import { useBoat, useStartInquiry } from '@/data/boats';
import { errorMessage } from '@/data/supabase';
import { PAPERS_IN_REVIEW, rateLines } from '@/lib/rates';

export default function BoatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { userId } = useAuth();
  const requireAuth = useRequireAuth();
  const boatQuery = useBoat(id);
  const startInquiry = useStartInquiry();
  const boat = boatQuery.data;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/bangka'));

  if (boatQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.dagat} />
      </View>
    );
  }
  if (!boat) {
    return (
      <View style={styles.center}>
        <EmptyState title="Hindi mahanap ang bangka." action={<Button label="Balik" onPress={back} />} />
      </View>
    );
  }

  const licensed = boat.badge === 'licensed';
  const lines = licensed ? rateLines(boat.rates) : [];
  const isMine = userId === boat.owner_id;

  const message = () =>
    requireAuth(
      () =>
        startInquiry.mutate(boat.id, {
          onSuccess: (conversationId) => router.push({ pathname: '/chat/[id]', params: { id: conversationId } }),
        }),
      `/boat/${boat.id}`,
    );

  const check = (icon: ReactNode, text: string) => (
    <View style={styles.checkRow} key={text}>
      {icon}
      <AppText variant="bodySm" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
  const iconColor = theme.colors.dagat;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SeaHeader height={196}>
          <View style={styles.headerButtons}>
            <IconButton accessibilityLabel="Back to boats" floating onPress={back}>
              <CaretLeftIcon size={22} color={theme.colors.ink} weight="bold" />
            </IconButton>
          </View>
        </SeaHeader>

        <View style={styles.body}>
          <BoatBadges badge={boat.badge} />
          <View style={styles.titleBlock}>
            <AppText variant="titleLg" accessibilityRole="header">
              {boat.name}
            </AppText>
            <AppText variant="bodySm" tone="muted">
              {boat.home_port} · Up to {boat.capacity} people
            </AppText>
          </View>

          <Banner tone="caution">Sa bangka mo babayaran ang presyo ng trip. Huwag magbayad bago sumakay.</Banner>

          {licensed && lines.length > 0 ? (
            <View style={styles.card}>
              <AppText variant="bodyStrong">Presyo</AppText>
              {lines.map((line) => (
                <AppText key={line} variant="headline" tone="mangoInk" tabular>
                  {line}
                </AppText>
              ))}
              <AppText variant="caption" tone="muted">
                Bookings open soon. Mag message muna sa owner para sa petsa.
              </AppText>
            </View>
          ) : (
            <View style={styles.card}>
              <AppText tone="muted">{licensed ? 'Rates coming soon. Chat to ask.' : PAPERS_IN_REVIEW}</AppText>
            </View>
          )}

          <View style={styles.card}>
            <AppText variant="bodyStrong">Safety on board</AppText>
            {check(<LifebuoyIcon size={18} color={iconColor} weight="bold" />, `Takes up to ${boat.capacity} people`)}
            {check(
              <WavesIcon size={18} color={iconColor} weight="bold" />,
              `Stays in port if waves pass ${Number(boat.wave_limit_m).toFixed(1)} m`,
            )}
            {check(<CheckIcon size={18} color={iconColor} weight="bold" />, 'Owner ID and selfie checked')}
            {licensed
              ? check(<CheckIcon size={18} color={iconColor} weight="bold" />, 'MARINA papers reviewed')
              : null}
            <AppText variant="caption" tone="muted">
              PAGASA and Coast Guard advisories always win.
            </AppText>
          </View>

          {startInquiry.error ? <Banner tone="danger">{errorMessage(startInquiry.error)}</Banner> : null}
        </View>
      </ScrollView>

      {isMine ? null : (
        <StickyBar>
          <Button
            label="Message the owner"
            tone="primary"
            size="large"
            fill
            loading={startInquiry.isPending}
            onPress={message}
          />
        </StickyBar>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.space[4], backgroundColor: theme.colors.surface },
  scroll: { paddingBottom: STICKY_BAR_HEIGHT + rt.insets.bottom + theme.space[6] },
  headerButtons: { position: 'absolute', top: rt.insets.top + theme.space[4], left: theme.space[4] },
  body: { paddingTop: theme.space[4], paddingHorizontal: theme.space[4], gap: theme.space[4] },
  titleBlock: { gap: theme.space[1] },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: theme.space[4],
    gap: theme.space[2],
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
}));
