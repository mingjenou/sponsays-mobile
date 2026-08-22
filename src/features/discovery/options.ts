import type {
  DiscoveryBudget,
  DiscoveryFilters,
  DiscoveryPartySize,
} from './types';
import { createDefaultRequestedDateTime } from './when';

export const createDefaultDiscoveryFilters = (now: Date = new Date()): DiscoveryFilters => ({
  requestedDateTime: createDefaultRequestedDateTime(now),
  budget: '$$',
  partySize: 'two',
});

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = createDefaultDiscoveryFilters();

export const BUDGET_OPTIONS: readonly { value: DiscoveryBudget; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '$', label: '$' },
  { value: '$$', label: '$$' },
  { value: '$$$', label: '$$$' },
  { value: 'flexible', label: 'Flexible' },
];

export const PARTY_SIZE_OPTIONS: readonly {
  value: DiscoveryPartySize;
  label: string;
}[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'two', label: '2 people' },
  { value: 'small_group', label: '3–4 people' },
  { value: 'large_group', label: '5+ people' },
];
