import { MODE_CONFIG } from './weights';
import type { ScoredCandidate, SpontaneityMode } from './types';

export const weightedSample = (
  scoredCandidates: ScoredCandidate[],
  mode: SpontaneityMode,
): ScoredCandidate | undefined => {
  const config = MODE_CONFIG[mode];
  const pool = [...scoredCandidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, config.poolSize);

  if (pool.length === 0) return undefined;

  const weights = pool.map((candidate) => Math.pow(Math.max(candidate.score, 0.01), config.scorePower));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * total;

  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return pool[index];
  }

  return pool[0];
};
