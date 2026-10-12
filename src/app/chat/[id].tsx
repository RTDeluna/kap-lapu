import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { CaretLeftIcon, PaperPlaneRightIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { MessageBubble } from '@/components/MessageBubble';
import { useAuth } from '@/data/auth';
import { useConversation, useMessages, useSendMessage } from '@/data/chat';
import { errorMessage } from '@/data/supabase';
import type { MessageRow } from '@/data/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { userId, loading } = useAuth();
  const conversation = useConversation(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');
  const list = useRef<FlatList<MessageRow>>(null);

  if (!loading && !userId) return <Redirect href="/sign-in" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/bangka'));
  const boatName = conversation.data?.boat?.name ?? 'Bangka';
  const iAmRenter = conversation.data?.renter_id === userId;

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body, { onSuccess: () => setDraft('') });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={back}>
          <CaretLeftIcon size={22} color={theme.colors.ink} weight="bold" />
        </IconButton>
        <View style={styles.flex}>
          <AppText variant="headline" numberOfLines={1} accessibilityRole="header">
            {boatName}
          </AppText>
          <AppText variant="bodySm" tone="muted">
            {iAmRenter ? 'Owner at coordinator' : 'Inquiry'}
          </AppText>
        </View>
      </View>

      {/* Persistent: stays on top no matter how far the chat scrolls. */}
      <View style={styles.banner}>
        <Banner tone="caution">Huwag magbayad bago sumakay. Hindi kailanman hihingi ang Laot ng OTP.</Banner>
      </View>

      {messages.isPending ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={theme.colors.dagat} />
        </View>
      ) : (
        <FlatList
          ref={list}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={messages.data ?? []}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} mine={item.sender_id === userId} />}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <AppText tone="muted" style={styles.emptyText}>
              Kumusta po? Itanong ang petsa, ilang tao, at saan kayo susunduin.
            </AppText>
          }
        />
      )}

      {send.error ? (
        <View style={styles.sendError}>
          <Banner tone="danger">{errorMessage(send.error)}</Banner>
        </View>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Mag message po..."
          placeholderTextColor={theme.colors.inkMuted}
          selectionColor={theme.colors.dagat}
          accessibilityLabel="Message"
          multiline
          maxLength={2000}
          style={styles.input}
        />
        <IconButton
          accessibilityLabel="Send message"
          onPress={submit}
          disabled={!draft.trim() || send.isPending}
          accessibilityState={{ disabled: !draft.trim() || send.isPending }}>
          {send.isPending ? (
            <ActivityIndicator color={theme.colors.dagat} />
          ) : (
            <PaperPlaneRightIcon size={24} color={draft.trim() ? theme.colors.dagat : theme.colors.inkMuted} weight="fill" />
          )}
        </IconButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingTop: rt.insets.top + theme.space[2],
    paddingHorizontal: theme.space[2],
    paddingBottom: theme.space[2],
    backgroundColor: theme.colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  banner: { paddingHorizontal: theme.space[4], paddingTop: theme.space[3] },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: theme.space[4], gap: theme.space[3], flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: theme.space[8] },
  sendError: { paddingHorizontal: theme.space[4], paddingBottom: theme.space[2] },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space[2],
    paddingHorizontal: theme.space[4],
    paddingTop: theme.space[2],
    paddingBottom: Math.max(rt.insets.bottom, theme.space[3]),
    backgroundColor: theme.colors.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  input: {
    flex: 1,
    minHeight: theme.size.tapMin,
    maxHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.lineStrong,
    backgroundColor: theme.colors.surface,
    color: theme.colors.ink,
    fontFamily: theme.text.body.fontFamily,
    fontSize: theme.text.body.fontSize,
  },
}));
