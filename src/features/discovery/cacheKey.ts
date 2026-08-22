import type { DiscoveryFilters } from './types';

interface DiscoveryCacheKeyInput {
  authIdentity: string | null;
  query: string;
  filters: DiscoveryFilters;
  radiusKm: number;
  location?: { latitude: number; longitude: number } | null;
}

export const buildDiscoveryCacheKey = ({
  authIdentity,
  query,
  filters,
  radiusKm,
  location,
}: DiscoveryCacheKeyInput): string => JSON.stringify({
  authIdentity,
  normalizedQuery: query.trim().toLowerCase().replace(/\s+/g, ' '),
  requestedDateTime: filters.requestedDateTime,
  budget: filters.budget,
  partySize: filters.partySize,
  radiusKm,
  latitude: location ? Number(location.latitude.toFixed(5)) : null,
  longitude: location ? Number(location.longitude.toFixed(5)) : null,
});
