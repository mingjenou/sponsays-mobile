-- One signed-in user can leave one feedback record per recommendation. The
-- application upserts against this key so changing an answer updates the row.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recommendation_feedback_user_recommendation_unique'
      and conrelid = 'public.recommendation_feedback'::regclass
  ) then
    alter table public.recommendation_feedback
      add constraint recommendation_feedback_user_recommendation_unique
      unique (user_id, recommendation_id);
  end if;
end
$$;
