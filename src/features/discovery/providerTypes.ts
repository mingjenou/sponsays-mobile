import type { PlaceCandidate } from '../../types/place';
import type {
  DiscoveryBudget,
  DiscoveryPartySize,
  DiscoveryTimePreference,
} from './types';

export type ProviderHealth = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface DiscoveryProviderRequest {
  query: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  timePreference?: DiscoveryTimePreference;
  budget?: DiscoveryBudget;
  partySize?: DiscoveryPartySize;
  maxCandidates?: number;
}

export interface DiscoveryProviderResponse {
  candidates: PlaceCandidate[];
  health: ProviderHealth;
  source: 'google_places_text_search';
}

export interface ProviderValidationError {
  code: 'INVALID_REQUEST';
  message: string;
}
