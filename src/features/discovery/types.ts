export type DiscoveryTimePreference = 'now' | 'tonight' | 'tomorrow' | 'flexible';
export type DiscoveryBudget = 'free' | '$' | '$$' | '$$$' | 'flexible';
export type DiscoveryPartySize = 'solo' | 'two' | 'small_group' | 'large_group';

export interface DiscoveryFilters {
  timePreference: DiscoveryTimePreference;
  budget: DiscoveryBudget;
  partySize: DiscoveryPartySize;
}

export interface DiscoveryIntent {
  rawQuery: string;
  normalizedQuery: string;
  filters: DiscoveryFilters;
}

export interface DiscoveryConstraints {
  availableMinutes: number;
  maximumPriceLevel?: number;
  partySize: DiscoveryPartySize;
}
