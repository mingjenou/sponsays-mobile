import type { PlaceCandidate } from '@/src/types/place';

export type SpontaneityMode = 'safe' | 'spontaneous' | 'chaos';

export interface RecommendationContext {
  interests: string[];
  socialContext?: string;
  mood?: string;
  maximumPriceLevel?: number;
  maximumDistanceKm: number;
  availableMinutes: number;
  rejectedPlaceIds: string[];
}

export interface ScoredCandidate {
  place: PlaceCandidate;
  score: number;
  noveltyScore: number;
}

export interface RecommendationResult extends ScoredCandidate {
  reason: string;
  confidenceLabel: 'Strong match' | 'Good hunch' | 'Wild card';
}
