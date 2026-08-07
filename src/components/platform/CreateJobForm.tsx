'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { createJob } from '@/lib/db';
import { parseOptionalCoordinates } from '@/lib/location-validation';
import { parseMinimumMatchScore } from '@/lib/employer-job-browser';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';
import { LocationFields } from '@/components/ui/LocationFields';
import type { PreferredWorkType } from '@/types';

export function CreateJobForm() {
  const { org } = useAuthContext();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    let coordinates;
    try {
      coordinates = parseOptionalCoordinates(form.get('latitude'), form.get('longitude'));
    } catch (coordinateError) {
      setError(coordinateError instanceof Error ? coordinateError.message : 'พิกัดไม่ถูกต้อง');
      return;
    }
    setBusy(true);
    try {
      await createJob({
        employerId: org.employer?.id ?? '',
        title: String(form.get('title')),
        description: String(form.get('description')),
        requiredSkills: String(form.get('skills')).split(',').map((value) => value.trim()).filter(Boolean),
        location: String(form.get('location')),
        dailyWage: Number(form.get('wage')),
        minimumMatchScore: parseMinimumMatchScore(form.get('minimumMatchScore')),
        workType: String(form.get('workType')) as PreferredWorkType,
        status: 'open',
        ...coordinates,
      });
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ไม่สามารถเผยแพร่ประกาศงานได้');
    } finally {
      setBusy(false);
    }
  }

  if (success) return <div className="mx-auto max-w-xl rounded-[12px] bg-white p-8 text-center shadow-[0_2px_6px_oklch(23%_0.074_255_/_0.07)]"><CheckCircle2 className="mx-auto text-opportunity-700" size={44}/><h1 className="mt-4 text-2xl font-bold text-navy-900">เผยแพร่ประกาศงานแล้ว</h1><p className="mt-2 text-slate-700">ระบบจะเริ่มค้นหาผู้สมัครที่มีทักษะ ความพร้อม และระยะทางเหมาะสม</p><Link href="/employer/matches" className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-brand-600 px-5 font-bold text-white">ดูผู้สมัครที่เหมาะสม</Link></div>;

  return <div className="page-enter mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold text-navy-900">ประกาศงานใหม่</h1><p className="mt-2 text-slate-700">ข้อมูลที่ชัดเจนช่วยให้การจับคู่แม่นยำและผู้สมัครตัดสินใจได้อย่างมั่นใจ</p>{error && <p role="alert" className="mt-5 rounded-[12px] bg-red-50 p-4 font-semibold text-red-700">{error}</p>}<form onSubmit={submit} className="mt-7 grid gap-5 rounded-[12px] bg-white p-5 shadow-[0_2px_6px_oklch(23%_0.074_255_/_0.07)] sm:p-7"><Field name="title" label="ชื่อตำแหน่งงาน" required/><TextareaField name="description" label="รายละเอียดงาน" required/><Field name="skills" label="ทักษะที่ต้องการ" required hint="คั่นแต่ละทักษะด้วยเครื่องหมายจุลภาค"/><fieldset><legend className="font-semibold text-slate-800">รูปแบบงาน <span className="text-red-600">*</span></legend><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{([['full_time','งานเต็มเวลา'],['part_time','งานพาร์ทไทม์']] as const).map(([value,label])=><label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-4 font-bold text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"><input type="radio" name="workType" value={value} required className="h-5 w-5 accent-brand-600"/>{label}</label>)}</div></fieldset><fieldset><legend className="font-semibold text-slate-800">คะแนนความสอดคล้องขั้นต่ำ <span className="text-red-600">*</span></legend><p className="mt-1 text-sm text-slate-600">ระบบจะแสดงผู้สมัครแนะนำที่มีคะแนนถึงเกณฑ์นี้</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,25,50,75].map((score)=><label key={score} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 font-bold text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"><input type="radio" name="minimumMatchScore" value={score} defaultChecked={score===50} required className="h-5 w-5 accent-brand-600"/>{score}%</label>)}</div></fieldset><LocationFields addressName="location" addressLabel="สถานที่ทำงาน"/><Field name="wage" label="ค่าจ้างต่อวัน (บาท)" type="number" min={1} required/><div className="flex justify-end"><Button type="submit" size="lg" disabled={busy}>{busy ? 'กำลังเผยแพร่…' : 'เผยแพร่ประกาศงาน'}</Button></div></form></div>;
}
