import type { DataServiceResult } from '@/src/services/supabase/service';
import { dataFailure, dataSuccess, getAuthenticatedContext, noAuthenticatedUser, withRequestTimeout } from '@/src/services/supabase/service';
import type { Memory } from './types';

export const getMyMemories = async (): Promise<DataServiceResult<Memory[]>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();
  try {
    const { data: plans, error: planError } = await withRequestTimeout(
      context.client.from('planned_experiences').select('id, recommendation_id, external_place_id, place_name, category, status, updated_at').eq('user_id', context.user.id).order('updated_at', { ascending: false }).limit(100), 'get-memory-plans');
    if (planError) return dataFailure('get-memory-plans', planError, "We couldn't load your memories right now.");
    const { data: legacy, error: legacyError } = await withRequestTimeout(
      context.client.from('recommendations').select('id, external_place_id, place_name, category, created_at').eq('user_id', context.user.id).eq('accepted', true).order('created_at', { ascending: false }).limit(50), 'get-legacy-memories');
    if (legacyError) return dataFailure('get-legacy-memories', legacyError, "We couldn't load your memories right now.");

    const plannedRecommendationIds = new Set(plans.flatMap((plan) => plan.recommendation_id ? [plan.recommendation_id] : []));
    const completed = plans.filter((plan) => plan.status === 'completed');
    const preservedLegacy = legacy.filter((row) => !plannedRecommendationIds.has(row.id));
    const recommendationIds = [...completed.flatMap((plan) => plan.recommendation_id ? [plan.recommendation_id] : []), ...preservedLegacy.map((row) => row.id)];
    const feedbackByRecommendation = new Map<string, boolean>();
    if (recommendationIds.length > 0) {
      const { data: feedbackRows, error: feedbackError } = await withRequestTimeout(
        context.client.from('recommendation_feedback').select('recommendation_id, positive').eq('user_id', context.user.id).in('recommendation_id', recommendationIds), 'get-memory-feedback');
      if (feedbackError) return dataFailure('get-memory-feedback', feedbackError, "We couldn't load your memories right now.");
      feedbackRows.forEach((row) => feedbackByRecommendation.set(row.recommendation_id, row.positive));
    }
    const toFeedback = (recommendationId?: string | null): Memory['feedback'] => recommendationId && feedbackByRecommendation.has(recommendationId)
      ? feedbackByRecommendation.get(recommendationId) ? 'positive' : 'negative' : null;
    return dataSuccess([
      ...completed.map((plan) => ({ id: plan.id, externalPlaceId: plan.external_place_id, placeName: plan.place_name, category: plan.category, createdAt: plan.updated_at, feedback: toFeedback(plan.recommendation_id) })),
      ...preservedLegacy.map((row) => ({ id: row.id, externalPlaceId: row.external_place_id, placeName: row.place_name, category: row.category, createdAt: row.created_at, feedback: toFeedback(row.id) })),
    ]);
  } catch (error) { return dataFailure('get-memories', error, "We couldn't load your memories right now."); }
};
