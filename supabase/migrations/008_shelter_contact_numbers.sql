alter table public.shelters
  add column if not exists phone text,
  add column if not exists emergency_phone text;

comment on column public.shelters.phone is 'General information and coordination telephone number.';
comment on column public.shelters.emergency_phone is 'Emergency or urgent support telephone number.';
