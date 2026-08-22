import type { RecommendationResult } from './engine';

const cache = new Map<string, RecommendationResult>();

export const cacheRecommendation = (key: string, recommendation: RecommendationResult): void => {
  cache.set(key, recommendation);
};

export const getCachedRecommendation = (key: string): RecommendationResult | undefined => cache.get(key);
