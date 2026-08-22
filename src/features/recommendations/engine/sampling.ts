import { SPONTANEOUS_CONFIG } from './weights';
import type { ScoredCandidate } from './types';

export const weightedSample = (
  scoredCandidates: ScoredCandidate[],
  random: () => number = Math.random,
): ScoredCandidate | undefined => {
  const pool = [...scoredCandidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, SPONTANEOUS_CONFIG.poolSize);

  if (pool.length === 0) return undefined;

  const weights = pool.map((candidate) =>
    Math.pow(Math.max(candidate.score, 0.01), SPONTANEOUS_CONFIG.scorePower),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;

  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return pool[index];
  }

  return pool[0];
};
