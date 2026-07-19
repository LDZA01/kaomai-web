-- ============================================================
-- SEED v2: อัปเดตรหัสผ่าน + ยืนยันบัญชี + สร้าง org records
-- รันใน Supabase Dashboard → SQL Editor
-- รหัสผ่านทั้งคู่: password
-- ============================================================

do $$
declare
  shelter_uid  uuid;
  employer_uid uuid;
begin

  -- ─── ดึง user IDs ที่มีอยู่แล้ว ──────────────────────────────────
  select id into shelter_uid  from auth.users where email = 'shelter.demo@kaowmai.th';
  select id into employer_uid from auth.users where email = 'employer.demo@kaowmai.th';

  -- ─── ถ้ายังไม่มีให้สร้างใหม่ ──────────────────────────────────────
  if shelter_uid is null then
    shelter_uid := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      shelter_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'shelter.demo@kaowmai.th', crypt('password', gen_salt('bf')),
      now(), '{"role":"shelter","display_name":"เจ้าหน้าที่ศูนย์ทดสอบ"}'::jsonb,
      now(), now(), '', '', '', ''
    );
  else
    -- มีอยู่แล้ว → แค่ reset password + confirm email
    update auth.users set
      encrypted_password = crypt('password', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = '{"role":"shelter","display_name":"เจ้าหน้าที่ศูนย์ทดสอบ"}'::jsonb,
      updated_at = now()
    where id = shelter_uid;
  end if;

  if employer_uid is null then
    employer_uid := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      employer_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'employer.demo@kaowmai.th', crypt('password', gen_salt('bf')),
      now(), '{"role":"employer","display_name":"ผู้จ้างงานทดสอบ"}'::jsonb,
      now(), now(), '', '', '', ''
    );
  else
    update auth.users set
      encrypted_password = crypt('password', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = '{"role":"employer","display_name":"ผู้จ้างงานทดสอบ"}'::jsonb,
      updated_at = now()
    where id = employer_uid;
  end if;

  -- ─── upsert profiles ──────────────────────────────────────────────
  insert into public.profiles (id, email, display_name, role)
  values
    (shelter_uid,  'shelter.demo@kaowmai.th',  'เจ้าหน้าที่ศูนย์ทดสอบ', 'shelter'),
    (employer_uid, 'employer.demo@kaowmai.th', 'ผู้จ้างงานทดสอบ',       'employer')
  on conflict (id) do update set
    display_name = excluded.display_name,
    role         = excluded.role;

  -- ─── upsert shelter org ───────────────────────────────────────────
  insert into public.shelters (profile_id, name, address, contact_info)
  values (shelter_uid, 'ศูนย์คนไร้บ้านก้าวใหม่ (Demo)', 'ปทุมวัน, กรุงเทพมหานคร', 'shelter.demo@kaowmai.th')
  on conflict do nothing;

  -- ─── upsert employer org ──────────────────────────────────────────
  insert into public.employers (profile_id, business_name, industry, contact_info)
  values (employer_uid, 'ครัวเขียว เคเทอริ่ง (Demo)', 'ธุรกิจอาหาร', 'employer.demo@kaowmai.th')
  on conflict do nothing;

  raise notice 'Done — shelter_uid: %, employer_uid: %', shelter_uid, employer_uid;
end $$;

-- ─── ตรวจสอบผลลัพธ์ ────────────────────────────────────────────────
select
  p.email,
  p.role,
  s.name           as shelter_name,
  e.business_name,
  u.email_confirmed_at is not null as confirmed
from public.profiles p
join auth.users u on u.id = p.id
left join public.shelters  s on s.profile_id = p.id
left join public.employers e on e.profile_id = p.id
where p.email in ('shelter.demo@kaowmai.th', 'employer.demo@kaowmai.th');
