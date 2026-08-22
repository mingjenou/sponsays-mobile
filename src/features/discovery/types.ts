export type DiscoveryBudget = 'free' | '$' | '$$' | '$$$' | 'flexible';
export type DiscoveryPartySize = 'solo' | 'two' | 'small_group' | 'large_group';

export interface DiscoveryFilters {
  requestedDateTime: string;
  budget: DiscoveryBudget;
  partySize: DiscoveryPartySize;
}

export interface DiscoveryIntent {
  rawQuery: string;
  normalizedQuery: string;
  filters: DiscoveryFilters;
}

export interface DiscoveryConstraints {
  requestedDateTime: string;
  maximumPriceLevel?: number;
  partySize: DiscoveryPartySize;
}

export interface DiscoverySessionFields {
  mood: null;
  socialContext: null;
  budget: string | null;
  availableMinutes: null;
  requestedDateTime: string;
  radiusKm: number;
}
