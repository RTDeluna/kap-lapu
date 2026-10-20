import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { CatchRow } from './types';

const CATCH_COLUMNS = 'id, angler_id, spot_id, species, weight_kg, method, caught_at, fresh_capture, angler:profiles(handle)';

export function useSpotCatches(spotId: string | undefined) {
  return useQuery({
    queryKey: ['catches', spotId],
    enabled: !!spotId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catches')
        .select(CATCH_COLUMNS)
        .eq('spot_id', spotId as string)
        .order('caught_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CatchRow[];
    },
  });
}

export interface LogCatchInput {
  spotId: string;
  species: string;
  weightKg: number | null;
  method: string | null;
}

export function useLogCatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogCatchInput) => {
      // angler_id defaults to auth.uid() on the server; only granted columns are sent.
      const { error } = await supabase.from('catches').insert({
        spot_id: input.spotId,
        species: input.species,
        weight_kg: input.weightKg,
        method: input.method,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ['catches', input.spotId] });
      void qc.invalidateQueries({ queryKey: ['spot', input.spotId] });
      void qc.invalidateQueries({ queryKey: ['nearby_spots'] });
    },
  });
}
