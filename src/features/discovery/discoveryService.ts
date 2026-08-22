import type { PlaceCandidate } from '../../types/place';
import { supabase } from '../../services/supabase/client';
import { withRequestTimeout } from '../../services/supabase/service';
import type {
  DiscoveryProviderRequest,
  DiscoveryProviderResponse,
  ProviderHealth,
} from './providerTypes';
import { MAX_CANDIDATES } from './googlePlaces';

export interface LiveDiscoveryResult {
  candidates: PlaceCandidate[];
  health: ProviderHealth;
  message?: string;
}

const isCandidate = (value: unknown): value is PlaceCandidate => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PlaceCandidate>;
  return candidate.provider === 'google_places' &&
    candidate.source === 'google_places_text_search' &&
    typeof candidate.providerId === 'string' &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude) &&
    Array.isArray(candidate.tags);
};

const parseResponse = (value: unknown): DiscoveryProviderResponse | null => {
  if (!value || typeof value !== 'object') return null;
  const response = value as Partial<DiscoveryProviderResponse>;
  if (!Array.isArray(response.candidates) || response.candidates.length > MAX_CANDIDATES ||
      !['HEALTHY', 'DEGRADED'].includes(String(response.health)) ||
      response.source !== 'google_places_text_search' ||
      !response.candidates.every(isCandidate)) return null;
  return response as DiscoveryProviderResponse;
};

export const discoverRealPlaces = async (
  request: DiscoveryProviderRequest,
): Promise<LiveDiscoveryResult> => {
  if (!supabase) {
    return { candidates: [], health: 'UNAVAILABLE', message: 'Live discovery is not configured.' };
  }

  try {
    const { data, error } = await withRequestTimeout(
      supabase.functions.invoke('discover-places', { body: request }),
      'discover-places',
    );
    if (error) {
      if (__DEV__) console.warn(`[SponSays discovery] ${error.message}`);
      return { candidates: [], health: 'UNAVAILABLE', message: 'Live discovery is unavailable right now.' };
    }
    const response = parseResponse(data);
    if (!response) return { candidates: [], health: 'DEGRADED', message: 'Live discovery returned an unexpected response.' };
    return response.candidates.length > 0
      ? { candidates: response.candidates, health: response.health }
      : { candidates: [], health: 'DEGRADED', message: 'No live places matched that search.' };
  } catch (error) {
    if (__DEV__) console.warn(`[SponSays discovery] ${error instanceof Error ? error.message : 'Request failed'}`);
    return { candidates: [], health: 'UNAVAILABLE', message: 'Live discovery is unavailable right now.' };
  }
};
