import type { PlaceCandidate } from '@/src/types/place';
import type { DiscoveryIntent, DiscoveryPartySize } from '@/src/features/discovery/types';

export interface RecommendationContext {
  discoveryIntent: DiscoveryIntent;
  interests: string[];
  maximumPriceLevel?: number;
  maximumDistanceKm: number;
  availableMinutes: number;
  partySize: DiscoveryPartySize;
  rejectedPlaceIds: string[];
}

export interface ScoredCandidate {
  place: PlaceCandidate;
  score: number;
  intentMatchScore: number;
  noveltyScore: number;
}

export interface RecommendationResult extends ScoredCandidate {
  reason: string;
  confidenceLabel: 'Strong match' | 'Good hunch' | 'Wild card';
}
