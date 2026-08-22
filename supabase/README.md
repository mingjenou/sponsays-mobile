# SponSays Supabase foundation

Supabase will provide two things for SponSays: signed-in user accounts through Supabase Auth, and a Postgres database for account-owned data. The current Adelaide demo remains local and works without Supabase.

## Row Level Security

**Row Level Security (RLS)** means database rules that determine which rows each signed-in user is allowed to access.

RLS is enabled on every user-data table in the initial migration. The policies compare each row's owner with the signed-in Supabase user. Recommendations and feedback also verify that their related session or recommendation belongs to that same user. The publishable key can therefore be used by the mobile app without granting access to every user's data.

## Migrations

The files in `migrations/` are ordered database changes. `20260821_initial_schema.sql` creates the first six tables, indexes, triggers, and their security policies. The Task 3C migrations mirror the live legacy-policy cleanup and add one-feedback-per-recommendation uniqueness. Do not edit an already-applied migration; add a new timestamped migration for later changes.

**LIVE MIGRATION REQUIRED BEFORE AUTHENTICATED FEEDBACK TEST:** `20260822_unique_recommendation_feedback.sql`

Keep this release gate explicit until the migration has actually been applied to the target Supabase project. The app upserts feedback with `onConflict: 'user_id,recommendation_id'`; do not mark the migration as deployed based only on the repository file.

When a Supabase project is eventually connected, a developer can apply migrations using the Supabase CLI after reviewing the target project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The founder does not need to run these commands for the current demo. A developer should confirm the project reference and inspect the migration before applying it.

## Mobile credentials

The Expo app may receive only a Supabase project URL and publishable key through `EXPO_PUBLIC_` variables. A service-role key bypasses RLS and must remain server-only. It must never be placed in this repository, an `.env` used by Expo, or any mobile application code.

`user_preferences.default_spontaneity_mode` and historical session values remain in the schema for backward compatibility. Task 4A does not expose or update a behaviour level in the UI, and it does not destructively migrate legacy rows.

## Regenerating database types

After every deployed schema change, regenerate `src/services/supabase/database.types.ts` from the live schema and review the diff:

```bash
npx supabase login
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > src/services/supabase/database.types.ts
```

`PROJECT_REF` is the project identifier from the Supabase dashboard URL. A personal access token belongs in the developer's local Supabase CLI session, never in the repository or Expo environment.

## Security Advisor

After applying migrations, review the Supabase Database Security Advisor. It should remain clean. Fix legitimate findings at the schema or policy level; never silence an advisor by disabling or weakening RLS.
