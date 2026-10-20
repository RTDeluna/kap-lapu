import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { LargeSecureStore } from './largeSecureStore';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    'Laot: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. Copy .env.example to .env.local.',
  );
}

/**
 * The only backend client in the app. It holds the publishable key only; every rule
 * lives in Postgres (see docs/api-contract.md).
 *
 * TODO: switch to createClient<Database> once `supabase gen types` output is checked in.
 */
export const supabase = createClient(url ?? 'http://127.0.0.1:54321', publishableKey ?? 'missing-publishable-key', {
  auth: {
    // On the web the default (localStorage) is used; the phone never uses plain AsyncStorage.
    storage: Platform.OS === 'web' ? undefined : new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground (Supabase's Expo guide).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turns a Supabase/PostgREST error into the message we show as is. */
export function errorMessage(error: unknown, fallback = 'May problema. Subukan ulit.'): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message) {
    return error.message;
  }
  return fallback;
}
