# SponSays

SponSays is a mobile decision service: give it a little context, receive one useful recommendation, and go do it. It is intentionally not a directory or an endless list of nearby places.

This repository contains the Expo QR prototype plus optional Supabase accounts, private user-data persistence and authenticated real-place discovery. It still works without an account, an `.env` file or external credentials by using the curated Adelaide demo.

## RUN SPONSAYS ON YOUR PHONE

You do not need to know how to code. You need a computer with Node.js installed and a phone connected to the internet.

### Step 1 — install Expo Go

Expo Go is the free phone app that opens and runs this Expo project without needing a native app build.

On your phone, install **Expo Go** from the Apple App Store or Google Play Store.

### Step 2 — open Terminal in this project

Open the SponSays project folder, then open Terminal in that folder. The folder is:

```text
/Users/mingvivana/Documents/SponSays
```

### Step 3 — install dependencies if necessary

Run this once, or whenever someone tells you the dependencies changed:

```bash
npm install
```

Wait until the command finishes.

If Terminal says `command not found: npm`, install the current **LTS** version from [nodejs.org](https://nodejs.org/), close and reopen Terminal, then repeat `npm install`.

### Step 4 — start SponSays

Run:

```bash
npx expo start
```

Keep Terminal open. A square QR code should appear.

### Step 5 — scan the QR code

- **iPhone:** open the normal Camera app, point it at the QR code, then tap the Expo Go banner.
- **Android:** open Expo Go and use its QR scanner. Your normal camera may also work.

The phone and computer should normally be on the same Wi-Fi network.

### Connection troubleshooting

If the phone cannot connect, stop the running command with `Control + C`, then run:

```bash
npx expo start --tunnel
```

Scan the new QR code. Tunnel mode can be slower, but it usually works when home, office or guest Wi-Fi blocks a direct connection.

If Expo Go says the project SDK is incompatible, update Expo Go from the phone’s app store. This project intentionally uses Expo SDK 54 because Expo’s current physical-device guidance during the SDK 57 transition says to use SDK 54 for App Store / Play Store Expo Go.

## What to test

1. Wait for the SponSays splash.
2. Choose demo mode and confirm **Do** opens directly—there is no required preference-selection screen.
3. On **Do**, optionally enter an idea and set compact When/Budget/Who filters.
4. Tap **SPONSAY ME ✦** for one recommendation.
5. Confirm one Adelaide recommendation appears.
6. Tap **Not this one** and confirm a different recommendation appears.
7. Tap **I’M IN**, then try the directions button and feedback.
8. Open **Around Me**, **Memories** and **Me** using the bottom tabs.

## Developer commands

Use npm only. Do not add yarn, pnpm or bun lockfiles.

```bash
npm install
npm test
npm run typecheck
npm run lint
npx expo start
```

Focused tests cover discovery intent, recommendation variation, authenticated settings mapping, persistence readiness and auth error copy.

## Project map

```text
app/                         Expo Router screens and navigation
  (auth)/                    Welcome, optional email auth and a legacy compatibility onboarding route
  (tabs)/                    Do, Around Me, Memories and Me
  recommendation/[id].tsx    Accepted recommendation action view
src/
  components/                Reusable UI pieces
  features/auth/             Optional Supabase authentication boundary
  features/profile/          Signed-in profile and preference services
  features/memories/         Private accepted-recommendation history
  features/favourites/       Save-for-later persistence
  features/feedback/         One feedback answer per recommendation
  features/discovery/        Provider contracts, translation, location and live discovery boundary
  features/recommendations/  Provider-independent recommendation rules and detail cache
  mocks/                     Curated Adelaide demo places
  theme/                     Brand colours, spacing and typography
  types/                     Shared domain types
  services/supabase/         Safe client configuration and database types
docs/                        Architecture, product and testing notes
supabase/                    Database migrations and authenticated Edge Function
```

## OPTIONAL SUPABASE AND GOOGLE SETUP

No setup is required to run or test the SponSays demo. When Supabase is absent—or the user is signed out—the same Adelaide mock journey remains available and no demo activity is written remotely. Real Google discovery is initially restricted to authenticated development users.

For future real-account testing, create a local `.env` file in the repository root. Do not commit it. It should contain only the mobile-safe project settings supplied by Supabase:

```text
EXPO_PUBLIC_APP_MODE=mock
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Leave the values blank until a project is ready. Restart Expo after changing environment variables. Database instructions are in `supabase/README.md`; the complete live provider steps are in [`docs/google-places-setup.md`](docs/google-places-setup.md).

## Configuration and secrets

The demo needs no `.env` file. `.env.example` contains blank placeholders only, while `.gitignore` keeps local environment files out of version control.

Never place an OpenAI key, Google server key or Supabase service-role key in an `EXPO_PUBLIC_` variable. The Google key belongs only in the deployed Edge Function secret store; service-role and OpenAI keys are not used by this milestone.

## Current milestone

- Milestones 0 and 1: implemented and physically verified in Expo Go
- Task 3A: optional Supabase client, email-auth boundary, database schema and RLS foundation
- Task 3C: signed-in profiles, preferences, recommendations, Memories, favourites and feedback persistence
- Task 4A: idea search, compact When/Budget/Who filters and one internal recommendation behaviour
- Task 4B: direct entry plus authenticated server-side Google Places Text Search (New), with explicit demo fallbacks

Google supplies bounded real candidate pools; the SponSays engine still chooses one result. Google Places does not prove that a live event is currently occurring. OpenAI, event sources, analytics and subscriptions remain out of scope.
