alter table public.homeless_profiles
  add column if not exists id_card_status text;

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

update public.homeless_profiles
set id_card_status = case
  when has_id_card is true then 'has_card'
  when has_id_card is false then 'not_started'
  else null
end
where id_card_status is null;
