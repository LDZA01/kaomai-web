alter table public.homeless_profiles
  add column if not exists gender text;

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

comment on column public.homeless_profiles.gender is
  'Optional self-identified gender, including a prefer-not-to-say choice.';
