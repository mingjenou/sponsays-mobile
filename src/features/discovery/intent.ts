import { BUDGET_OPTIONS, PARTY_SIZE_OPTIONS } from './options';
import { formatRequestedDateTime } from './when';
import type {
  DiscoveryConstraints,
  DiscoveryFilters,
  DiscoveryIntent,
  DiscoverySessionFields,
} from './types';

const normalizeQuery = (query: string): string =>
  query.trim().toLowerCase().replace(/\s+/g, ' ');

export const createDiscoveryIntent = (
  rawQuery: string,
  filters: DiscoveryFilters,
): DiscoveryIntent => ({
  rawQuery,
  normalizedQuery: normalizeQuery(rawQuery),
  filters: { ...filters },
});

export const mapDiscoveryFiltersToConstraints = (
  filters: DiscoveryFilters,
): DiscoveryConstraints => {
  const maximumPriceLevel =
    filters.budget === 'free'
      ? 0
      : filters.budget === '$'
        ? 1
        : filters.budget === '$$'
          ? 2
          : filters.budget === '$$$'
            ? 3
            : undefined;

  return {
    requestedDateTime: filters.requestedDateTime,
    ...(maximumPriceLevel === undefined ? {} : { maximumPriceLevel }),
    partySize: filters.partySize,
  };
};

export const formatDiscoveryFilterSummary = (
  filters: DiscoveryFilters,
  now: Date = new Date(),
): string => {
  const when = formatRequestedDateTime(filters.requestedDateTime, now);
  const budget = BUDGET_OPTIONS.find((option) => option.value === filters.budget)?.label;
  const party = PARTY_SIZE_OPTIONS.find((option) => option.value === filters.partySize)?.label;
  return [when, budget, party].filter(Boolean).join(' · ');
};

export const mapDiscoveryFiltersToSessionFields = (
  filters: DiscoveryFilters,
  radiusKm: number,
): DiscoverySessionFields => {
  const constraints = mapDiscoveryFiltersToConstraints(filters);
  return {
    mood: null,
    socialContext: null,
    budget: filters.budget === 'flexible' ? null : filters.budget,
    availableMinutes: null,
    requestedDateTime: constraints.requestedDateTime,
    radiusKm,
  };
};
