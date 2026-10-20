import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from './supabase';
import type { ConversationRow, MessageRow } from './types';

const MESSAGE_COLUMNS = 'id, conversation_id, sender_id, body, flagged, flag_reason, created_at';

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, boat_id, renter_id, boat:boats(id, name, owner_id)')
        .eq('id', conversationId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ConversationRow | null) ?? null;
    },
  });
}

function upsertMessage(list: MessageRow[] | undefined, msg: MessageRow): MessageRow[] {
  const rest = (list ?? []).filter((m) => m.id !== msg.id);
  return [...rest, msg].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Messages, oldest first, kept live with a realtime subscription on this conversation. */
export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient();
  const key = ['messages', conversationId];

  const query = useQuery({
    queryKey: key,
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .eq('conversation_id', conversationId as string)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as Partial<MessageRow>).id;
            qc.setQueryData<MessageRow[]>(['messages', conversationId], (list) => list?.filter((m) => m.id !== oldId));
            return;
          }
          qc.setQueryData<MessageRow[]>(['messages', conversationId], (list) =>
            upsertMessage(list, payload.new as MessageRow),
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage(conversationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      // sender_id defaults to auth.uid(); the server sets flagged and flag_reason.
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId as string, body })
        .select(MESSAGE_COLUMNS)
        .single();
      if (error) throw error;
      return data as MessageRow;
    },
    onSuccess: (msg) => {
      qc.setQueryData<MessageRow[]>(['messages', conversationId], (list) => upsertMessage(list, msg));
    },
  });
}
