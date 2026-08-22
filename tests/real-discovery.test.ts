import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getInitialRoute } from '../src/features/auth/entryRoute';
import {
  createAuthDiscoveryReset,
  getDiscoveryProviderMode,
} from '../src/features/discovery/authDiscoveryState';
import {
  MAX_CANDIDATES,
  MAX_QUERY_LENGTH,
  normalizeGoogleTextSearchResponse,
  translateToGoogleTextSearch,
  validateDiscoveryProviderRequest,
} from '../src/features/discovery/googlePlaces';
import { createDiscoveryIntent } from '../src/features/discovery/intent';
import { makeRecommendation, type RecommendationContext } from '../src/features/recommendations/engine';
import { mapRecommendationPersistenceValues } from '../src/features/recommendations/persistenceMapping';
import type { PlaceCandidate } from '../src/types/place';

const request = {
  query: '',
  latitude: -34.9285,
  longitude: 138.6007,
  radiusMeters: 15_000,
  requestedDateTime: '2026-08-24T09:30:00.000Z',
  budget: 'flexible' as const,
  partySize: 'two' as const,
  maxCandidates: 20,
};

const filters = {
  requestedDateTime: '2026-08-24T09:30:00.000Z',
  budget: 'flexible' as const,
  partySize: 'two' as const,
};

const contextFor = (query: string, rejectedPlaceIds: string[] = []): RecommendationContext => ({
  discoveryIntent: createDiscoveryIntent(query, filters),
  interests: [],
  maximumDistanceKm: 15,
  requestedDateTime: filters.requestedDateTime,
  partySize: 'two',
  rejectedPlaceIds,
});

const realCandidates: PlaceCandidate[] = [
  {
    id: 'google-hike-1', provider: 'google_places', providerId: 'google-hike-1',
    source: 'google_places_text_search', name: 'Morialta Trail', category: 'Hiking Area',
    types: ['hiking_area'], latitude: -34.91, longitude: 138.7, distanceKm: 8,
    tags: ['hiking area', 'outdoors', 'walking'],
  },
  {
    id: 'google-hike-2', provider: 'google_places', providerId: 'google-hike-2',
    source: 'google_places_text_search', name: 'Waterfall Gully', category: 'Hiking Area',
    types: ['hiking_area'], latitude: -34.96, longitude: 138.68, distanceKm: 9,
    tags: ['hiking area', 'outdoors', 'walking'],
  },
];

test('Google translator preserves Hike intent with a supported type', () => {
  const body = translateToGoogleTextSearch({ ...request, query: 'Hike' });
  assert.equal(body.textQuery, 'hike');
  assert.equal(body.includedType, 'hiking_area');
});

test('Google translator preserves Vegetarian Food intent and budget', () => {
  const body = translateToGoogleTextSearch({ ...request, query: 'Vegetarian Food', budget: '$$' });
  assert.equal(body.textQuery, 'vegetarian food');
  assert.equal(body.includedType, 'vegetarian_restaurant');
  assert.deepEqual(body.priceLevels, ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE']);
});

test('Google translator preserves Live Music as venue discovery, not an event claim', () => {
  const body = translateToGoogleTextSearch(
    { ...request, query: 'Live Music' },
    new Date('2026-08-22T02:00:00.000Z'),
  );
  assert.equal(body.textQuery, 'live music');
  assert.equal(body.includedType, 'live_music_venue');
  assert.equal(body.openNow, undefined);
});

test('Google translator uses openNow only near now and keeps Free as recommendation intent', () => {
  const now = new Date('2026-08-22T02:00:00.000Z');
  const nearNow = translateToGoogleTextSearch({
    ...request,
    query: 'Vegetarian Food',
    budget: 'free',
    requestedDateTime: '2026-08-22T02:30:00.000Z',
  }, now);
  const future = translateToGoogleTextSearch({
    ...request,
    query: 'Vegetarian Food',
    requestedDateTime: '2026-08-22T05:00:00.000Z',
  }, now);
  assert.equal(nearNow.openNow, true);
  assert.equal(nearNow.priceLevels, undefined);
  assert.equal(future.openNow, undefined);
});

test('provider validation bounds location, query length and candidate count', () => {
  assert.equal(validateDiscoveryProviderRequest(request).ok, true);
  assert.equal(validateDiscoveryProviderRequest({ ...request, query: 42 }).ok, false);
  assert.equal(validateDiscoveryProviderRequest({ ...request, latitude: 100 }).ok, false);
  assert.equal(validateDiscoveryProviderRequest({ ...request, query: 'x'.repeat(MAX_QUERY_LENGTH + 1) }).ok, false);
  assert.equal(validateDiscoveryProviderRequest({ ...request, maxCandidates: MAX_CANDIDATES + 1 }).ok, false);
});

test('normalisation retains provider truth, excludes permanent closures and tolerates missing optionals', () => {
  const response = normalizeGoogleTextSearchResponse({
    places: [
      {
        id: 'real-1',
        displayName: { text: 'Belair National Park' },
        location: { latitude: -35.001, longitude: 138.633 },
        primaryType: 'national_park',
        types: ['national_park', 'park'],
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'closed-1',
        displayName: { text: 'Closed forever' },
        location: { latitude: -35, longitude: 138.6 },
        businessStatus: 'CLOSED_PERMANENTLY',
      },
      { id: 'missing-location', displayName: { text: 'Incomplete' } },
    ],
  }, request);

  assert.equal(response.candidates.length, 1);
  const candidate = response.candidates[0];
  assert.equal(candidate?.provider, 'google_places');
  assert.equal(candidate?.providerId, 'real-1');
  assert.equal(candidate?.source, 'google_places_text_search');
  assert.equal(candidate?.address, undefined);
  assert.equal(candidate?.priceLevel, undefined);
  assert.equal(candidate?.isOpen, undefined);
  assert.ok(candidate?.tags.includes('outdoors'));
  assert.equal(response.health, 'DEGRADED');
});

test('rejected real provider ID cannot immediately repeat', () => {
  const result = makeRecommendation(realCandidates, contextFor('Hike', ['google-hike-1']), () => 0);
  assert.equal(result?.place.providerId, 'google-hike-2');
});

test('provider ID rejection works even when the internal candidate ID differs', () => {
  const candidate = { ...realCandidates[0]!, id: 'internal-hike-1', providerId: 'google-hike-1' };
  assert.equal(makeRecommendation([candidate], contextFor('Hike', ['google-hike-1']), () => 0), undefined);
});

test('a Hike request does not fall through to an unrelated high-rated restaurant', () => {
  const restaurant: PlaceCandidate = {
    id: 'restaurant-1', provider: 'google_places', providerId: 'restaurant-1',
    source: 'google_places_text_search', name: 'Popular Restaurant', category: 'Restaurant',
    types: ['restaurant'], latitude: -34.93, longitude: 138.6, distanceKm: 1,
    rating: 5, userRatingCount: 20_000, tags: ['restaurant', 'food'],
  };
  assert.equal(makeRecommendation([restaurant], contextFor('Hike'), () => 0), undefined);
});

test('persistence maps real and mock source provenance correctly', () => {
  const base = {
    id: 'recommendation-1', sessionId: 'session-1', rankPosition: 1,
    recommendation: { place: realCandidates[0]!, score: 0.8, intentMatchScore: 1, noveltyScore: 0.5, reason: 'Fits.', confidenceLabel: 'Good hunch' as const },
  };
  const realValues = mapRecommendationPersistenceValues(base, 'user-1');
  assert.equal(realValues.source, 'google_places');
  assert.equal(realValues.external_place_id, 'google-hike-1');

  const mockPlace: PlaceCandidate = { id: 'mock-1', provider: 'mock', providerId: 'mock-1', source: 'mock', name: 'Demo Place', category: 'Culture', latitude: -34.9, longitude: 138.6, tags: ['culture'] };
  const mockValues = mapRecommendationPersistenceValues({ ...base, recommendation: { ...base.recommendation, place: mockPlace } }, 'user-1');
  assert.equal(mockValues.source, 'mock');
  assert.equal(mockValues.external_place_id, 'mock-1');
});

test('normal entry routes skip legacy onboarding and Settings remains linked from Me', async () => {
  assert.equal(getInitialRoute(false), '/(auth)/welcome');
  assert.equal(getInitialRoute(true), '/(tabs)/do');
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const [welcome, signIn, splash, me] = await Promise.all([
    readFile(resolve(testDirectory, '../app/(auth)/welcome.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/(auth)/sign-in.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/index.tsx'), 'utf8'),
    readFile(resolve(testDirectory, '../app/(tabs)/me.tsx'), 'utf8'),
  ]);
  assert.match(welcome, /Try SponSays without an account[\s\S]*?\/\(tabs\)\/do/);
  assert.doesNotMatch(welcome, /\/\(auth\)\/onboarding/);
  assert.match(signIn, /router\.replace\('\/\(tabs\)\/do'\)/);
  assert.doesNotMatch(signIn, /onboarding_complete|\/\(auth\)\/onboarding/);
  assert.doesNotMatch(splash, /onboarding_complete|\/\(auth\)\/onboarding/);
  assert.match(me, /\/settings/);
});

test('auth identity change resets every discovery-session value', () => {
  const reset = createAuthDiscoveryReset('signed-in-user');
  assert.equal(reset.candidatePool, null);
  assert.equal(reset.candidatePoolKey, null);
  assert.equal(reset.discoveryLocation, null);
  assert.equal(reset.persistenceSession, null);
  assert.equal(reset.currentRecommendationId, null);
  assert.deepEqual(reset.rejectedIds, []);
  assert.equal(reset.replacementCount, 0);
  assert.equal(reset.providerMessage, undefined);
  assert.equal(reset.providerHealth, 'HEALTHY');
  assert.equal(reset.recommendation, undefined);
  assert.equal(reset.status, 'idle');
  assert.equal(reset.locationLabel, 'Location used when you SponSay');
});

test('demo candidate pool cannot survive sign-in and next discovery uses live mode', () => {
  const signedInReset = createAuthDiscoveryReset('signed-in-user');
  assert.equal(signedInReset.candidatePool, null);
  assert.equal(signedInReset.providerMode, 'live');
  assert.equal(getDiscoveryProviderMode('signed-in-user'), 'live');
});

test('sign-out resets to demo mode and Adelaide label', () => {
  const signedOutReset = createAuthDiscoveryReset(null);
  assert.equal(signedOutReset.candidatePool, null);
  assert.equal(signedOutReset.providerMode, 'demo');
  assert.equal(signedOutReset.locationLabel, 'Adelaide · Demo');
  assert.equal(getDiscoveryProviderMode(null), 'demo');
});

test('auth reset effect preserves typed query and committed filters', async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const doScreen = await readFile(resolve(testDirectory, '../app/(tabs)/do.tsx'), 'utf8');
  const effectStart = doScreen.indexOf('const reset = createAuthDiscoveryReset(authIdentity);');
  const effectEnd = doScreen.indexOf('}, [authIdentity]);', effectStart);
  assert.ok(effectStart >= 0 && effectEnd > effectStart);
  const authResetEffect = doScreen.slice(effectStart, effectEnd);
  assert.doesNotMatch(authResetEffect, /setQuery|setFilters/);
  assert.match(authResetEffect, /candidatePool\.current = reset\.candidatePool/);
});
