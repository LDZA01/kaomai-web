-- ============================================================
-- รัน SQL นี้ใน Supabase Dashboard → SQL Editor → New query
-- กด Run ครั้งเดียว จบทุกอย่าง
-- ============================================================

-- 1) Profile trigger: auto-create profile เมื่อ user สมัครสมาชิก
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'shelter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) updated_at trigger สำหรับ homeless_profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_homeless_profiles_updated_at on public.homeless_profiles;
create trigger set_homeless_profiles_updated_at
  before update on public.homeless_profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_job_matches_updated_at on public.job_matches;
create trigger set_job_matches_updated_at
  before update on public.job_matches
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- เสร็จแล้ว! ลอง Register บัญชีใหม่ในเว็บได้เลย
-- ============================================================
