import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addPlanToCalendarWithGateway } from '../src/features/calendar/calendarCore';
import { dedupeNearbyCandidates, getAroundMeProviderMode, MAX_NEARBY_RESULTS, normalizeGoogleNearbyResponse, selectNearbyCandidate, shouldSearchAfterRegionChange, translateNearbyQuery, translateToGoogleNearbySearch, validateNearbyRequest } from '../src/features/discovery/nearbyPlaces';
import { reminderDateFor, setPlanReminderWithGateway } from '../src/features/notifications/notificationCore';
import { getCandidateDescription, getCandidateSourceUrl } from '../src/features/recommendations/candidateDescription';
import { buildPlannedExperience, isMemoryEligible, isUpcomingPlan } from '../src/features/planned/plannedLifecycle';
import type { PlannedExperience } from '../src/features/planned/types';
import type { PlaceCandidate } from '../src/types/place';

const directory = dirname(fileURLToPath(import.meta.url));
const candidate: PlaceCandidate = { id: 'p1', provider: 'google_places', providerId: 'p1', source: 'google_places_nearby_search', name: 'Museum', category: 'Museum', latitude: -34.9, longitude: 138.6, distanceKm: 1.2, googleMapsUri: 'https://maps.google.com/?cid=1', sourceUrl: 'https://maps.google.com/?cid=1', tags: ['museum', 'culture'] };
const plan: PlannedExperience = { id: 'plan-1', recommendationId: 'rec-1', externalPlaceId: 'p1', provider: 'google_places', placeName: 'Museum', description: 'Museum around 1.2 km away.', sourceUrl: candidate.sourceUrl, latitude: candidate.latitude, longitude: candidate.longitude, plannedFor: '2026-08-24T09:30:00.000Z', status: 'planned', reminderOffsetMinutes: null, createdAt: '2026-08-22T00:00:00.000Z', updatedAt: '2026-08-22T00:00:00.000Z' };

test('description fallback is factual and source URL is preserved', () => {
  assert.equal(getCandidateDescription(candidate), 'Museum around 1.2 km away.');
  assert.equal(getCandidateSourceUrl(candidate), candidate.googleMapsUri);
  assert.doesNotMatch(getCandidateDescription(candidate), /best|popular|locals/i);
});

test('planned lifecycle keeps future accepted out of Memories until completion', () => {
  assert.equal(isUpcomingPlan(plan, new Date('2026-08-23T00:00:00Z')), true);
  assert.equal(isMemoryEligible(plan), false);
  assert.equal(isUpcomingPlan({ ...plan, status: 'cancelled' }, new Date('2026-08-23T00:00:00Z')), false);
  assert.equal(isMemoryEligible({ ...plan, status: 'completed' }), true);
});

test("I'M IN mapping creates a Planned item at the selected requestedDateTime", () => {
  const planned = buildPlannedExperience({ place: candidate, score: 1, intentMatchScore: 1, noveltyScore: 0, reason: 'Fits.', confidenceLabel: 'Strong match' }, plan.plannedFor, 'rec-1');
  assert.equal(planned.plannedFor, plan.plannedFor);
  assert.equal(planned.recommendationId, 'rec-1');
  assert.equal(planned.sourceUrl, candidate.sourceUrl);
  assert.equal(planned.status, 'planned');
});

test('calendar uses planned_for, default duration, and avoids duplicate event creation', async () => {
  let created: Record<string, unknown> | undefined;
  const gateway = {
    hasPermission: async () => true, requestPermission: async () => true,
    getWritableCalendarId: async () => 'calendar-1', eventExists: async (id: string) => id === 'event-existing', createEvent: async (_id: string, value: Record<string, unknown>) => { created = value; return 'event-new'; },
  } as never;
  const result = await addPlanToCalendarWithGateway(plan, gateway);
  assert.equal(result.status, 'added');
  assert.equal((created?.startDate as Date).toISOString(), plan.plannedFor);
  assert.equal((created?.endDate as Date).getTime() - (created?.startDate as Date).getTime(), 120 * 60_000);
  const existing = await addPlanToCalendarWithGateway({ ...plan, calendarEventId: 'event-existing' }, gateway);
  assert.deepEqual(existing, { status: 'existing', eventId: 'event-existing' });
});

test('calendar and reminder permission denial remain calm and non-destructive', async () => {
  const calendar = await addPlanToCalendarWithGateway(plan, { hasPermission: async () => false, requestPermission: async () => false, eventExists: async () => false } as never);
  assert.equal(calendar.status, 'denied');
  const reminders = { hasPermission: async () => false, requestPermission: async () => false, cancel: async () => {}, schedule: async () => 'notification' } as never;
  assert.equal((await setPlanReminderWithGateway(plan, 60, reminders, new Date('2026-08-22T00:00:00Z'))).status, 'denied');
});

test('reminder schedules one hour before, rejects past times and cancels old ID on reschedule', async () => {
  const cancelled: string[] = []; let scheduledDate: Date | undefined;
  const gateway = { hasPermission: async () => true, requestPermission: async () => true, cancel: async (id: string) => { cancelled.push(id); }, schedule: async (date: Date) => { scheduledDate = date; return 'new-notification'; } } as never;
  const result = await setPlanReminderWithGateway({ ...plan, notificationId: 'old-notification' }, 60, gateway, new Date('2026-08-22T00:00:00Z'));
  assert.equal(result.status, 'scheduled'); assert.deepEqual(cancelled, ['old-notification']);
  assert.equal(scheduledDate?.toISOString(), reminderDateFor(plan.plannedFor, 60).toISOString());
  assert.equal((await setPlanReminderWithGateway(plan, 60, gateway, new Date('2026-08-25T00:00:00Z'))).status, 'too_late');
});

test('Around Me provider mode separates signed-in live from signed-out demo', () => {
  assert.equal(getAroundMeProviderMode('user-1'), 'live'); assert.equal(getAroundMeProviderMode(null), 'demo');
});

test('Nearby category/query translation uses supported bounded types and result cap', () => {
  assert.deepEqual(translateNearbyQuery('Vegetarian'), ['vegetarian_restaurant']);
  assert.deepEqual(translateNearbyQuery('Live music'), ['live_music_venue', 'concert_hall']);
  const body = translateToGoogleNearbySearch({ latitude: -34.9, longitude: 138.6, category: 'outdoors', maxCandidates: 99 });
  assert.deepEqual(body.includedTypes, ['park', 'hiking_area', 'national_park', 'botanical_garden']);
  assert.equal(body.maxResultCount, MAX_NEARBY_RESULTS);
  assert.equal(validateNearbyRequest({ latitude: -34.9, longitude: 138.6, category: 'all', maxCandidates: 21 }).ok, false);
});

test('Nearby normalization excludes closures, duplicate IDs/coordinates and maps selected card by provider ID', () => {
  const candidates = dedupeNearbyCandidates([candidate, { ...candidate }, { ...candidate, id: 'p2', providerId: 'p2', latitude: -34.91 }, { ...candidate, id: 'closed', providerId: 'closed', latitude: -34.92, businessStatus: 'CLOSED_PERMANENTLY' }]);
  assert.equal(candidates.length, 2); assert.equal(selectNearbyCandidate(candidates, 'p2')?.providerId, 'p2');
  const normalized = normalizeGoogleNearbyResponse({ places: [{ id: 'g1', displayName: { text: 'Gallery' }, location: { latitude: -34.91, longitude: 138.61 }, primaryType: 'art_gallery', googleMapsUri: 'https://maps.google.com/g1' }] }, { latitude: -34.9, longitude: 138.6, category: 'culture' });
  assert.equal(normalized.candidates[0]?.sourceUrl, 'https://maps.google.com/g1');
  assert.equal(normalized.candidates[0]?.source, 'google_places_nearby_search');
});

test('map pan alone never requests the provider and Do still renders one recommendation card', async () => {
  assert.equal(shouldSearchAfterRegionChange(), false);
  const [around, doScreen, migration] = await Promise.all([
    readFile(resolve(directory, '../app/(tabs)/around-me.tsx'), 'utf8'), readFile(resolve(directory, '../app/(tabs)/do.tsx'), 'utf8'), readFile(resolve(directory, '../supabase/migrations/20260822_planned_experiences.sql'), 'utf8'),
  ]);
  assert.match(around, /onRegionChangeComplete[\s\S]*setAreaMoved\(true\)/);
  assert.doesNotMatch(around.match(/onRegionChangeComplete=\{[^}]+\}/)?.[0] ?? '', /discoverNearbyPlaces|search\(/);
  assert.equal((doScreen.match(/<RevealCard/g) ?? []).length, 1);
  assert.match(doScreen, /filters\.requestedDateTime/);
  assert.match(migration, /enable row level security/); assert.match(migration, /auth\.uid\(\) = user_id/g);
});
