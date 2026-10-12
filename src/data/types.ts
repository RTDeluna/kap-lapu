// Row shapes the app reads, matching docs/api-contract.md and supabase/migrations.
// TODO: replace with `supabase gen types typescript` output when the schema settles.

import type { SpotVisibility } from '@/lib/privacy';

export type { SpotVisibility };
export type BoatBadge = 'none' | 'verified' | 'licensed';

/** One row of nearby_spots(). get_spot() returns the same minus distance_m, plus notes. */
export interface SpotRow {
  id: string;
  name: string;
  author_id: string;
  author_handle: string;
  visibility: SpotVisibility;
  lat: number;
  lng: number;
  is_exact: boolean;
  area_radius_m: number;
  pinned_on_site: boolean;
  catch_count: number;
  has_fresh_catch: boolean;
  methods: string[];
  species: string[];
  distance_m: number;
  created_at: string;
}

export interface SpotDetail extends Omit<SpotRow, 'distance_m'> {
  notes: string | null;
}

export interface CatchRow {
  id: string;
  angler_id: string;
  spot_id: string | null;
  species: string;
  weight_kg: number | null;
  method: string | null;
  caught_at: string;
  fresh_capture: boolean;
  angler: { handle: string } | null;
}

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
}

export interface BoatRates {
  day_rate_php: number | null;
  seat_rate_php: number | null;
}

export interface BoatRow {
  id: string;
  owner_id: string;
  name: string;
  home_port: string;
  capacity: number;
  wave_limit_m: number;
  badge: BoatBadge;
  rates: BoatRates | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  boat_id: string;
  renter_id: string;
  boat: { id: string; name: string; owner_id: string } | null;
}
