import type { TablesInsert } from '../../services/supabase/database.types';
import type { RecommendationResult } from './engine';

export interface RecommendationPersistenceValuesInput {
  id: string;
  sessionId: string;
  recommendation: RecommendationResult;
  rankPosition: number;
}

export const mapRecommendationPersistenceValues = (
  input: RecommendationPersistenceValuesInput,
  userId: string,
): TablesInsert<'recommendations'> => {
  const { place } = input.recommendation;
  return {
    id: input.id,
    session_id: input.sessionId,
    user_id: userId,
    external_place_id: place.providerId ?? place.id,
    source: place.provider === 'google_places' ? 'google_places' : 'mock',
    place_name: place.name,
    category: place.category ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    estimated_distance_km: place.distanceKm ?? null,
    estimated_duration_minutes: place.estimatedDurationMinutes ?? null,
    price_level: place.priceLevel ?? null,
    score: input.recommendation.score,
    recommendation_reason: input.recommendation.reason,
    rank_position: input.rankPosition,
    accepted: false,
    rejected: false,
  };
};
