'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { LocationFields } from '@/components/ui/LocationFields';
import { parseOptionalCoordinates } from '@/lib/location-validation';

export function AccountPage({ mode }: { mode: 'profile' | 'settings' }) {
  const { user, org, updateProfile } = useAuthContext();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const organization = user?.role === 'shelter' ? org.shelter?.name : org.employer?.businessName;
  const organizationId = user?.role === 'shelter' ? org.shelter?.id : org.employer?.id;
  const phone = user?.role === 'shelter' ? org.shelter?.phone : org.employer?.phone;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    const data = new FormData(event.currentTarget);
    let coordinates;
    try {
      coordinates = user?.role === 'shelter' ? parseOptionalCoordinates(data.get('latitude'), data.get('longitude')) : undefined;
    } catch (coordinateError) {
      setSaving(false);
      setError(coordinateError instanceof Error ? coordinateError.message : 'พิกัดไม่ถูกต้อง');
      return;
    }
    const result = await updateProfile({
      displayName: String(data.get('displayName') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      organization: String(data.get('organization') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      address: String(data.get('address') ?? '').trim(),
      ...coordinates,
    });
    setSaving(false);
    if (result.error) setError(result.error.message);
    else setSaved(true);
  }

  if (mode === 'profile') return (
    <div className="page-enter mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-opportunity-100 text-2xl font-extrabold text-brand-700">{user?.displayName?.[0]}</span>
        <div><h1 className="text-3xl font-extrabold text-slate-950">โปรไฟล์ของคุณ</h1><p className="mt-1 text-slate-600">ตรวจสอบและแก้ไขข้อมูลที่ใช้ในพื้นที่ทำงาน</p></div>
      </div>
      {saved && <p role="status" className="mt-6 flex items-center gap-2 rounded-[12px] bg-hope-50 p-4 font-semibold text-hope-700"><CheckCircle2 size={19}/>บันทึกข้อมูลเรียบร้อยแล้ว</p>}
      {error && <p role="alert" className="mt-6 rounded-[12px] bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-7 grid gap-5 rounded-[16px] bg-white p-6 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><UserRound className="text-brand-600"/><div><h2 className="font-bold text-slate-950">ข้อมูลส่วนตัว</h2><p className="text-sm text-slate-500">ข้อมูลนี้แสดงเฉพาะกับทีมในองค์กรของคุณ</p></div></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="accountId" label="รหัสบัญชี" defaultValue={user?.id} disabled />
          <Field name="organizationId" label="รหัสองค์กร" defaultValue={organizationId ?? '—'} disabled />
        </div>
        <p className="-mt-2 text-sm text-slate-500">รหัสถูกกำหนดโดยระบบและไม่สามารถแก้ไขได้</p>
        <Field name="displayName" label="ชื่อที่ใช้แสดง" defaultValue={user?.displayName} required />
        <Field name="email" label="อีเมล" type="email" defaultValue={user?.email} required />
        <Field name="organization" label="องค์กร" defaultValue={organization ?? ''} required />
        <Field name="phone" label="เบอร์ติดต่อ" type="tel" inputMode="tel" autoComplete="tel" defaultValue={phone ?? ''} placeholder="เช่น 02-354-3388 หรือ 081-234-5678" hint="ใช้สำหรับการประสานงานเกี่ยวกับผู้สมัครและตำแหน่งงาน" required />
        {user?.role === 'shelter' && <LocationFields addressName="address" addressLabel="ตำแหน่งศูนย์พักพิง" defaultAddress={org.shelter?.address} defaultLatitude={org.shelter?.latitude} defaultLongitude={org.shelter?.longitude}/>} 
        {user?.role === 'employer' && <div><Field name="address" label="ที่อยู่องค์กร" defaultValue={org.employer?.address ?? ''} placeholder="เลขที่ ถนน เขต/อำเภอ จังหวัด รหัสไปรษณีย์" required/><p className="mt-2 text-sm text-slate-500">ที่อยู่นี้เป็นข้อมูลสำนักงาน ส่วนการคำนวณระยะทางจะใช้สถานที่ทำงานในแต่ละประกาศ</p></div>}
        <div className="flex justify-end"><Button type="submit" disabled={saving}><Save size={18}/>{saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}</Button></div>
      </form>
    </div>
  );

  return <div className="page-enter mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold text-slate-950">การตั้งค่า</h1><p className="mt-2 text-slate-600">จัดการการแจ้งเตือน ความเป็นส่วนตัว และประสบการณ์การใช้งาน</p><div className="mt-7 overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]"><section className="flex items-center justify-between gap-5 border-b border-slate-100 p-6"><div className="flex gap-3"><Bell className="mt-1 shrink-0 text-brand-600"/><div><h2 className="font-bold text-slate-950">การแจ้งเตือนงานสำคัญ</h2><p className="mt-1 text-sm text-slate-600">รับการแจ้งเตือนเมื่อมีรายการที่ต้องตรวจสอบ</p></div></div><div className="flex shrink-0 items-center gap-3"><span className={`hidden text-sm font-semibold sm:inline ${notifications ? 'text-brand-700' : 'text-slate-500'}`}>{notifications ? 'เปิด' : 'ปิด'}</span><button type="button" role="switch" aria-label="การแจ้งเตือนงานสำคัญ" aria-checked={notifications} onClick={() => setNotifications(!notifications)} className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${notifications ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-slate-300'}`}><span aria-hidden="true" className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`}/></button></div></section><section className="flex gap-3 p-6"><ShieldCheck className="mt-1 shrink-0 text-opportunity-700"/><div><h2 className="font-bold text-slate-950">ความเป็นส่วนตัวและความปลอดภัย</h2><p className="mt-1 text-sm text-slate-600">ระบบจะแสดงข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการประสานงานเท่านั้น</p></div></section></div></div>;
}
