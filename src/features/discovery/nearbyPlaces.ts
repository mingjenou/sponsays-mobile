import type { PlaceCandidate } from '@/src/types/place';
import { GOOGLE_PLACES_FIELD_MASK, normalizeGoogleTextSearchResponse, type GoogleTextSearchPayload } from './googlePlaces';
export type { GoogleTextSearchPayload } from './googlePlaces';

export const GOOGLE_NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
export const GOOGLE_NEARBY_FIELD_MASK = GOOGLE_PLACES_FIELD_MASK;
export const MAX_NEARBY_RESULTS = 20;
export const DEFAULT_NEARBY_RADIUS_METERS = 5_000;
export const MAX_NEARBY_RADIUS_METERS = 20_000;

export type AroundCategory = 'all' | 'food' | 'coffee' | 'outdoors' | 'culture' | 'entertainment';
export const getAroundMeProviderMode = (userId?: string | null): 'live' | 'demo' => userId ? 'live' : 'demo';
export interface NearbyRequest { latitude: number; longitude: number; radiusMeters?: number; maxCandidates?: number; category: AroundCategory; query?: string }
export interface NearbyBody {
  includedTypes?: string[]; maxResultCount: number; rankPreference: 'POPULARITY';
  locationRestriction: { circle: { center: { latitude: number; longitude: number }; radius: number } };
  languageCode: 'en'; regionCode: 'AU';
}

const categoryTypes: Record<AroundCategory, string[]> = {
  all: [], food: ['restaurant', 'vegetarian_restaurant', 'cafe'], coffee: ['cafe', 'coffee_shop'],
  outdoors: ['park', 'hiking_area', 'national_park', 'botanical_garden'],
  culture: ['museum', 'art_gallery', 'cultural_center'],
  entertainment: ['live_music_venue', 'movie_theater', 'performing_arts_theater', 'concert_hall'],
};

export const translateNearbyQuery = (query = ''): string[] => {
  const normalized = query.trim().toLowerCase();
  if (/vegetarian|vegan|veggie/.test(normalized)) return ['vegetarian_restaurant'];
  if (/coffee|café|cafe/.test(normalized)) return ['cafe', 'coffee_shop'];
  if (/\bart\b|gallery|museum/.test(normalized)) return ['art_gallery', 'museum'];
  if (/live music|concert|\bgig\b/.test(normalized)) return ['live_music_venue', 'concert_hall'];
  if (/hike|trail|walk/.test(normalized)) return ['hiking_area', 'park'];
  return [];
};

export const translateToGoogleNearbySearch = (request: NearbyRequest): NearbyBody => {
  const queryTypes = translateNearbyQuery(request.query);
  const includedTypes = queryTypes.length > 0 ? queryTypes : categoryTypes[request.category];
  return {
    ...(includedTypes.length ? { includedTypes } : {}),
    maxResultCount: Math.min(MAX_NEARBY_RESULTS, Math.max(1, request.maxCandidates ?? MAX_NEARBY_RESULTS)),
    rankPreference: 'POPULARITY',
    locationRestriction: { circle: { center: { latitude: request.latitude, longitude: request.longitude }, radius: Math.min(MAX_NEARBY_RADIUS_METERS, Math.max(500, request.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS)) } },
    languageCode: 'en', regionCode: 'AU',
  };
};

export const validateNearbyRequest = (value: unknown): { ok: true; value: NearbyRequest & { radiusMeters: number; maxCandidates: number } } | { ok: false; message: string } => {
  if (!value || typeof value !== 'object') return { ok: false, message: 'Request body must be an object.' };
  const input = value as Record<string, unknown>;
  const latitude = Number(input.latitude), longitude = Number(input.longitude);
  const category = input.category as AroundCategory;
  const radiusMeters = input.radiusMeters === undefined ? DEFAULT_NEARBY_RADIUS_METERS : Number(input.radiusMeters);
  const maxCandidates = input.maxCandidates === undefined ? MAX_NEARBY_RESULTS : Number(input.maxCandidates);
  const query = input.query === undefined ? '' : input.query;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { ok: false, message: 'Latitude is invalid.' };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { ok: false, message: 'Longitude is invalid.' };
  if (!Object.hasOwn(categoryTypes, category)) return { ok: false, message: 'Category is invalid.' };
  if (typeof query !== 'string' || query.length > 120) return { ok: false, message: 'Query is invalid.' };
  if (!Number.isFinite(radiusMeters) || radiusMeters < 500 || radiusMeters > MAX_NEARBY_RADIUS_METERS) return { ok: false, message: 'Radius is invalid.' };
  if (!Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > MAX_NEARBY_RESULTS) return { ok: false, message: 'Candidate count is invalid.' };
  return { ok: true, value: { latitude, longitude, category, query: query.trim(), radiusMeters, maxCandidates } };
};

export const dedupeNearbyCandidates = (candidates: PlaceCandidate[]): PlaceCandidate[] => {
  const ids = new Set<string>(); const coordinates = new Set<string>();
  return candidates.filter((candidate) => {
    if (candidate.businessStatus === 'CLOSED_PERMANENTLY') return false;
    const coordinate = `${candidate.latitude.toFixed(5)},${candidate.longitude.toFixed(5)}`;
    if (ids.has(candidate.providerId) || coordinates.has(coordinate)) return false;
    ids.add(candidate.providerId); coordinates.add(coordinate); return true;
  }).slice(0, MAX_NEARBY_RESULTS);
};

export const normalizeGoogleNearbyResponse = (payload: GoogleTextSearchPayload, request: NearbyRequest) => {
  const normalized = normalizeGoogleTextSearchResponse(payload, request);
  const candidates = dedupeNearbyCandidates(normalized.candidates.map((candidate) => ({
    ...candidate, source: 'google_places_nearby_search' as const,
    ...(candidate.googleMapsUri ? { sourceUrl: candidate.googleMapsUri } : {}),
  })));
  return { candidates, health: normalized.health, source: 'google_places_nearby_search' as const };
};

export const selectNearbyCandidate = (candidates: PlaceCandidate[], providerId: string): PlaceCandidate | undefined =>
  candidates.find((candidate) => candidate.providerId === providerId);

export const shouldSearchAfterRegionChange = (): false => false;
