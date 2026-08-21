# SponSays agent guide

Read this file before changing the repository.

## Product

SponSays reduces decision fatigue. The user provides a little context and receives **one** primary recommendation. The core question is “SponSays, what should I do?” and the core action is **SPONSAY ME ✦**.

Never redesign SponSays into a directory, list-first marketplace, travel browser, social feed, map clone or infinite swipe experience.

## Current milestone

Milestones 0 and 1 are implemented and physically verified in Expo Go. Task 3A adds an optional Supabase client, Auth boundary, database migration and RLS foundation. The credential-free Adelaide demo remains the default; recommendation persistence is not connected yet.

## Stack and architecture

- Expo SDK 54, React Native, TypeScript and Expo Router
- File-based routes in `app/`
- Reusable UI in `src/components/`
- Central design tokens in `src/theme/`
- Recommendation business logic in `src/features/recommendations/engine/`
- Vendor-compatible place model in `src/types/place.ts`
- Local Adelaide data in `src/mocks/`

Keep screens, domain logic and data separate. Prefer small readable functions over clever abstractions. Do not add a global state library until persisted cross-screen data genuinely requires it.

## Key commands

Use npm only:

```bash
npm install
npm run typecheck
npm run lint
npx expo start
npx expo start --tunnel
```

Do not commit yarn, pnpm or bun lockfiles. Do not generate `ios/` or `android/` folders for the Expo Go MVP.

## Build discipline

For each meaningful change: build, type-check, run, test, fix, and confirm working before moving to the next major feature. Never knowingly leave the working app broken.

Test the founder journey after navigation or recommendation changes:

```text
splash → welcome/onboarding → Do → mode → SPONSAY ME
→ one recommendation → replacement or I’M IN → action
```

## Design rules

- **Option 1A is the selected interface direction.** Keep the Do screen minimal, calm and decision-first.
- Location Blue `#5BA7FF` is the primary brand and navigation colour.
- Warm Cream `#FFF6E6` is the soft supporting surface.
- Ink `#1F1F23` is primary text.
- Action Coral `#FF6B57` is reserved for primary action moments such as **SPONSAY ME ✦** and **I’M IN**.
- Mist `#E6E9EE` is the neutral border and control colour.
- Use the blue location-star plus coral accent treatment in `BrandMark` until an approved production vector is supplied.
- The Do screen must not become map-first. Maps belong primarily in Around Me and should support decisions rather than replace them.
- Show one recommendation at a time. Never expose a numeric match score.
- **I’M IN** is the primary acceptance action; **Not this one** is secondary.
- Keep screens warm, clear, confident and uncluttered.
- Maintain accessible labels, contrast and touch targets.

Do not scatter hard-coded design values through screens. Extend the theme tokens when a repeatable visual value is needed.

## Recommendation rules

1. Apply hard filters first: open, valid coordinates, distance, time, budget and rejected-place exclusion.
2. Score eligible candidates with centrally defined weights.
3. Select from a mode-sized top pool using weighted randomness.
4. Safe narrows uncertainty; Spontaneous balances fit and novelty; Chaos increases novelty without violating constraints.
5. Never return the same rejected place in the current session.
6. Limit easy replacements to `MAX_REPLACEMENTS_PER_SESSION`.
7. Explain the choice concisely with deterministic copy; do not call AI for simple sentences.

## Security

Never commit secrets, passwords, auth tokens or private keys. Never use the Supabase service-role key, OpenAI key or unrestricted Google server key in the mobile client. Only mobile-safe values may use the `EXPO_PUBLIC_` prefix. Keep `.env` ignored.

Supabase Auth will own future identities. Future user tables must reference `auth.users.id`, use UUIDs and enable Row Level Security.

## Task 3 Supabase rules

- Supabase Auth owns user identity.
- Public user tables reference `auth.users.id`.
- Row Level Security is mandatory on every user-data table.
- The mobile client uses the publishable key only.
- The service-role key is server-only and must never enter Expo code or client environment files.
- Demo mode must remain operational without Supabase.
- Never weaken RLS for debugging.
- Do not add OpenAI or Google Places yet.
- Do not persist demo recommendations until connection verification is explicitly authorized.

## Prohibited scope expansion

Do not add social feeds, messaging, followers, influencer profiles, bookings, turn-by-turn navigation, cryptocurrency, points, business portals, large subscriptions or complicated agent infrastructure. Document any genuinely necessary architecture decision in `docs/architecture.md`.
