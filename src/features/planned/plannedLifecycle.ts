import type { RecommendationResult } from '@/src/features/recommendations/engine';
import { getCandidateDescription, getCandidateSourceUrl } from '@/src/features/recommendations/candidateDescription';
import type { NewPlannedExperience, PlannedExperience } from './types';

export const buildPlannedExperience = (
  recommendation: RecommendationResult,
  plannedFor: string,
  recommendationId?: string,
): NewPlannedExperience => ({
  id: typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  ...(recommendationId ? { recommendationId } : {}),
  externalPlaceId: recommendation.place.providerId,
  provider: recommendation.place.provider,
  placeName: recommendation.place.name,
  description: getCandidateDescription(recommendation.place),
  ...(getCandidateSourceUrl(recommendation.place) ? { sourceUrl: getCandidateSourceUrl(recommendation.place) } : {}),
  ...(recommendation.place.address ? { address: recommendation.place.address } : {}),
  latitude: recommendation.place.latitude,
  longitude: recommendation.place.longitude,
  ...(recommendation.place.category ? { category: recommendation.place.category } : {}),
  plannedFor,
  status: 'planned',
  reminderOffsetMinutes: null,
  ...(recommendation.place.estimatedDurationMinutes ? { estimatedDurationMinutes: recommendation.place.estimatedDurationMinutes } : {}),
});

export const isUpcomingPlan = (plan: PlannedExperience, now = new Date()): boolean =>
  plan.status === 'planned' && Date.parse(plan.plannedFor) >= now.getTime();

export const isMemoryEligible = (plan: Pick<PlannedExperience, 'status'>): boolean => plan.status === 'completed';
