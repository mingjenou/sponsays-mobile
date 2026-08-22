import type { Tables, TablesInsert } from '@/src/services/supabase/database.types';
import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';

export type Favourite = Tables<'favourites'>;

export const getFavourite = async (
  externalPlaceId: string,
): Promise<DataServiceResult<Favourite | null>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('favourites')
        .select('*')
        .eq('user_id', context.user.id)
        .eq('external_place_id', externalPlaceId)
        .maybeSingle(),
      'get-favourite',
    );
    if (error) return dataFailure('get-favourite', error, "We couldn't check saved places right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('get-favourite', error, "We couldn't check saved places right now.");
  }
};

export const saveFavourite = async (
  externalPlaceId: string,
  placeName: string,
): Promise<DataServiceResult<Favourite>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  const values: TablesInsert<'favourites'> = {
    user_id: context.user.id,
    external_place_id: externalPlaceId,
    place_name: placeName,
  };

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('favourites')
        .upsert(values, { onConflict: 'user_id,external_place_id' })
        .select('*')
        .single(),
      'save-favourite',
    );
    if (error) return dataFailure('save-favourite', error, "We couldn't save that place right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('save-favourite', error, "We couldn't save that place right now.");
  }
};

export const removeFavourite = async (
  externalPlaceId: string,
): Promise<DataServiceResult<boolean>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { error } = await withRequestTimeout(
      context.client
        .from('favourites')
        .delete()
        .eq('user_id', context.user.id)
        .eq('external_place_id', externalPlaceId),
      'remove-favourite',
    );
    if (error) return dataFailure('remove-favourite', error, "We couldn't update saved places right now.");
    return dataSuccess(true);
  } catch (error) {
    return dataFailure('remove-favourite', error, "We couldn't update saved places right now.");
  }
};
