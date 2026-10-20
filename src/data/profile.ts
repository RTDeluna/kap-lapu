import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from './auth';
import { supabase } from './supabase';
import type { ProfileRow } from './types';

export function useMyProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_path, bio')
        .eq('id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileRow | null) ?? null;
    },
  });
}

export function useUpdateDisplayName() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      const trimmed = displayName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed === '' ? null : trimmed })
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}
