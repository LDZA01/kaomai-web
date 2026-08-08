-- Backfill jobs created before the recommended threshold changed from 0% to 50%.

alter table public.jobs
  alter column minimum_match_score set default 50;

update public.jobs
set minimum_match_score = 50
where minimum_match_score = 0;
