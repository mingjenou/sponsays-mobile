import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createDiscoveryIntent,
  formatDiscoveryFilterSummary,
  mapDiscoveryFiltersToConstraints,
  mapDiscoveryFiltersToSessionFields,
} from '@/src/features/discovery/intent';
import { DEFAULT_DISCOVERY_FILTERS } from '@/src/features/discovery/options';
import type { DiscoveryFilters } from '@/src/features/discovery/types';
import {
  makeRecommendation,
  normalizeLegacySpontaneityMode,
  type RecommendationContext,
} from '@/src/features/recommendations/engine';
import { ADELAIDE_PLACES } from '@/src/mocks/places';

const flexibleFilters: DiscoveryFilters = {
  timePreference: 'flexible',
  budget: 'flexible',
  partySize: 'two',
};

const contextFor = (
  query: string,
  rejectedPlaceIds: string[] = [],
  filters: DiscoveryFilters = flexibleFilters,
): RecommendationContext => {
  const constraints = mapDiscoveryFiltersToConstraints(filters);
  return {
    discoveryIntent: createDiscoveryIntent(query, filters),
    interests: [],
    maximumDistanceKm: 15,
    availableMinutes: constraints.availableMinutes,
    partySize: constraints.partySize,
    rejectedPlaceIds,
  };
};

test('empty search is valid and still produces one recommendation', () => {
  const context = contextFor('');
  assert.equal(context.discoveryIntent.normalizedQuery, '');
  assert.ok(makeRecommendation(ADELAIDE_PLACES, context, () => 0.25));
});

test('DiscoveryIntent preserves raw query and normalizes only its matching form', () => {
  const intent = createDiscoveryIntent('  Vegetarian   Food  ', DEFAULT_DISCOVERY_FILTERS);
  assert.equal(intent.rawQuery, '  Vegetarian   Food  ');
  assert.equal(intent.normalizedQuery, 'vegetarian food');
});

test('When, Budget and Who filters map to typed constraints and summary copy', () => {
  const filters: DiscoveryFilters = {
    timePreference: 'tonight',
    budget: '$$',
    partySize: 'two',
  };
  assert.deepEqual(mapDiscoveryFiltersToConstraints(filters), {
    availableMinutes: 180,
    maximumPriceLevel: 2,
    partySize: 'two',
  });
  assert.equal(formatDiscoveryFilterSummary(filters), 'Tonight · $$ · 2 people');
  assert.deepEqual(mapDiscoveryFiltersToSessionFields(filters, 15), {
    mood: null,
    socialContext: null,
    budget: '$$',
    availableMinutes: 180,
    radiusKm: 15,
  });
});

test('the engine generates without a user mode and tolerates legacy values', () => {
  assert.ok(makeRecommendation(ADELAIDE_PLACES, contextFor('Coffee'), () => 0));
  for (const legacy of ['safe', 'spontaneous', 'chaos', null]) {
    assert.equal(normalizeLegacySpontaneityMode(legacy), 'spontaneous');
  }
});

test('controlled variation can choose different reasonable candidates for the same request', () => {
  const context = contextFor('');
  const first = makeRecommendation(ADELAIDE_PLACES, context, () => 0);
  const second = makeRecommendation(ADELAIDE_PLACES, context, () => 0.999);
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.place.id, second.place.id);
});

test('a rejected recommendation cannot immediately return in the same session', () => {
  const first = makeRecommendation(ADELAIDE_PLACES, contextFor('Hike'), () => 0);
  assert.ok(first);
  const replacement = makeRecommendation(
    ADELAIDE_PLACES,
    contextFor('Hike', [first.place.id]),
    () => 0,
  );
  assert.ok(replacement);
  assert.notEqual(replacement.place.id, first.place.id);
});

test('Hike prefers candidates supported by outdoor or walking metadata', () => {
  for (const random of [0, 0.35, 0.999]) {
    const result = makeRecommendation(ADELAIDE_PLACES, contextFor('Hike'), () => random);
    assert.ok(result);
    assert.ok(result.place.tags.some((tag) => ['outdoors', 'walking', 'adventure'].includes(tag)));
  }
});

test('Vegetarian Food prefers candidates with supported vegetarian food metadata', () => {
  for (const random of [0, 0.35, 0.999]) {
    const result = makeRecommendation(
      ADELAIDE_PLACES,
      contextFor('Vegetarian Food'),
      () => random,
    );
    assert.ok(result);
    assert.ok(result.place.tags.includes('vegetarian'));
    assert.ok(result.place.tags.includes('food'));
  }
});

test('Live Music falls back to appropriate existing culture, entertainment or nightlife metadata', () => {
  const result = makeRecommendation(ADELAIDE_PLACES, contextFor('Live Music'), () => 0);
  assert.ok(result);
  assert.ok(
    result.place.tags.some((tag) => ['culture', 'entertainment', 'nightlife'].includes(tag)),
  );
});

test('session filter overrides do not mutate saved preference defaults', () => {
  const savedDefaults = { ...DEFAULT_DISCOVERY_FILTERS };
  const sessionFilters: DiscoveryFilters = { ...savedDefaults, budget: 'free' };
  createDiscoveryIntent('Something outdoors', sessionFilters);
  assert.equal(savedDefaults.budget, '$$');
  assert.equal(sessionFilters.budget, 'free');
});

test('Do, onboarding, Me and Settings expose no spontaneity selector', async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const sources = await Promise.all([
    readFile(resolve(testDirectory, '../app/(tabs)/do.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/(auth)/onboarding.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/(tabs)/me.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/settings/index.tsx'), 'utf8'),
  ]);
  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /ModeSelector|PREFERRED SPONTANEITY|How spontaneous\?|Chaos mode|Safe mode|label:\s*['"]Spontaneity['"]/,
    );
  }
});
