import type { PlaceCandidate } from '@/src/types/place';
import { BASE_WEIGHTS, MODE_CONFIG } from './weights';
import type { RecommendationContext, ScoredCandidate, SpontaneityMode } from './types';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const qualityScore = (place: PlaceCandidate): number => {
  const rating = clamp01(((place.rating ?? 3.5) - 3) / 2);
  const reviewConfidence = clamp01(Math.log10((place.reviewCount ?? 1) + 1) / 4);
  return rating * 0.75 + reviewConfidence * 0.25;
};

export const scoreCandidate = (
  place: PlaceCandidate,
  context: RecommendationContext,
  mode: SpontaneityMode,
): ScoredCandidate => {
  const requestedTags = [...context.interests, context.socialContext, context.mood].filter(
    (tag): tag is string => Boolean(tag),
  );
  const matches = requestedTags.filter((tag) => place.tags.includes(tag.toLowerCase())).length;
  const interest = requestedTags.length === 0 ? 0.65 : clamp01(matches / Math.min(requestedTags.length, 3));
  const distance = clamp01(1 - (place.distanceKm ?? context.maximumDistanceKm) / context.maximumDistanceKm);
  const budget =
    context.maximumPriceLevel === undefined
      ? 0.75
      : clamp01(1 - Math.abs(context.maximumPriceLevel - (place.priceLevel ?? 0)) / 4);
  const noveltyScore = place.tags.includes('hidden gems') ? 1 : place.reviewCount && place.reviewCount < 1000 ? 0.8 : 0.55;
  const behaviour = interest * 0.75 + 0.2;
  const controlledSpontaneity = Math.random();
  const modeConfig = MODE_CONFIG[mode];

  const score =
    interest * BASE_WEIGHTS.interest +
    distance * BASE_WEIGHTS.distance +
    budget * BASE_WEIGHTS.budget +
    qualityScore(place) * BASE_WEIGHTS.quality +
    behaviour * BASE_WEIGHTS.behaviour +
    clamp01(noveltyScore * modeConfig.noveltyMultiplier) * BASE_WEIGHTS.novelty +
    controlledSpontaneity * BASE_WEIGHTS.spontaneity;

  return { place, score, noveltyScore };
};
