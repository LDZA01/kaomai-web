-- Job work type used by weighted candidate matching.
-- Nullable so existing job records remain valid until edited.

alter table public.jobs
  add column if not exists work_type text;

alter table public.jobs
  drop constraint if exists jobs_work_type_check;

alter table public.jobs
  add constraint jobs_work_type_check
  check (work_type is null or work_type in ('full_time', 'part_time'));
