import type { TablesInsert } from '@/src/services/supabase/database.types';
import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';
import type { PreferenceInput, UserPreferences } from './types';

export const getMyPreferences = async (): Promise<DataServiceResult<UserPreferences | null>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('user_preferences')
        .select('*')
        .eq('user_id', context.user.id)
        .maybeSingle(),
      'get-preferences',
    );
    if (error) return dataFailure('get-preferences', error, "We couldn't load your preferences right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('get-preferences', error, "We couldn't load your preferences right now.");
  }
};

export const saveMyPreferences = async (
  input: PreferenceInput,
): Promise<DataServiceResult<UserPreferences>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  const values: TablesInsert<'user_preferences'> = {
    user_id: context.user.id,
    interests: input.interests,
    dietary_preferences: input.dietaryPreferences,
    default_budget: input.defaultBudget,
    default_distance_km: input.defaultDistanceKm,
    default_social_context: input.defaultSocialContext,
    default_spontaneity_mode: input.defaultSpontaneityMode,
  };

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('user_preferences')
        .upsert(values, { onConflict: 'user_id' })
        .select('*')
        .single(),
      'save-preferences',
    );
    if (error) return dataFailure('save-preferences', error, "We couldn't save your preferences right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('save-preferences', error, "We couldn't save your preferences right now.");
  }
};
