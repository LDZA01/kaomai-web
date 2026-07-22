-- Full schema update to support all resident details, ID card workflow, shelter phones, and match approval workflow.

-- 1. Add all extended columns & constraints to homeless_profiles
alter table public.homeless_profiles
  add column if not exists gender text,
  add column if not exists has_id_card boolean,
  add column if not exists id_card_status text,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists available_from time,
  add column if not exists available_to time;

alter table public.homeless_profiles
  drop constraint if exists homeless_profiles_gender_check;

alter table public.homeless_profiles
  add constraint homeless_profiles_gender_check
  check (gender is null or gender in (
    'male',
    'female',
    'non_binary',
    'other',
    'prefer_not_to_say'
  ));

alter table public.homeless_profiles
  drop constraint if exists homeless_profiles_id_card_status_check;

alter table public.homeless_profiles
  add constraint homeless_profiles_id_card_status_check
  check (id_card_status is null or id_card_status in (
    'has_card',
    'in_progress',
    'needs_support',
    'not_started'
  ));

-- 2. Add phone columns to shelters
alter table public.shelters
  add column if not exists phone text,
  add column if not exists emergency_phone text;

-- 3. Update job_matches match_status check constraint and timestamps
alter table public.job_matches
  drop constraint if exists job_matches_match_status_check;

alter table public.job_matches
  add constraint job_matches_match_status_check
  check (match_status in (
    'pending',
    'hired',
    'rejected',
    'suggested',
    'worker_accepted',
    'worker_declined',
    'shelter_approved',
    'shelter_declined'
  ));

alter table public.job_matches
  add column if not exists worker_decided_at timestamptz,
  add column if not exists shelter_decided_at timestamptz;
