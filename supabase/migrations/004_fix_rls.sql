-- ============================================================
-- 004_fix_rls.sql — ลบแถวซ้ำ + เพิ่ม Unique Constraint + เพิ่มสิทธิ์ RLS
-- รันใน Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. ลบแถวซ้ำใน shelters (เก็บแถวแรกไว้)
delete from public.shelters a
using public.shelters b
where a.profile_id = b.profile_id
  and a.ctid < b.ctid;

-- 2. ลบแถวซ้ำใน employers (เก็บแถวแรกไว้)
delete from public.employers a
using public.employers b
where a.profile_id = b.profile_id
  and a.ctid < b.ctid;

-- 3. เพิ่ม Unique Constraint ป้องกันการสร้างซ้ำในอนาคต
alter table public.shelters drop constraint if exists shelters_profile_id_key;
alter table public.shelters add constraint shelters_profile_id_key unique (profile_id);

alter table public.employers drop constraint if exists employers_profile_id_key;
alter table public.employers add constraint employers_profile_id_key unique (profile_id);

-- 4. สิทธิ์ RLS สำหรับ Shelters
drop policy if exists "Users can insert own shelter" on public.shelters;
create policy "Users can insert own shelter" on public.shelters
  for insert to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update own shelter" on public.shelters;
create policy "Users can update own shelter" on public.shelters
  for update to authenticated
  using (auth.uid() = profile_id);

-- 5. สิทธิ์ RLS สำหรับ Employers
drop policy if exists "Users can insert own employer" on public.employers;
create policy "Users can insert own employer" on public.employers
  for insert to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update own employer" on public.employers;
create policy "Users can update own employer" on public.employers
  for update to authenticated
  using (auth.uid() = profile_id);
