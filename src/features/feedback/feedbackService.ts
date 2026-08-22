import type { Tables, TablesInsert } from '@/src/services/supabase/database.types';
import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';

export type RecommendationFeedback = Tables<'recommendation_feedback'>;

export const getRecommendationFeedback = async (
  recommendationId: string,
): Promise<DataServiceResult<RecommendationFeedback | null>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('recommendation_feedback')
        .select('*')
        .eq('user_id', context.user.id)
        .eq('recommendation_id', recommendationId)
        .maybeSingle(),
      'get-feedback',
    );
    if (error) return dataFailure('get-feedback', error, "We couldn't load your feedback right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('get-feedback', error, "We couldn't load your feedback right now.");
  }
};

export const saveRecommendationFeedback = async (
  recommendationId: string,
  positive: boolean,
): Promise<DataServiceResult<RecommendationFeedback>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  const values: TablesInsert<'recommendation_feedback'> = {
    recommendation_id: recommendationId,
    user_id: context.user.id,
    positive,
  };

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('recommendation_feedback')
        .upsert(values, { onConflict: 'user_id,recommendation_id' })
        .select('*')
        .single(),
      'save-feedback',
    );
    if (error) return dataFailure('save-feedback', error, "We couldn't save that feedback right now.");
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('save-feedback', error, "We couldn't save that feedback right now.");
  }
};
