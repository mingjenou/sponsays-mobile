import type { ScoredCandidate } from './types';

export const buildExplanation = (candidate: ScoredCandidate): string => {
  const { place } = candidate;
  if (candidate.intentMatchScore > 0) {
    return `It fits the idea you gave us, works for the moment, and is ready for a real-world test.`;
  }
  if (place.priceLevel === 0) {
    return `Easy on the budget, close enough to do now, and different enough to feel worthwhile.`;
  }
  if (place.tags.includes('chill')) {
    return `Relaxed, nearby and just enough of a change of scene to reset the day.`;
  }
  return `It fits the time, distance and vibe — so you can stop comparing and just go.`;
};
