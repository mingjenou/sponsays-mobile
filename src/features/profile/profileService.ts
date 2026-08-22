import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';
import type { Profile, ProfileUpdate } from './types';

export const getMyProfile = async (): Promise<DataServiceResult<Profile>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client.from('profiles').select('*').eq('id', context.user.id).maybeSingle(),
      'get-profile',
    );
    if (error) return dataFailure('get-profile', error, "We couldn't load your profile right now.");
    if (!data) return dataFailure('get-profile', new Error('Profile row is missing'));
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('get-profile', error, "We couldn't load your profile right now.");
  }
};

export const updateMyProfile = async (
  update: ProfileUpdate,
): Promise<DataServiceResult<Profile>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('profiles')
        .update({
          ...(update.displayName !== undefined ? { display_name: update.displayName } : {}),
          ...(update.homeCity !== undefined ? { home_city: update.homeCity } : {}),
        })
        .eq('id', context.user.id)
        .select('*')
        .single(),
      'update-profile',
    );
    if (error) return dataFailure('update-profile', error, "We couldn't update your profile right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('update-profile', error, "We couldn't update your profile right now.");
  }
};

export const completeMyOnboarding = async (): Promise<DataServiceResult<Profile>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', context.user.id)
        .select('*')
        .single(),
      'complete-onboarding',
    );
    if (error) return dataFailure('complete-onboarding', error);
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('complete-onboarding', error);
  }
};
