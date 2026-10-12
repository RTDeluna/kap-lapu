import type { Session } from '@supabase/supabase-js';
import { useRouter, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { queryClient } from './queryClient';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  userId: string | null;
  /** True until the stored session has been read once. */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, userId: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Visibility depends on who is asking, so refetch everything on sign in and out.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, userId: session?.user.id ?? null, loading }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * Wraps an action that needs an account (pin, log a catch, message, follow).
 * Signed out, it routes to sign in and comes back to `next` afterwards.
 */
export function useRequireAuth() {
  const { userId } = useAuth();
  const router = useRouter();
  return useCallback(
    (action: () => void, next?: string) => {
      if (userId) {
        action();
        return;
      }
      const href = (next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in') as Href;
      router.push(href);
    },
    [userId, router],
  );
}
