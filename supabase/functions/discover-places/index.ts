import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  GOOGLE_PLACES_FIELD_MASK,
  GOOGLE_TEXT_SEARCH_URL,
  normalizeGoogleTextSearchResponse,
  translateToGoogleTextSearch,
  validateDiscoveryProviderRequest,
  type GoogleTextSearchPayload,
} from '../../../src/features/discovery/googlePlaces.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST is required.' } }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !publishableKey) return json({ error: { code: 'SERVER_CONFIGURATION', message: 'Authentication is unavailable.' } }, 503);
  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }, 401);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: { code: 'INVALID_REQUEST', message: 'Valid JSON is required.' } }, 400); }
  const validated = validateDiscoveryProviderRequest(body);
  if (!validated.ok) return json({ error: { code: 'INVALID_REQUEST', message: validated.message } }, 400);

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) return json({ error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'Live discovery is not configured.' } }, 503);

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 8_000);
    const upstream = await fetch(GOOGLE_TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASK,
      },
      body: JSON.stringify(translateToGoogleTextSearch(validated.value)),
      signal: controller.signal,
    });
    if (!upstream.ok) return json({ error: { code: 'PROVIDER_ERROR', message: 'Place discovery is unavailable.' } }, 502);
    const payload = await upstream.json() as GoogleTextSearchPayload;
    const normalized = normalizeGoogleTextSearchResponse(payload, validated.value);
    return json({
      ...normalized,
      candidates: normalized.candidates.slice(0, validated.value.maxCandidates),
    });
  } catch {
    return json({ error: { code: 'PROVIDER_TIMEOUT', message: 'Place discovery timed out.' } }, 504);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});
