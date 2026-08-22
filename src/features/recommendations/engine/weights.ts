export const BASE_WEIGHTS = {
  discoveryIntent: 0.35,
  interest: 0.18,
  distance: 0.12,
  budget: 0.1,
  quality: 0.12,
  behaviour: 0.06,
  novelty: 0.1,
  spontaneity: 0.07,
} as const;

export const SPONTANEOUS_CONFIG = {
  poolSize: 7,
  scorePower: 2.7,
  noveltyMultiplier: 1,
} as const;
