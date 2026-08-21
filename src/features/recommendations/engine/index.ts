import type { PlaceCandidate } from '@/src/types/place';
import { buildExplanation } from './explanations';
import { applyHardFilters } from './filters';
import { weightedSample } from './sampling';
import { scoreCandidate } from './scoring';
import type { RecommendationContext, RecommendationResult, SpontaneityMode } from './types';

export type { RecommendationContext, RecommendationResult, SpontaneityMode } from './types';

export const makeRecommendation = (
  candidates: PlaceCandidate[],
  context: RecommendationContext,
  mode: SpontaneityMode,
): RecommendationResult | undefined => {
  const eligible = applyHardFilters(candidates, context);
  const selected = weightedSample(
    eligible.map((place) => scoreCandidate(place, context, mode)),
    mode,
  );

  if (!selected) return undefined;

  return {
    ...selected,
    reason: buildExplanation(selected, mode),
    confidenceLabel: mode === 'safe' ? 'Strong match' : mode === 'chaos' ? 'Wild card' : 'Good hunch',
  };
};
