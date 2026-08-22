-- Keep repository migration history aligned with the cleanup already applied
-- to the live project. These are legacy duplicates only; Task 3A's canonical
-- select/insert/update/delete ownership policies remain in place.

drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

drop policy if exists "Users can create their own preferences" on public.user_preferences;
drop policy if exists "Users can read their own preferences" on public.user_preferences;
drop policy if exists "Users can update their own preferences" on public.user_preferences;
drop policy if exists "Users can delete their own preferences" on public.user_preferences;
