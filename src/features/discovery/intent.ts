import {
  BUDGET_OPTIONS,
  PARTY_SIZE_OPTIONS,
  WHEN_OPTIONS,
} from './options';
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

  const availableMinutes =
    filters.timePreference === 'now'
      ? 90
      : filters.timePreference === 'tonight'
        ? 180
        : 240;

  return {
    availableMinutes,
    ...(maximumPriceLevel === undefined ? {} : { maximumPriceLevel }),
    partySize: filters.partySize,
  };
};

export const formatDiscoveryFilterSummary = (filters: DiscoveryFilters): string => {
  const when = WHEN_OPTIONS.find((option) => option.value === filters.timePreference)?.label;
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
    availableMinutes: constraints.availableMinutes,
    radiusKm,
  };
};
