create table if not exists public.planned_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  external_place_id text not null,
  provider text not null,
  place_name text not null,
  description text,
  source_url text,
  address text,
  latitude double precision,
  longitude double precision,
  category text,
  planned_for timestamptz not null,
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  calendar_event_id text,
  notification_id text,
  reminder_offset_minutes integer check (reminder_offset_minutes in (30, 60, 120, 1440)),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planned_experiences_user_status_time_idx
  on public.planned_experiences (user_id, status, planned_for);

alter table public.planned_experiences enable row level security;

drop policy if exists "planned experiences are privately readable" on public.planned_experiences;
create policy "planned experiences are privately readable" on public.planned_experiences
  for select using (auth.uid() = user_id);
drop policy if exists "planned experiences are privately insertable" on public.planned_experiences;
create policy "planned experiences are privately insertable" on public.planned_experiences
  for insert with check (auth.uid() = user_id);
drop policy if exists "planned experiences are privately updatable" on public.planned_experiences;
create policy "planned experiences are privately updatable" on public.planned_experiences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "planned experiences are privately deletable" on public.planned_experiences;
create policy "planned experiences are privately deletable" on public.planned_experiences
  for delete using (auth.uid() = user_id);

drop trigger if exists set_planned_experiences_updated_at on public.planned_experiences;
create trigger set_planned_experiences_updated_at before update on public.planned_experiences
for each row execute function public.set_updated_at();
