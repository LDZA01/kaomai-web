-- Shared case managers and optional resident assignments.

create table if not exists public.case_managers (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_managers_shelter_id_idx
  on public.case_managers (shelter_id);

alter table public.homeless_profiles
  add column if not exists case_manager_id uuid
  references public.case_managers(id) on delete set null;

create index if not exists homeless_profiles_case_manager_id_idx
  on public.homeless_profiles (case_manager_id);

create or replace function public.ensure_case_manager_matches_resident_shelter()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.case_manager_id is not null and not exists (
    select 1
    from public.case_managers manager
    where manager.id = new.case_manager_id
      and manager.shelter_id = new.shelter_id
  ) then
    raise exception 'Case manager must belong to the resident shelter';
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_case_manager_matches_resident_shelter
  on public.homeless_profiles;
create trigger ensure_case_manager_matches_resident_shelter
  before insert or update of case_manager_id, shelter_id
  on public.homeless_profiles
  for each row execute function public.ensure_case_manager_matches_resident_shelter();

create or replace function public.set_case_manager_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_case_manager_updated_at on public.case_managers;
create trigger set_case_manager_updated_at
  before update on public.case_managers
  for each row execute function public.set_case_manager_updated_at();

alter table public.case_managers enable row level security;

drop policy if exists "Shelters can read own case managers" on public.case_managers;
create policy "Shelters can read own case managers"
  on public.case_managers
  for select to authenticated
  using (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = case_managers.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Employers can read assigned case managers" on public.case_managers;
create policy "Employers can read assigned case managers"
  on public.case_managers
  for select to authenticated
  using (
    exists (
      select 1 from public.homeless_profiles resident
      where resident.case_manager_id = case_managers.id
        and resident.work_availability = true
    )
  );

drop policy if exists "Shelters can create own case managers" on public.case_managers;
create policy "Shelters can create own case managers"
  on public.case_managers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = case_managers.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can update own case managers" on public.case_managers;
create policy "Shelters can update own case managers"
  on public.case_managers
  for update to authenticated
  using (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = case_managers.shelter_id
        and shelter.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = case_managers.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can delete own case managers" on public.case_managers;
create policy "Shelters can delete own case managers"
  on public.case_managers
  for delete to authenticated
  using (
    exists (
      select 1 from public.shelters shelter
      where shelter.id = case_managers.shelter_id
        and shelter.profile_id = auth.uid()
    )
  );
