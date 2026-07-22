alter table public.employers
  add column if not exists address text;

comment on column public.employers.address is
  'Employer office address. Job coordinates remain the source for distance calculation.';
