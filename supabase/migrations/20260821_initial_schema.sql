-- SponSays Task 3A: secure account and recommendation-data foundation.
-- All user-data tables use Row Level Security; the mobile publishable key alone
-- never grants access to another user's rows.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  home_city text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interests text[] not null default '{}'::text[],
  dietary_preferences text[] not null default '{}'::text[],
  default_budget text,
  default_distance_km numeric,
  default_social_context text,
  default_spontaneity_mode text not null default 'spontaneous',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_spontaneity_mode_check
    check (default_spontaneity_mode in ('safe', 'spontaneous', 'chaos'))
);

create table if not exists public.recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  mood text,
  social_context text,
  budget text,
  available_minutes integer,
  radius_km numeric,
  spontaneity_mode text not null default 'spontaneous',
  created_at timestamptz not null default now(),
  constraint recommendation_sessions_spontaneity_mode_check
    check (spontaneity_mode in ('safe', 'spontaneous', 'chaos'))
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.recommendation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_place_id text,
  source text,
  place_name text not null,
  category text,
  latitude double precision,
  longitude double precision,
  estimated_distance_km numeric,
  estimated_duration_minutes integer,
  price_level integer,
  score numeric,
  recommendation_reason text,
  rank_position integer,
  accepted boolean not null default false,
  rejected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  positive boolean not null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_place_id text not null,
  place_name text not null,
  created_at timestamptz not null default now(),
  constraint favourites_user_place_unique unique (user_id, external_place_id)
);

create index if not exists recommendation_sessions_user_created_idx
  on public.recommendation_sessions (user_id, created_at desc);
create index if not exists recommendations_user_created_idx
  on public.recommendations (user_id, created_at desc);
create index if not exists recommendations_session_idx
  on public.recommendations (session_id);
create index if not exists recommendation_feedback_user_created_idx
  on public.recommendation_feedback (user_id, created_at desc);
create index if not exists recommendation_feedback_recommendation_idx
  on public.recommendation_feedback (recommendation_id);
create index if not exists favourites_user_created_idx
  on public.favourites (user_id, created_at desc);

-- Keep mutable account records' audit timestamps accurate.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

-- Auth writes occur in the auth schema, so this minimal security-definer function
-- is required to create the matching public profile. Its empty search path and
-- fully qualified table reference prevent object-shadowing attacks.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.recommendation_sessions enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.favourites enable row level security;

-- Profiles: a signed-in user may access only the profile whose id is their own.
drop policy if exists "Users can select own profile" on public.profiles;
create policy "Users can select own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

-- Preferences: ownership is tied directly to the authenticated identity.
drop policy if exists "Users can select own preferences" on public.user_preferences;
create policy "Users can select own preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own preferences" on public.user_preferences;
create policy "Users can delete own preferences"
on public.user_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

-- Recommendation sessions: only the owning signed-in user can access a session.
drop policy if exists "Users can select own recommendation sessions" on public.recommendation_sessions;
create policy "Users can select own recommendation sessions"
on public.recommendation_sessions for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own recommendation sessions" on public.recommendation_sessions;
create policy "Users can insert own recommendation sessions"
on public.recommendation_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own recommendation sessions" on public.recommendation_sessions;
create policy "Users can update own recommendation sessions"
on public.recommendation_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own recommendation sessions" on public.recommendation_sessions;
create policy "Users can delete own recommendation sessions"
on public.recommendation_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

-- Recommendations: the row must belong to the user and, when present, its
-- parent session must belong to that same authenticated user.
drop policy if exists "Users can select own recommendations" on public.recommendations;
create policy "Users can select own recommendations"
on public.recommendations for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own recommendations" on public.recommendations;
create policy "Users can insert own recommendations"
on public.recommendations for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    session_id is null
    or exists (
      select 1
      from public.recommendation_sessions as owned_session
      where owned_session.id = recommendations.session_id
        and owned_session.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users can update own recommendations" on public.recommendations;
create policy "Users can update own recommendations"
on public.recommendations for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    session_id is null
    or exists (
      select 1
      from public.recommendation_sessions as owned_session
      where owned_session.id = recommendations.session_id
        and owned_session.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users can delete own recommendations" on public.recommendations;
create policy "Users can delete own recommendations"
on public.recommendations for delete to authenticated
using ((select auth.uid()) = user_id);

-- Feedback: both its user_id and referenced recommendation must be owned by the
-- current user. This blocks feedback from being attached to someone else's row.
drop policy if exists "Users can select own recommendation feedback" on public.recommendation_feedback;
create policy "Users can select own recommendation feedback"
on public.recommendation_feedback for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own recommendation feedback" on public.recommendation_feedback;
create policy "Users can insert own recommendation feedback"
on public.recommendation_feedback for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.recommendations as owned_recommendation
    where owned_recommendation.id = recommendation_feedback.recommendation_id
      and owned_recommendation.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own recommendation feedback" on public.recommendation_feedback;
create policy "Users can update own recommendation feedback"
on public.recommendation_feedback for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.recommendations as owned_recommendation
    where owned_recommendation.id = recommendation_feedback.recommendation_id
      and owned_recommendation.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete own recommendation feedback" on public.recommendation_feedback;
create policy "Users can delete own recommendation feedback"
on public.recommendation_feedback for delete to authenticated
using ((select auth.uid()) = user_id);

-- Favourites: ownership is tied directly to the authenticated identity.
drop policy if exists "Users can select own favourites" on public.favourites;
create policy "Users can select own favourites"
on public.favourites for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own favourites" on public.favourites;
create policy "Users can insert own favourites"
on public.favourites for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own favourites" on public.favourites;
create policy "Users can update own favourites"
on public.favourites for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own favourites" on public.favourites;
create policy "Users can delete own favourites"
on public.favourites for delete to authenticated
using ((select auth.uid()) = user_id);
