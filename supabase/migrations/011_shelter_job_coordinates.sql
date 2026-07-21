alter table public.shelters
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.jobs
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

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
