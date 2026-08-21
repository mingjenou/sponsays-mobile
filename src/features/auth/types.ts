import type { Session, User } from '@supabase/supabase-js';

export type AuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'sign_up_failed'
  | 'sign_out_failed'
  | 'session_failed';

export interface AuthServiceError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthSessionResult {
  session: Session | null;
  user: User | null;
  error: AuthServiceError | null;
}

export interface AuthSignOutResult {
  error: AuthServiceError | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthSessionResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthSessionResult>;
  signOut: () => Promise<AuthSignOutResult>;
}
