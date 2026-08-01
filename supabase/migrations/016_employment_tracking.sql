-- Shelter-only employment tracking and follow-up history.

create table if not exists public.employment_trackings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.job_matches(id) on delete restrict,
  resident_id uuid not null references public.homeless_profiles(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  case_manager_id uuid references public.case_managers(id) on delete set null,
  started_at date not null,
  cadence text not null default 'fortnightly'
    check (cadence in ('fortnightly', 'monthly')),
  next_follow_up_at date not null,
  support_state text not null default 'good'
    check (support_state in ('good', 'needs_support', 'urgent')),
  status text not null default 'active'
    check (status in ('active', 'ended')),
  ended_at date,
  end_reason text
    check (
      end_reason is null
      or end_reason in (
        'contract_completed',
        'resigned',
        'employer_ended',
        'health_or_personal',
        'lost_contact',
        'other'
      )
    ),
  final_note text,
  return_to_matching boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'active' and ended_at is null and end_reason is null)
    or
    (
      status = 'ended'
      and ended_at is not null
      and end_reason is not null
      and length(trim(final_note)) > 0
    )
  )
);

create table if not exists public.employment_check_ins (
  id uuid primary key default gen_random_uuid(),
  employment_tracking_id uuid not null
    references public.employment_trackings(id) on delete cascade,
  check_in_date date not null,
  attendance text not null
    check (attendance in ('normal', 'absent', 'late')),
  adjustment text not null
    check (adjustment in ('good', 'needs_support', 'urgent')),
  participant_feedback text,
  employer_feedback text,
  private_note text,
  next_follow_up_at date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists employment_trackings_shelter_status_idx
  on public.employment_trackings (shelter_id, status);
create index if not exists employment_trackings_next_follow_up_idx
  on public.employment_trackings (next_follow_up_at)
  where status = 'active';
create index if not exists employment_check_ins_tracking_date_idx
  on public.employment_check_ins (employment_tracking_id, check_in_date desc);

create or replace function public.validate_employment_tracking_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.job_matches match
    join public.homeless_profiles resident
      on resident.id = match.homeless_profile_id
    where match.id = new.match_id
      and match.homeless_profile_id = new.resident_id
      and match.job_id = new.job_id
      and resident.shelter_id = new.shelter_id
      and match.match_status = 'shelter_approved'
  ) then
    raise exception 'Employment tracking must reference an approved match in this shelter';
  end if;

  if new.case_manager_id is not null and not exists (
    select 1 from public.case_managers manager
    where manager.id = new.case_manager_id
      and manager.shelter_id = new.shelter_id
  ) then
    raise exception 'Case manager must belong to the tracking shelter';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_employment_tracking_scope
  on public.employment_trackings;
create trigger validate_employment_tracking_scope
  before insert or update of match_id, resident_id, job_id, shelter_id, case_manager_id
  on public.employment_trackings
  for each row execute function public.validate_employment_tracking_scope();

create or replace function public.update_employment_tracking_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_employment_tracking_timestamp
  on public.employment_trackings;
create trigger update_employment_tracking_timestamp
  before update on public.employment_trackings
  for each row execute function public.update_employment_tracking_timestamp();

alter table public.employment_trackings enable row level security;
alter table public.employment_check_ins enable row level security;

drop policy if exists "Shelters manage own employment trackings" on public.employment_trackings;
drop policy if exists "Shelters read own employment trackings" on public.employment_trackings;
drop policy if exists "Shelters create own employment trackings" on public.employment_trackings;
drop policy if exists "Shelters update own employment trackings" on public.employment_trackings;

create policy "Shelters read own employment trackings"
  on public.employment_trackings
  for select to authenticated
  using (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = employment_trackings.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

create policy "Shelters create own employment trackings"
  on public.employment_trackings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = employment_trackings.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

create policy "Shelters update own employment trackings"
  on public.employment_trackings
  for update to authenticated
  using (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = employment_trackings.shelter_id
        and shelter.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = employment_trackings.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters manage own employment check ins" on public.employment_check_ins;
drop policy if exists "Shelters read own employment check ins" on public.employment_check_ins;
drop policy if exists "Shelters create own employment check ins" on public.employment_check_ins;

create policy "Shelters read own employment check ins"
  on public.employment_check_ins
  for select to authenticated
  using (
    exists (
      select 1
      from public.employment_trackings tracking
      join public.shelters shelter on shelter.id = tracking.shelter_id
      where tracking.id = employment_check_ins.employment_tracking_id
        and shelter.profile_id = auth.uid()
    )
  );

create policy "Shelters create own employment check ins"
  on public.employment_check_ins
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.employment_trackings tracking
      join public.shelters shelter on shelter.id = tracking.shelter_id
      where tracking.id = employment_check_ins.employment_tracking_id
        and shelter.profile_id = auth.uid()
    )
  );
