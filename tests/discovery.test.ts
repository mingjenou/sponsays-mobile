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
import { buildDiscoveryCacheKey } from '@/src/features/discovery/cacheKey';
import {
  buildLocalDateTimeIso,
  createDateOptions,
  createDefaultRequestedDateTime,
  createTimeOptions,
  getLocalDateKey,
  getLocalTimeKey,
  getNearestFutureHalfHour,
} from '@/src/features/discovery/when';
import type { DiscoveryFilters } from '@/src/features/discovery/types';
import { MAX_REPLACEMENTS_PER_SESSION } from '@/src/constants/recommendations';
import {
  makeRecommendation,
  normalizeLegacySpontaneityMode,
  type RecommendationContext,
} from '@/src/features/recommendations/engine';
import { ADELAIDE_PLACES } from '@/src/mocks/places';

const flexibleFilters: DiscoveryFilters = {
  requestedDateTime: '2026-08-23T09:30:00.000Z',
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
    requestedDateTime: constraints.requestedDateTime,
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
    requestedDateTime: '2026-08-24T09:30:00.000Z',
    budget: '$$',
    partySize: 'two',
  };
  assert.deepEqual(mapDiscoveryFiltersToConstraints(filters), {
    requestedDateTime: '2026-08-24T09:30:00.000Z',
    maximumPriceLevel: 2,
    partySize: 'two',
  });
  assert.equal(
    formatDiscoveryFilterSummary(filters, new Date('2026-08-22T02:00:00.000Z')),
    'Mon 24 7:00 PM · $$ · 2 people',
  );
  assert.deepEqual(mapDiscoveryFiltersToSessionFields(filters, 15), {
    mood: null,
    socialContext: null,
    budget: '$$',
    availableMinutes: null,
    requestedDateTime: '2026-08-24T09:30:00.000Z',
    radiusKm: 15,
  });
});

test('date and time selectors use 14 local dates and 30-minute times from 6 AM to 11:30 PM', () => {
  const now = new Date(2026, 7, 22, 16, 46, 7);
  const dates = createDateOptions(now);
  const times = createTimeOptions();
  assert.equal(dates.length, 14);
  assert.equal(dates[0]?.label, 'Today');
  assert.equal(dates[1]?.label, 'Tomorrow');
  assert.equal(times.length, 36);
  assert.equal(times[0]?.timeKey, '06:00');
  assert.equal(times.at(-1)?.timeKey, '23:30');
});

test('selected local date and time map to one canonical ISO datetime', () => {
  const requestedDateTime = buildLocalDateTimeIso('2026-08-24', '19:30');
  const selected = new Date(requestedDateTime);
  assert.equal(getLocalDateKey(selected), '2026-08-24');
  assert.equal(getLocalTimeKey(selected), '19:30');
  assert.equal(selected.toISOString(), requestedDateTime);
});

test('default requested time is the nearest future half hour and rolls late nights forward', () => {
  const afternoon = new Date(2026, 7, 22, 16, 46, 7);
  const rounded = getNearestFutureHalfHour(afternoon);
  assert.equal(getLocalDateKey(rounded), getLocalDateKey(afternoon));
  assert.equal(getLocalTimeKey(rounded), '17:00');
  assert.ok(new Date(createDefaultRequestedDateTime(afternoon)).getTime() > afternoon.getTime());

  const late = new Date(2026, 7, 22, 23, 45);
  const rolled = getNearestFutureHalfHour(late);
  assert.equal(getLocalTimeKey(rolled), '06:00');
  assert.notEqual(getLocalDateKey(rolled), getLocalDateKey(late));
});

test('material discovery inputs produce distinct candidate-pool cache keys', () => {
  const base = {
    authIdentity: 'user-1',
    query: ' Vegetarian   Food ',
    filters: flexibleFilters,
    radiusKm: 15,
    location: { latitude: -34.9285, longitude: 138.6007 },
  };
  const key = buildDiscoveryCacheKey(base);
  assert.equal(key, buildDiscoveryCacheKey({ ...base, query: 'vegetarian food' }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, query: 'Hike' }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, filters: { ...flexibleFilters, requestedDateTime: '2026-08-24T10:00:00.000Z' } }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, filters: { ...flexibleFilters, budget: '$$' } }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, filters: { ...flexibleFilters, partySize: 'solo' } }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, radiusKm: 10 }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, authIdentity: null }));
  assert.notEqual(key, buildDiscoveryCacheKey({ ...base, location: { latitude: -35, longitude: 138.6 } }));
});

test('eight replacements can produce nine distinct recommendations before exhaustion', () => {
  assert.equal(MAX_REPLACEMENTS_PER_SESSION, 8);
  const candidates = Array.from({ length: MAX_REPLACEMENTS_PER_SESSION + 1 }, (_, index) => ({
    id: `place-${index + 1}`,
    provider: 'mock' as const,
    providerId: `place-${index + 1}`,
    source: 'mock' as const,
    name: `Place ${index + 1}`,
    latitude: -34.9,
    longitude: 138.6,
    distanceKm: 2,
    tags: ['culture'],
  }));
  const rejected: string[] = [];
  for (let resultNumber = 1; resultNumber <= MAX_REPLACEMENTS_PER_SESSION + 1; resultNumber += 1) {
    const result = makeRecommendation(candidates, contextFor('', rejected), () => 0);
    assert.ok(result);
    assert.ok(!rejected.includes(result.place.id));
    rejected.push(result.place.id);
  }
  assert.equal(new Set(rejected).size, 9);
  assert.equal(makeRecommendation(candidates, contextFor('', rejected), () => 0), undefined);
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

test('the visible discovery CTA is exactly SponSays and filter editing remains staged', async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const [doScreen, aroundMe, modal] = await Promise.all([
    readFile(resolve(testDirectory, '../app/(tabs)/do.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/(tabs)/around-me.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../src/features/discovery/DiscoveryFilterModal.tsx'), 'utf8'),
  ]);
  assert.match(doScreen, /label="SponSays"/);
  assert.match(aroundMe, /label="SponSays"/);
  assert.doesNotMatch(`${doScreen}\n${aroundMe}`, /SPONSAYS? ME(?: ✦)?/i);
  assert.match(modal, /if \(visible\) \{[\s\S]*setDraft\(filters\)/);
  assert.match(modal, /label="APPLY" onPress=\{\(\) => onApply\(draft\)\}/);
  assert.match(modal, /label="Cancel" onPress=\{onClose\}/);
  assert.doesNotMatch(modal, /WHEN_OPTIONS|Now['"]|Tonight|Flexible['"]/);
  assert.match(doScreen, /onChangeText=\{\(nextQuery\) => \{[\s\S]*invalidateDiscoverySession\(\)/);
  assert.match(doScreen, /onApply=\{\(nextFilters\) => \{[\s\S]*invalidateDiscoverySession\(\)/);
});
