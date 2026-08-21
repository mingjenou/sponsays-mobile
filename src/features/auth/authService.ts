import type { Session } from '@supabase/supabase-js';
import { isSupabaseAvailable, supabase } from '@/src/services/supabase/client';
import type { AuthServiceError, AuthSessionResult, AuthSignOutResult } from './types';

const unavailableError: AuthServiceError = {
  code: 'not_configured',
  message: "Accounts aren't connected yet. Continue in demo mode for now.",
};

const logAuthError = (operation: string, error: { message: string }): void => {
  if (__DEV__) console.warn(`[SponSays auth:${operation}] ${error.message}`);
};

const logUnexpectedAuthError = (operation: string, error: unknown): void => {
  if (!__DEV__) return;
  const message = error instanceof Error ? error.message : 'Unknown authentication error';
  console.warn(`[SponSays auth:${operation}] ${message}`);
};

const emptySessionResult = (error: AuthServiceError | null = null): AuthSessionResult => ({
  session: null,
  user: null,
  error,
});

export const getCurrentSession = async (): Promise<AuthSessionResult> => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return emptySessionResult();

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      logAuthError('restore-session', error);
      return emptySessionResult({
        code: 'session_failed',
        message: "We couldn't restore your account session. You can continue in demo mode.",
      });
    }

    return {
      session: data.session,
      user: data.session?.user ?? null,
      error: null,
    };
  } catch (error) {
    logUnexpectedAuthError('restore-session', error);
    return emptySessionResult({
      code: 'session_failed',
      message: "We couldn't restore your account session. You can continue in demo mode.",
    });
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthSessionResult> => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return emptySessionResult(unavailableError);

  try {
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      logAuthError('sign-in', error);
      return emptySessionResult({
        code: 'invalid_credentials',
        message: "That email or password doesn't look right.",
      });
    }

    return { session: data.session, user: data.user, error: null };
  } catch (error) {
    logUnexpectedAuthError('sign-in', error);
    return emptySessionResult({
      code: 'invalid_credentials',
      message: "That email or password doesn't look right.",
    });
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<AuthSessionResult> => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return emptySessionResult(unavailableError);

  try {
    const { data, error } = await client.auth.signUp({ email: email.trim(), password });
    if (error) {
      logAuthError('sign-up', error);
      return emptySessionResult({
        code: 'sign_up_failed',
        message: "We couldn't create your account. Please try again.",
      });
    }

    return { session: data.session, user: data.user, error: null };
  } catch (error) {
    logUnexpectedAuthError('sign-up', error);
    return emptySessionResult({
      code: 'sign_up_failed',
      message: "We couldn't create your account. Please try again.",
    });
  }
};

export const signOut = async (): Promise<AuthSignOutResult> => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return { error: unavailableError };

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      logAuthError('sign-out', error);
      return {
        error: {
          code: 'sign_out_failed',
          message: "We couldn't sign you out. Please try again.",
        },
      };
    }

    return { error: null };
  } catch (error) {
    logUnexpectedAuthError('sign-out', error);
    return {
      error: {
        code: 'sign_out_failed',
        message: "We couldn't sign you out. Please try again.",
      },
    };
  }
};

export const subscribeToAuthChanges = (onSessionChange: (session: Session | null) => void): (() => void) => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return () => undefined;

  const { data } = client.auth.onAuthStateChange((_event, session) => onSessionChange(session));
  return () => data.subscription.unsubscribe();
};
