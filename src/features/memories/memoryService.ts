import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';
import type { Memory } from './types';

export const getMyMemories = async (): Promise<DataServiceResult<Memory[]>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data: recommendations, error: recommendationError } = await withRequestTimeout(
      context.client
        .from('recommendations')
        .select('id, external_place_id, place_name, category, created_at')
        .eq('user_id', context.user.id)
        .eq('accepted', true)
        .order('created_at', { ascending: false })
        .limit(50),
      'get-memories',
    );
    if (recommendationError) {
      return dataFailure('get-memories', recommendationError, "We couldn't load your memories right now.");
    }

    if (recommendations.length === 0) return dataSuccess([]);

    const recommendationIds = recommendations.map((recommendation) => recommendation.id);
    const { data: feedbackRows, error: feedbackError } = await withRequestTimeout(
      context.client
        .from('recommendation_feedback')
        .select('recommendation_id, positive')
        .eq('user_id', context.user.id)
        .in('recommendation_id', recommendationIds),
      'get-memory-feedback',
    );
    if (feedbackError) {
      return dataFailure('get-memory-feedback', feedbackError, "We couldn't load your memories right now.");
    }

    const feedbackByRecommendation = new Map(
      feedbackRows.map((feedback) => [feedback.recommendation_id, feedback.positive] as const),
    );
    const memories: Memory[] = recommendations.map((recommendation) => ({
      id: recommendation.id,
      externalPlaceId: recommendation.external_place_id,
      placeName: recommendation.place_name,
      category: recommendation.category,
      createdAt: recommendation.created_at,
      feedback: feedbackByRecommendation.has(recommendation.id)
        ? feedbackByRecommendation.get(recommendation.id)
          ? 'positive'
          : 'negative'
        : null,
    }));

    return dataSuccess(memories);
  } catch (error) {
    return dataFailure('get-memories', error, "We couldn't load your memories right now.");
  }
};
