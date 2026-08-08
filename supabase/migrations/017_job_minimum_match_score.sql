-- Per-job candidate compatibility threshold.
-- Existing jobs use the recommended 50% threshold.

alter table public.jobs
  add column if not exists minimum_match_score integer not null default 50;

alter table public.jobs
  drop constraint if exists jobs_minimum_match_score_check;

alter table public.jobs
  add constraint jobs_minimum_match_score_check
  check (minimum_match_score in (0, 25, 50, 75));
