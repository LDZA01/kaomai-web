-- Pending migration script combining 010_employer_contact_number, 011_shelter_job_coordinates, and 012_employer_address.

-- 1. Add phone and address columns to employers
alter table public.employers
  add column if not exists phone text,
  add column if not exists address text;

-- 2. Add latitude and longitude coordinates to shelters and jobs for distance calculation
alter table public.shelters
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.jobs
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- 3. Add coordinate constraints
alter table public.shelters drop constraint if exists shelters_latitude_check;
alter table public.shelters drop constraint if exists shelters_longitude_check;
alter table public.jobs drop constraint if exists jobs_latitude_check;
alter table public.jobs drop constraint if exists jobs_longitude_check;

alter table public.shelters
  add constraint shelters_latitude_check check (latitude is null or latitude between -90 and 90),
  add constraint shelters_longitude_check check (longitude is null or longitude between -180 and 180);

alter table public.jobs
  add constraint jobs_latitude_check check (latitude is null or latitude between -90 and 90),
  add constraint jobs_longitude_check check (longitude is null or longitude between -180 and 180);
