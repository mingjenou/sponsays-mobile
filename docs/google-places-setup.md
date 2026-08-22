# Google Places setup for real SponSays discovery

The code is ready without a Google key. Signed-out demo mode continues to use the curated Adelaide places. Signed-in real discovery becomes live only after the server setup below is complete.

## 1. Create the Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select the project that will own SponSays Maps Platform usage.
3. Attach an active billing account.
4. Open **APIs & Services → Library** and enable **Places API (New)**. Do not enable or use the legacy Places endpoints for this integration.

## 2. Create and restrict the server key

1. Open **APIs & Services → Credentials**.
2. Create an API key for the Supabase `discover-places` Edge Function.
3. Under **API restrictions**, restrict the key to **Places API (New)**.
4. Use an application restriction only if the deployed server environment has a compatible stable restriction such as known egress IP addresses. Do not use an iOS or Android application restriction for this server key.
5. Set a sensible Google Cloud budget and usage alert.

This is a server key. Never add it to `.env`, `.env.example`, `EXPO_PUBLIC_*`, Expo configuration, React Native code, logs, screenshots, issues, or commits.

## 3. Store the key in Supabase

From a trusted developer terminal, authenticate and link the correct project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set GOOGLE_PLACES_API_KEY=YOUR_SERVER_KEY
```

Replace the placeholders locally. Do not paste the real command or its shell history into project documentation.

## 4. Deploy the authenticated function

```bash
npx supabase functions deploy discover-places
```

The checked-in `supabase/config.toml` keeps JWT verification enabled. The function also validates the bearer token with Supabase Auth before contacting Google. It does not use a service-role key or access the database.

## 5. Configure and sign in to the app

Put only the mobile-safe Supabase project URL and publishable key into a local, ignored `.env` as described in the root README. Restart Expo, create or sign in to a SponSays account, then run the physical tests for **Hike**, **Vegetarian Food**, and **Live Music**.

If the function, secret, billing, or API is unavailable, the app shows a friendly live-discovery message and uses clearly labelled Adelaide demo ideas. That fallback is expected; it is not proof that Google is configured.

## Request and cost boundaries

SponSays uses one [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search) request per new recommendation session and reuses that bounded candidate pool for replacements. It does not mechanically call Nearby Search as well.

Requests are limited to 120 query characters, a 500–50,000 metre radius, and 1–20 candidates. The production field mask is explicit:

```text
places.id
places.displayName
places.formattedAddress
places.location
places.primaryType
places.types
places.businessStatus
places.currentOpeningHours.openNow
places.priceLevel
places.rating
places.userRatingCount
places.googleMapsUri
```

Photos, reviews, editorial summaries, full weekly hours and unrelated atmosphere fields are deliberately not requested. Review Google’s current Places pricing before enabling production traffic.
