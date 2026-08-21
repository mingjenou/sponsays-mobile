import type { SpontaneityMode } from './types';

export const BASE_WEIGHTS = {
  interest: 0.25,
  distance: 0.15,
  budget: 0.1,
  quality: 0.15,
  behaviour: 0.15,
  novelty: 0.1,
  spontaneity: 0.1,
} as const;

export const MODE_CONFIG: Record<
  SpontaneityMode,
  { poolSize: number; scorePower: number; noveltyMultiplier: number }
> = {
  safe: { poolSize: 4, scorePower: 4.2, noveltyMultiplier: 0.55 },
  spontaneous: { poolSize: 7, scorePower: 2.7, noveltyMultiplier: 1 },
  chaos: { poolSize: 10, scorePower: 1.45, noveltyMultiplier: 1.75 },
};
