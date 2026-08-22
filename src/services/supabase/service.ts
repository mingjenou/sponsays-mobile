import type { User } from '@supabase/supabase-js';
import { isSupabaseAvailable, supabase, type SponSaysSupabaseClient } from './client';

export type DataServiceErrorCode = 'request_failed' | 'timed_out';

export interface DataServiceError {
  code: DataServiceErrorCode;
  message: string;
}

export interface DataServiceResult<T> {
  data: T | null;
  error: DataServiceError | null;
  authenticated: boolean;
}

interface AuthenticatedContext {
  client: SponSaysSupabaseClient;
  user: User;
}

const REQUEST_TIMEOUT_MS = 8_000;

export const noAuthenticatedUser = <T>(): DataServiceResult<T> => ({
  data: null,
  error: null,
  authenticated: false,
});

export const dataSuccess = <T>(data: T): DataServiceResult<T> => ({
  data,
  error: null,
  authenticated: true,
});

export const logDataError = (operation: string, error: unknown): void => {
  if (!__DEV__) return;
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : error instanceof Error
        ? error.message
        : 'Unknown persistence error';
  console.warn(`[SponSays data:${operation}] ${message}`);
};

export const dataFailure = <T>(
  operation: string,
  error: unknown,
  message = "We couldn't save that right now. Your SponSay still works.",
): DataServiceResult<T> => {
  logDataError(operation, error);
  return {
    data: null,
    error: { code: 'request_failed', message },
    authenticated: true,
  };
};

export const withRequestTimeout = async <T>(
  request: PromiseLike<T>,
  operation: string,
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${operation} timed out after ${REQUEST_TIMEOUT_MS}ms`)),
      REQUEST_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([Promise.resolve(request), timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const getAuthenticatedContext = async (): Promise<AuthenticatedContext | null> => {
  const client = supabase;
  if (!client || !isSupabaseAvailable) return null;

  try {
    const { data, error } = await withRequestTimeout(client.auth.getUser(), 'get-authenticated-user');
    if (error || !data.user) {
      if (error && error.name !== 'AuthSessionMissingError') logDataError('get-authenticated-user', error);
      return null;
    }
    return { client, user: data.user };
  } catch (error) {
    logDataError('get-authenticated-user', error);
    return null;
  }
};

export const createPersistenceId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};
