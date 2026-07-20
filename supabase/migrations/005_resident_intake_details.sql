-- Structured participant intake details used for employment support.
-- Store only document status, never a national ID number.
alter table public.homeless_profiles
  add column if not exists has_id_card boolean,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists available_from time,
  add column if not exists available_to time;

comment on column public.homeless_profiles.has_id_card is
  'Whether the participant currently has a usable ID card; no ID number is stored.';
