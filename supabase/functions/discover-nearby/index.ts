import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GOOGLE_NEARBY_FIELD_MASK, GOOGLE_NEARBY_SEARCH_URL, normalizeGoogleNearbyResponse, translateToGoogleNearbySearch, validateNearbyRequest, type GoogleTextSearchPayload } from '../../../src/features/discovery/nearbyPlaces.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST is required.' } }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }, 401);
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return json({ error: { code: 'SERVER_CONFIGURATION', message: 'Authentication is unavailable.' } }, 503);
  const authClient = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }, 401);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: { code: 'INVALID_REQUEST', message: 'Valid JSON is required.' } }, 400); }
  const validated = validateNearbyRequest(body);
  if (!validated.ok) return json({ error: { code: 'INVALID_REQUEST', message: validated.message } }, 400);
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) return json({ error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'Nearby discovery is not configured.' } }, 503);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const upstream = await fetch(GOOGLE_NEARBY_SEARCH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': GOOGLE_NEARBY_FIELD_MASK }, body: JSON.stringify(translateToGoogleNearbySearch(validated.value)), signal: controller.signal });
    if (!upstream.ok) return json({ error: { code: 'PROVIDER_ERROR', message: 'Nearby discovery is unavailable.' } }, 502);
    return json(normalizeGoogleNearbyResponse(await upstream.json() as GoogleTextSearchPayload, validated.value));
  } catch { return json({ error: { code: 'PROVIDER_TIMEOUT', message: 'Nearby discovery timed out.' } }, 504); }
  finally { clearTimeout(timeout); }
});
