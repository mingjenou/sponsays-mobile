import { createContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { isSupabaseAvailable, setSupabaseAutoRefresh } from '@/src/services/supabase/client';
import {
  getCurrentSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  subscribeToAuthChanges,
} from './authService';
import type { AuthContextValue } from './types';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseAvailable);

  useEffect(() => {
    if (!isSupabaseAvailable) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      if (mounted) setSession(nextSession);
    });

    void getCurrentSession()
      .then((result) => {
        if (mounted) setSession(result.session);
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          const message = error instanceof Error ? error.message : 'Unknown session restore error';
          console.warn(`[SponSays auth] Session restore failed: ${message}`);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseAvailable || Platform.OS === 'web') return;

    const syncRefreshState = (state: string) => setSupabaseAutoRefresh(state === 'active');
    syncRefreshState(AppState.currentState);
    const subscription = AppState.addEventListener('change', syncRefreshState);

    return () => {
      subscription.remove();
      setSupabaseAutoRefresh(false);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseAvailable,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
