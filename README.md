# SponSays

SponSays is a mobile decision service: give it a little context, receive one useful recommendation, and go do it. It is intentionally not a directory or an endless list of nearby places.

This repository currently contains **Milestone 1 — the Expo QR prototype**. It uses curated Adelaide demo data and works without accounts, API keys, Supabase, Google Places or OpenAI.

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
2. Complete or skip the short demo onboarding.
3. On **Do**, change between Safe, Spontaneous and Chaos.
4. Tap **SPONSAY ME ✦**.
5. Confirm one Adelaide recommendation appears.
6. Tap **Not feeling it** and confirm a different recommendation appears.
7. Tap **LET'S GO**, then try the directions button and feedback.
8. Open **Around Me**, **Memories** and **Me** using the bottom tabs.

## Developer commands

Use npm only. Do not add yarn, pnpm or bun lockfiles.

```bash
npm install
npm run typecheck
npm run lint
npx expo start
```

There is no test framework in Milestone 1; the local recommendation engine gets focused automated tests before real-data rollout.

## Project map

```text
app/                         Expo Router screens and navigation
  (auth)/                    Welcome and lightweight demo onboarding
  (tabs)/                    Do, Around Me, Memories and Me
  recommendation/[id].tsx    Accepted recommendation action view
src/
  components/                Reusable UI pieces
  features/recommendations/  Credential-free recommendation rules
  mocks/                     Curated Adelaide demo places
  theme/                     Brand colours, spacing and typography
  types/                     Shared domain types
docs/                        Architecture, product and testing notes
```

## Configuration and secrets

Milestone 1 needs no `.env` file. `.env.example` documents future variable names without real keys.

Never place an OpenAI key, Google server key or Supabase service-role key in an `EXPO_PUBLIC_` variable. Those secrets must stay on a server in later milestones.

## Current milestone

- Milestone 0: complete
- Milestone 1: implemented and locally verified
- Milestone 2 (Supabase): intentionally not started

The next step is founder testing in Expo Go on a physical phone. Do not add external services until that test is confirmed.
