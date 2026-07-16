create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('shelter', 'employer')),
  created_at timestamptz not null default now()
);

create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  address text not null,
  contact_info text,
  created_at timestamptz not null default now()
);

create table public.employers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  business_name text not null,
  industry text,
  contact_info text,
  created_at timestamptz not null default now()
);

create table public.homeless_profiles (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  name text not null,
  age integer check (age >= 16),
  skills text[] not null default '{}',
  photo_url text,
  work_availability boolean not null default true,
  availability text not null default 'Full-time',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  title text not null,
  job_description text not null,
  required_skills text[] not null default '{}',
  location text not null,
  daily_wage numeric(10, 2) not null check (daily_wage > 0),
  status text not null default 'open' check (status in ('draft', 'open', 'filled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  homeless_profile_id uuid not null references public.homeless_profiles(id) on delete cascade,
  match_status text not null default 'pending' check (match_status in ('pending', 'hired', 'rejected')),
  score integer not null default 0 check (score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, homeless_profile_id)
);

create index homeless_profiles_skills_idx on public.homeless_profiles using gin (skills);
create index jobs_required_skills_idx on public.jobs using gin (required_skills);
create index job_matches_job_id_idx on public.job_matches (job_id);
create index job_matches_profile_id_idx on public.job_matches (homeless_profile_id);

create or replace function public.match_score(candidate_skills text[], required_skills text[])
returns integer
language sql
immutable
as $$
  select case
    when coalesce(array_length(required_skills, 1), 0) = 0 then 0
    else round(
      (
        select count(*)
        from unnest(required_skills) required(skill)
        where lower(required.skill) = any (select lower(candidate.skill) from unnest(candidate_skills) candidate(skill))
      )::numeric / array_length(required_skills, 1) * 100
    )::integer
  end;
$$;

alter table public.profiles enable row level security;
alter table public.shelters enable row level security;
alter table public.employers enable row level security;
alter table public.homeless_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;

create policy "Users can read profiles" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Authenticated users can read shelters" on public.shelters for select to authenticated using (true);
create policy "Authenticated users can read employers" on public.employers for select to authenticated using (true);
create policy "Authenticated users can read residents" on public.homeless_profiles for select to authenticated using (true);
create policy "Authenticated users can read jobs" on public.jobs for select to authenticated using (true);
create policy "Authenticated users can read matches" on public.job_matches for select to authenticated using (true);

create policy "Shelter profiles can manage residents" on public.homeless_profiles
  for all to authenticated
  using (
    exists (
      select 1 from public.shelters
      where shelters.id = homeless_profiles.shelter_id
      and shelters.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shelters
      where shelters.id = homeless_profiles.shelter_id
      and shelters.profile_id = auth.uid()
    )
  );

create policy "Employer profiles can manage jobs" on public.jobs
  for all to authenticated
  using (
    exists (
      select 1 from public.employers
      where employers.id = jobs.employer_id
      and employers.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.employers
      where employers.id = jobs.employer_id
      and employers.profile_id = auth.uid()
    )
  );

create policy "Employers and shelters can manage matches" on public.job_matches
  for all to authenticated
  using (true)
  with check (true);
