-- Resident intake preferences, private medical notes, and supporting documents.

alter table public.homeless_profiles
  add column if not exists chronic_conditions text,
  add column if not exists preferred_work_type text,
  add column if not exists payment_preference text;

alter table public.homeless_profiles
  drop constraint if exists homeless_profiles_preferred_work_type_check;

alter table public.homeless_profiles
  add constraint homeless_profiles_preferred_work_type_check
  check (
    preferred_work_type is null
    or preferred_work_type in ('full_time', 'part_time')
  );

alter table public.homeless_profiles
  drop constraint if exists homeless_profiles_payment_preference_check;

alter table public.homeless_profiles
  add constraint homeless_profiles_payment_preference_check
  check (
    payment_preference is null
    or payment_preference in ('cash', 'bank_transfer')
  );

create table if not exists public.resident_documents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.homeless_profiles(id) on delete cascade,
  category text not null check (category in ('education', 'training', 'employment', 'other')),
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);

create index if not exists resident_documents_resident_id_idx
  on public.resident_documents (resident_id);

alter table public.resident_documents enable row level security;

drop policy if exists "Shelters can read own resident documents" on public.resident_documents;
create policy "Shelters can read own resident documents"
  on public.resident_documents
  for select to authenticated
  using (
    exists (
      select 1
      from public.homeless_profiles resident
      join public.shelters shelter on shelter.id = resident.shelter_id
      where resident.id = resident_documents.resident_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can insert own resident documents" on public.resident_documents;
create policy "Shelters can insert own resident documents"
  on public.resident_documents
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.homeless_profiles resident
      join public.shelters shelter on shelter.id = resident.shelter_id
      where resident.id = resident_documents.resident_id
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can delete own resident documents" on public.resident_documents;
create policy "Shelters can delete own resident documents"
  on public.resident_documents
  for delete to authenticated
  using (
    exists (
      select 1
      from public.homeless_profiles resident
      join public.shelters shelter on shelter.id = resident.shelter_id
      where resident.id = resident_documents.resident_id
        and shelter.profile_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resident-documents',
  'resident-documents',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Shelters can upload own resident files" on storage.objects;
create policy "Shelters can upload own resident files"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resident-documents'
    and exists (
      select 1
      from public.shelters shelter
      where shelter.id::text = (storage.foldername(name))[1]
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can read own resident files" on storage.objects;
create policy "Shelters can read own resident files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resident-documents'
    and exists (
      select 1
      from public.shelters shelter
      where shelter.id::text = (storage.foldername(name))[1]
        and shelter.profile_id = auth.uid()
    )
  );

drop policy if exists "Shelters can delete own resident files" on storage.objects;
create policy "Shelters can delete own resident files"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resident-documents'
    and exists (
      select 1
      from public.shelters shelter
      where shelter.id::text = (storage.foldername(name))[1]
        and shelter.profile_id = auth.uid()
    )
  );
