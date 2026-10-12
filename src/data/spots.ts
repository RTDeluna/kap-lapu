import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LatLng } from '@/lib/geo';

import { supabase } from './supabase';
import type { SpotDetail, SpotRow, SpotVisibility } from './types';

export type SpotFilter = 'all' | 'shore' | 'jigging' | 'fresh';

const methodFor: Record<SpotFilter, string | null> = {
  all: null,
  shore: 'shore',
  jigging: 'jigging',
  fresh: null,
};

/** Rounds the query point so small pans reuse the cache instead of refetching. */
const roundCoord = (n: number) => Math.round(n * 200) / 200;

export function useNearbySpots(center: LatLng, filter: SpotFilter, radiusM = 20_000) {
  const lat = roundCoord(center.lat);
  const lng = roundCoord(center.lng);
  const method = methodFor[filter];
  return useQuery({
    queryKey: ['nearby_spots', lat, lng, radiusM, method],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('nearby_spots', {
        p_lat: lat,
        p_lng: lng,
        p_radius_m: radiusM,
        p_method: method,
      });
      if (error) throw error;
      return (data ?? []) as SpotRow[];
    },
    placeholderData: keepPreviousData,
    select: (rows) => (filter === 'fresh' ? rows.filter((s) => s.has_fresh_catch) : rows),
  });
}

export function useSpot(spotId: string | undefined) {
  return useQuery({
    queryKey: ['spot', spotId],
    enabled: !!spotId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_spot', { p_spot_id: spotId });
      if (error) throw error;
      const rows = (Array.isArray(data) ? data : data ? [data] : []) as SpotDetail[];
      return rows[0] ?? null;
    },
  });
}

export interface PinSpotInput {
  name: string;
  point: LatLng;
  visibility: SpotVisibility;
  methods?: string[];
  species?: string[];
  notes?: string | null;
  /** The phone's GPS fix at the moment of pinning, or null. */
  device: LatLng | null;
}

export function usePinSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PinSpotInput) => {
      const { data, error } = await supabase.rpc('pin_spot', {
        p_name: input.name,
        p_lat: input.point.lat,
        p_lng: input.point.lng,
        p_visibility: input.visibility,
        p_methods: input.methods ?? [],
        p_species: input.species ?? [],
        p_notes: input.notes ?? null,
        p_device_lat: input.device?.lat ?? null,
        p_device_lng: input.device?.lng ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nearby_spots'] }),
  });
}
