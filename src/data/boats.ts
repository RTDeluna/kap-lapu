import { useMutation, useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { BoatRow } from './types';

const BOAT_COLUMNS =
  'id, owner_id, name, home_port, capacity, wave_limit_m, badge, rates:boat_rates(day_rate_php, seat_rate_php)';

/** Licensed boats first, then ID verified. RLS already hides hidden and blocked boats. */
export function useBoats() {
  return useQuery({
    queryKey: ['boats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select(BOAT_COLUMNS)
        .in('badge', ['verified', 'licensed'])
        .order('name');
      if (error) throw error;
      const rows = (data ?? []) as unknown as BoatRow[];
      return [...rows].sort((a, b) => Number(b.badge === 'licensed') - Number(a.badge === 'licensed'));
    },
  });
}

export function useBoat(boatId: string | undefined) {
  return useQuery({
    queryKey: ['boat', boatId],
    enabled: !!boatId,
    queryFn: async () => {
      const { data, error } = await supabase.from('boats').select(BOAT_COLUMNS).eq('id', boatId as string).maybeSingle();
      if (error) throw error;
      return (data as unknown as BoatRow | null) ?? null;
    },
  });
}

/** Opens (or reuses) the chat with the boat's owner and coordinator. */
export function useStartInquiry() {
  return useMutation({
    mutationFn: async (boatId: string) => {
      const { data, error } = await supabase.rpc('start_inquiry', { p_boat_id: boatId });
      if (error) throw error;
      return data as string;
    },
  });
}
