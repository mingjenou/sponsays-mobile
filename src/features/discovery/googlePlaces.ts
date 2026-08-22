import type { DiscoveryProviderRequest, DiscoveryProviderResponse } from './providerTypes';

export const GOOGLE_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
export const GOOGLE_PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.types',
  'places.businessStatus',
  'places.currentOpeningHours.openNow',
  'places.priceLevel',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
].join(',');

export const MAX_QUERY_LENGTH = 120;
export const MIN_RADIUS_METERS = 500;
export const MAX_RADIUS_METERS = 50_000;
export const MAX_CANDIDATES = 20;
export const DEFAULT_CANDIDATES = 12;

interface GoogleDisplayName { text?: unknown }
interface GoogleLocation { latitude?: unknown; longitude?: unknown }
interface GoogleOpeningHours { openNow?: unknown }
export interface GooglePlacePayload {
  id?: unknown;
  displayName?: GoogleDisplayName;
  formattedAddress?: unknown;
  location?: GoogleLocation;
  primaryType?: unknown;
  types?: unknown;
  businessStatus?: unknown;
  currentOpeningHours?: GoogleOpeningHours;
  priceLevel?: unknown;
  rating?: unknown;
  userRatingCount?: unknown;
  googleMapsUri?: unknown;
  liveMusic?: unknown;
  servesVegetarianFood?: unknown;
}

export interface GoogleTextSearchPayload { places?: unknown }

export interface GoogleTextSearchBody {
  textQuery: string;
  pageSize: number;
  locationBias: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
  languageCode: 'en';
  regionCode: 'AU';
  rankPreference: 'RELEVANCE';
  includedType?: string;
  strictTypeFiltering?: false;
  openNow?: true;
  priceLevels?: string[];
}

export type ValidatedDiscoveryProviderRequest = DiscoveryProviderRequest & {
  query: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  maxCandidates: number;
};

const finiteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const validateDiscoveryProviderRequest = (
  value: unknown,
): { ok: true; value: ValidatedDiscoveryProviderRequest } | { ok: false; message: string } => {
  if (!value || typeof value !== 'object') return { ok: false, message: 'Request body must be an object.' };
  const input = value as Record<string, unknown>;
  if (typeof input.query !== 'string') return { ok: false, message: 'Query must be text.' };
  const query = input.query.trim();
  const latitude = finiteNumber(input.latitude);
  const longitude = finiteNumber(input.longitude);
  const radiusMeters = input.radiusMeters === undefined ? 15_000 : finiteNumber(input.radiusMeters);
  const maxCandidates = input.maxCandidates === undefined ? DEFAULT_CANDIDATES : finiteNumber(input.maxCandidates);

  if (query.length > MAX_QUERY_LENGTH) return { ok: false, message: `Query must be ${MAX_QUERY_LENGTH} characters or fewer.` };
  if (latitude === undefined || latitude < -90 || latitude > 90) return { ok: false, message: 'Latitude is invalid.' };
  if (longitude === undefined || longitude < -180 || longitude > 180) return { ok: false, message: 'Longitude is invalid.' };
  if (radiusMeters === undefined || radiusMeters < MIN_RADIUS_METERS || radiusMeters > MAX_RADIUS_METERS) return { ok: false, message: `Radius must be between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} metres.` };
  if (maxCandidates === undefined || !Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > MAX_CANDIDATES) return { ok: false, message: `Candidate count must be between 1 and ${MAX_CANDIDATES}.` };

  const validTimes = ['now', 'tonight', 'tomorrow', 'flexible'];
  const validBudgets = ['free', '$', '$$', '$$$', 'flexible'];
  const validParties = ['solo', 'two', 'small_group', 'large_group'];
  if (input.timePreference !== undefined && !validTimes.includes(String(input.timePreference))) return { ok: false, message: 'Time preference is invalid.' };
  if (input.budget !== undefined && !validBudgets.includes(String(input.budget))) return { ok: false, message: 'Budget is invalid.' };
  if (input.partySize !== undefined && !validParties.includes(String(input.partySize))) return { ok: false, message: 'Party size is invalid.' };

  return {
    ok: true,
    value: {
      query,
      latitude,
      longitude,
      radiusMeters,
      maxCandidates,
      ...(input.timePreference === undefined ? {} : { timePreference: input.timePreference as DiscoveryProviderRequest['timePreference'] }),
      ...(input.budget === undefined ? {} : { budget: input.budget as DiscoveryProviderRequest['budget'] }),
      ...(input.partySize === undefined ? {} : { partySize: input.partySize as DiscoveryProviderRequest['partySize'] }),
    },
  };
};

const classifyQuery = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (/\b(hike|hiking|trail|walk|walking)\b/.test(normalized)) {
    return { textQuery: normalized || 'hiking trails and nature walks', includedType: 'hiking_area' };
  }
  if (/\b(vegetarian|veggie|vegan)\b/.test(normalized)) {
    return { textQuery: normalized || 'vegetarian food', includedType: 'vegetarian_restaurant' };
  }
  if (/\b(live music|concert|gig)\b/.test(normalized)) {
    return { textQuery: normalized || 'live music venues', includedType: 'live_music_venue' };
  }
  return { textQuery: normalized || 'interesting places and activities' };
};

export const translateToGoogleTextSearch = (request: DiscoveryProviderRequest): GoogleTextSearchBody => {
  const classified = classifyQuery(request.query);
  const pageSize = Math.min(MAX_CANDIDATES, Math.max(1, request.maxCandidates ?? DEFAULT_CANDIDATES));
  const body: GoogleTextSearchBody = {
    textQuery: classified.textQuery,
    pageSize,
    locationBias: {
      circle: {
        center: { latitude: request.latitude, longitude: request.longitude },
        radius: request.radiusMeters ?? 15_000,
      },
    },
    languageCode: 'en',
    regionCode: 'AU',
    rankPreference: 'RELEVANCE',
    ...(classified.includedType ? { includedType: classified.includedType, strictTypeFiltering: false as const } : {}),
  };
  if (request.timePreference === 'now') body.openNow = true;

  // Google only supports request-side price filters for selected place categories.
  // "Free" is response-only, so it remains recommendation intent rather than a fabricated filter.
  if (classified.includedType === 'vegetarian_restaurant') {
    if (request.budget === '$') body.priceLevels = ['PRICE_LEVEL_INEXPENSIVE'];
    if (request.budget === '$$') body.priceLevels = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE'];
    if (request.budget === '$$$') body.priceLevels = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE'];
  }
  return body;
};

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const toRadians = (degrees: number) => degrees * Math.PI / 180;
export const distanceInKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLat - fromLat);
  const longitudeDelta = toRadians(toLng - fromLng);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const categoryLabel = (primaryType?: string) =>
  primaryType?.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const tagsFor = (types: string[], place: GooglePlacePayload): string[] => {
  const tags = new Set(types.map((type) => type.replaceAll('_', ' ')));
  if (types.some((type) => ['hiking_area', 'park', 'national_park', 'botanical_garden'].includes(type))) {
    tags.add('outdoors'); tags.add('walking');
  }
  if (types.some((type) => ['restaurant', 'vegetarian_restaurant', 'cafe'].includes(type))) tags.add('food');
  if (types.includes('vegetarian_restaurant') || place.servesVegetarianFood === true) tags.add('vegetarian');
  if (types.some((type) => ['live_music_venue', 'concert_hall', 'performing_arts_theater', 'night_club', 'bar'].includes(type)) || place.liveMusic === true) {
    tags.add('live music'); tags.add('entertainment'); tags.add('nightlife');
  }
  if (types.some((type) => ['museum', 'art_gallery', 'cultural_center'].includes(type))) tags.add('culture');
  return [...tags];
};

export const normalizeGoogleTextSearchResponse = (
  payload: GoogleTextSearchPayload,
  request: Pick<DiscoveryProviderRequest, 'latitude' | 'longitude'>,
): DiscoveryProviderResponse => {
  const rawPlaces = Array.isArray(payload.places) ? payload.places : [];
  let dropped = 0;
  const candidates = rawPlaces.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') { dropped += 1; return []; }
    const place = raw as GooglePlacePayload;
    const providerId = optionalString(place.id);
    const name = optionalString(place.displayName?.text);
    const latitude = finiteNumber(place.location?.latitude);
    const longitude = finiteNumber(place.location?.longitude);
    const businessStatus = optionalString(place.businessStatus);
    if (businessStatus === 'CLOSED_PERMANENTLY') return [];
    if (!providerId || !name || latitude === undefined || longitude === undefined) { dropped += 1; return []; }
    const types = Array.isArray(place.types) ? place.types.filter((type): type is string => typeof type === 'string') : [];
    const primaryType = optionalString(place.primaryType);
    const normalizedTypes = primaryType ? [...new Set([primaryType, ...types])] : types;
    const priceLevelName = optionalString(place.priceLevel);
    const rating = finiteNumber(place.rating);
    const userRatingCount = finiteNumber(place.userRatingCount);
    const isOpen = typeof place.currentOpeningHours?.openNow === 'boolean' ? place.currentOpeningHours.openNow : undefined;
    return [{
      id: providerId,
      provider: 'google_places' as const,
      providerId,
      source: 'google_places_text_search' as const,
      name,
      ...(primaryType ? { category: categoryLabel(primaryType), types: normalizedTypes } : types.length ? { types } : {}),
      latitude,
      longitude,
      ...(businessStatus ? { businessStatus } : {}),
      ...(rating === undefined ? {} : { rating }),
      ...(userRatingCount === undefined ? {} : { userRatingCount }),
      ...(priceLevelName && PRICE_LEVELS[priceLevelName] !== undefined ? { priceLevel: PRICE_LEVELS[priceLevelName] } : {}),
      distanceKm: distanceInKm(request.latitude, request.longitude, latitude, longitude),
      ...(isOpen === undefined ? {} : { isOpen }),
      ...(typeof place.servesVegetarianFood === 'boolean' ? { servesVegetarianFood: place.servesVegetarianFood } : {}),
      ...(typeof place.liveMusic === 'boolean' ? { liveMusic: place.liveMusic } : {}),
      ...(optionalString(place.googleMapsUri) ? { googleMapsUri: optionalString(place.googleMapsUri) } : {}),
      ...(optionalString(place.formattedAddress) ? { address: optionalString(place.formattedAddress) } : {}),
      tags: tagsFor(normalizedTypes, place),
    }];
  });

  return {
    candidates,
    health: dropped > 0 ? 'DEGRADED' : 'HEALTHY',
    source: 'google_places_text_search',
  };
};
