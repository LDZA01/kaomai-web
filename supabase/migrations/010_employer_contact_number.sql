alter table public.employers
  add column if not exists phone text;

comment on column public.employers.phone is
  'General telephone number used for employment coordination.';
