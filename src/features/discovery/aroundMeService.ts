import type { PlaceCandidate } from '@/src/types/place';
import { supabase } from '@/src/services/supabase/client';
import { withRequestTimeout } from '@/src/services/supabase/service';
import { MAX_NEARBY_RESULTS, type NearbyRequest } from './nearbyPlaces';
import type { ProviderHealth } from './providerTypes';

export interface NearbyResult { candidates: PlaceCandidate[]; health: ProviderHealth; message?: string }
export const discoverNearbyPlaces = async (request: NearbyRequest): Promise<NearbyResult> => {
  if (!supabase) return { candidates: [], health: 'UNAVAILABLE', message: 'Live nearby discovery is not configured.' };
  try {
    const { data, error } = await withRequestTimeout(supabase.functions.invoke('discover-nearby', { body: request }), 'discover-nearby');
    if (error) return { candidates: [], health: 'UNAVAILABLE', message: 'Nearby discovery is unavailable right now.' };
    if (!data || typeof data !== 'object' || !Array.isArray(data.candidates) || data.candidates.length > MAX_NEARBY_RESULTS) return { candidates: [], health: 'DEGRADED', message: 'Nearby discovery returned an unexpected response.' };
    const candidates = data.candidates.filter((candidate: unknown): candidate is PlaceCandidate => Boolean(candidate && typeof candidate === 'object' && typeof (candidate as PlaceCandidate).providerId === 'string' && Number.isFinite((candidate as PlaceCandidate).latitude) && Number.isFinite((candidate as PlaceCandidate).longitude)));
    return { candidates, health: data.health === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED' };
  } catch { return { candidates: [], health: 'UNAVAILABLE', message: 'Nearby discovery is unavailable right now.' }; }
};
