import type { Tables } from '@/src/services/supabase/database.types';
import type { SpontaneityMode } from '@/src/features/recommendations/engine';

export type Profile = Tables<'profiles'>;
export type UserPreferences = Tables<'user_preferences'>;

export interface ProfileUpdate {
  displayName?: string | null;
  homeCity?: string | null;
}

export interface PreferenceInput {
  interests: string[];
  dietaryPreferences: string[];
  defaultBudget: string | null;
  defaultDistanceKm: number | null;
  defaultSocialContext: string | null;
  defaultSpontaneityMode: SpontaneityMode;
}
