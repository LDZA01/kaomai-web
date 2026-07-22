-- Employer suggestion -> participant decision (recorded by shelter) -> shelter approval.
alter table public.job_matches
  drop constraint if exists job_matches_match_status_check;

update public.job_matches set match_status = case
  when match_status = 'pending' then 'suggested'
  when match_status = 'hired' then 'shelter_approved'
  when match_status = 'rejected' then 'worker_declined'
  else match_status
end;

alter table public.job_matches
  alter column match_status set default 'suggested';

alter table public.job_matches
  add constraint job_matches_match_status_check
  check (match_status in (
    'suggested',
    'worker_accepted',
    'worker_declined',
    'shelter_approved',
    'shelter_declined'
  ));

alter table public.job_matches
  add column if not exists worker_decided_at timestamptz,
  add column if not exists shelter_decided_at timestamptz;
