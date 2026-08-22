import type { PlaceCandidate } from '@/src/types/place';
import { preferDiscoveryIntentMatches } from '@/src/features/discovery/matching';
import { buildExplanation } from './explanations';
import { applyHardFilters } from './filters';
import { weightedSample } from './sampling';
import { scoreCandidate } from './scoring';
import type { RecommendationContext, RecommendationResult } from './types';

export type { RecommendationContext, RecommendationResult } from './types';

export const CURRENT_RECOMMENDATION_BEHAVIOUR = 'spontaneous' as const;

export const normalizeLegacySpontaneityMode = (
  _legacyValue?: string | null,
): typeof CURRENT_RECOMMENDATION_BEHAVIOUR => CURRENT_RECOMMENDATION_BEHAVIOUR;

export const makeRecommendation = (
  candidates: PlaceCandidate[],
  context: RecommendationContext,
  random: () => number = Math.random,
): RecommendationResult | undefined => {
  const eligible = applyHardFilters(candidates, context);
  const discoveryPool = preferDiscoveryIntentMatches(eligible, context.discoveryIntent);
  const selected = weightedSample(
    discoveryPool.map((place) => scoreCandidate(place, context, random)),
    random,
  );

  if (!selected) return undefined;

  return {
    ...selected,
    reason: buildExplanation(selected),
    confidenceLabel: 'Good hunch',
  };
};
