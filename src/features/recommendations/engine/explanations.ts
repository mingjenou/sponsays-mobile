import type { ScoredCandidate, SpontaneityMode } from './types';

export const buildExplanation = (candidate: ScoredCandidate, mode: SpontaneityMode): string => {
  const { place } = candidate;
  if (mode === 'chaos') {
    return `A little outside the usual, but still a genuinely good call for right now.`;
  }
  if (place.priceLevel === 0) {
    return `Easy on the budget, close enough to do now, and different enough to feel worthwhile.`;
  }
  if (place.tags.includes('chill')) {
    return `Relaxed, nearby and just enough of a change of scene to reset the day.`;
  }
  return `It fits the time, distance and vibe — so you can stop comparing and just go.`;
};
