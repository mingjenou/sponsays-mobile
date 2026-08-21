export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

const isValidSupabaseUrl = (value: string): boolean => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && supabasePublishableKey.length > 0;

export const supabaseConfig: SupabaseConfig | null = isSupabaseConfigured
  ? { url: supabaseUrl, publishableKey: supabasePublishableKey }
  : null;
