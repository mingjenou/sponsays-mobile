import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './database.types';
import { isSupabaseConfigured, supabaseConfig } from './config';

export type SponSaysSupabaseClient = SupabaseClient<Database>;

const createSponSaysSupabaseClient = (): SponSaysSupabaseClient | null => {
  if (!supabaseConfig) return null;

  try {
    return createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
  } catch (error) {
    if (__DEV__) {
      const message = error instanceof Error ? error.message : 'Unknown client configuration error';
      console.warn(`[SponSays] Supabase client was not started: ${message}`);
    }
    return null;
  }
};

export const supabase = createSponSaysSupabaseClient();
export const isSupabaseAvailable = isSupabaseConfigured && supabase !== null;

export const setSupabaseAutoRefresh = (active: boolean): void => {
  if (!supabase || Platform.OS === 'web') return;

  if (active) {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};

export { isSupabaseConfigured } from './config';
