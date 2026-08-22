import type {
  CURRENT_RECOMMENDATION_BEHAVIOUR,
  RecommendationResult,
} from './engine';
import type { Tables, TablesInsert } from '@/src/services/supabase/database.types';
import type { DataServiceResult } from '@/src/services/supabase/service';
import {
  dataFailure,
  dataSuccess,
  getAuthenticatedContext,
  noAuthenticatedUser,
  withRequestTimeout,
} from '@/src/services/supabase/service';
import { mapRecommendationPersistenceValues } from './persistenceMapping';

export { mapRecommendationPersistenceValues } from './persistenceMapping';

export type PersistedRecommendation = Tables<'recommendations'>;
export type PersistedRecommendationSession = Tables<'recommendation_sessions'>;

export interface RecommendationSessionInput {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  mood: string | null;
  socialContext: string | null;
  budget: string | null;
  availableMinutes: number | null;
  radiusKm: number | null;
  spontaneityMode: typeof CURRENT_RECOMMENDATION_BEHAVIOUR;
}

export interface RecommendationPersistenceInput {
  id: string;
  sessionId: string;
  recommendation: RecommendationResult;
  rankPosition: number;
}

export const createRecommendationSession = async (
  input: RecommendationSessionInput,
): Promise<DataServiceResult<PersistedRecommendationSession>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  const values: TablesInsert<'recommendation_sessions'> = {
    id: input.id,
    user_id: context.user.id,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    mood: input.mood,
    social_context: input.socialContext,
    budget: input.budget,
    available_minutes: input.availableMinutes,
    radius_km: input.radiusKm,
    spontaneity_mode: input.spontaneityMode,
  };

  try {
    const { data, error } = await withRequestTimeout(
      context.client.from('recommendation_sessions').insert(values).select('*').single(),
      'create-recommendation-session',
    );
    if (error) return dataFailure('create-recommendation-session', error);
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('create-recommendation-session', error);
  }
};

export const persistShownRecommendation = async (
  input: RecommendationPersistenceInput,
): Promise<DataServiceResult<PersistedRecommendation>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  const values = mapRecommendationPersistenceValues(input, context.user.id);

  try {
    const { data, error } = await withRequestTimeout(
      context.client.from('recommendations').insert(values).select('*').single(),
      'persist-recommendation',
    );
    if (error) return dataFailure('persist-recommendation', error);
    return dataSuccess(data);
  } catch (error) {
    return dataFailure('persist-recommendation', error);
  }
};

const updateRecommendationDecision = async (
  recommendationId: string,
  update: { accepted?: boolean; rejected?: boolean },
  operation: string,
): Promise<DataServiceResult<PersistedRecommendation>> => {
  const context = await getAuthenticatedContext();
  if (!context) return noAuthenticatedUser();

  try {
    const { data, error } = await withRequestTimeout(
      context.client
        .from('recommendations')
        .update(update)
        .eq('id', recommendationId)
        .eq('user_id', context.user.id)
        .select('*')
        .single(),
      operation,
    );
    if (error) return dataFailure(operation, error);
    return dataSuccess(data);
  } catch (error) {
    return dataFailure(operation, error);
  }
};

export const markRecommendationRejected = (recommendationId: string) =>
  updateRecommendationDecision(recommendationId, { rejected: true }, 'reject-recommendation');

export const markRecommendationAccepted = (recommendationId: string) =>
  updateRecommendationDecision(recommendationId, { accepted: true }, 'accept-recommendation');
