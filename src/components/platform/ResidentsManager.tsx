'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CalendarDays, Camera, Clock3, CreditCard, Pencil, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { deleteResident, getResidents, upsertResident } from '@/lib/db';
import type { Resident } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';

const SKILLS = ['ทำอาหาร', 'ทำความสะอาด', 'เตรียมอาหาร', 'ช่างไม้', 'ทาสี', 'ซ่อมบำรุง', 'จัดสวน', 'จัดเรียงสินค้า', 'บริการลูกค้า', 'ส่งของ'];
const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const ID_STATUSES = [
  ['has_card', 'มีบัตรประชาชน'],
  ['in_progress', 'อยู่ระหว่างดำเนินการ'],
  ['needs_support', 'ต้องการความช่วยเหลือในการดำเนินการ'],
  ['not_started', 'ยังไม่ได้เริ่มดำเนินการ'],
] as const;
const GENDERS = [
  ['male', 'ชาย'],
  ['female', 'หญิง'],
  ['non_binary', 'นอนไบนารี'],
  ['other', 'อื่น ๆ'],
  ['prefer_not_to_say', 'ไม่ประสงค์ระบุ'],
] as const;

function idStatusLabel(item: Resident) {
  const status = item.idCardStatus ?? (item.hasIdCard === true ? 'has_card' : item.hasIdCard === false ? 'not_started' : undefined);
  return ID_STATUSES.find(([value]) => value === status)?.[1] ?? 'ยังไม่ระบุสถานะบัตร';
}

export function ResidentsManager() {
  const { org } = useAuthContext();
  const [items, setItems] = useState<Resident[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sid = org.shelter?.id ?? '';

  useEffect(() => { getResidents(sid).then(setItems); }, [sid]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      triggerRef.current?.focus();
    };
  }, [open]);

  function openForm() {
    setEditing(null);
    setSkills([]);
    setDays([]);
    setPhotoPreview('');
    setPhotoError('');
    setOpen(true);
  }

  function editItem(item: Resident) {
    setEditing(item);
    setSkills(item.skills);
    setDays(item.availableDays?.length ? item.availableDays : item.availability.includes('สุดสัปดาห์') ? ['เสาร์', 'อาทิตย์'] : DAYS.slice(0, 5));
    setPhotoPreview(item.photoUrl ?? '');
    setPhotoError('');
    setOpen(true);
  }

  async function removeResidentItem(id: string, name: string) {
    if (!confirm(`คุณต้องการลบข้อมูลผู้เข้าร่วม "${name}" ใช่หรือไม่?`)) return;
    try {
      await deleteResident(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice(`ลบข้อมูลผู้เข้าร่วม ${name} เรียบร้อยแล้ว`);
    } catch (err) {
      alert('ไม่สามารถลบข้อมูลได้: ' + (err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'));
    }
  }

  function toggle(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('กรุณาเลือกไฟล์ JPG, PNG หรือ WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('รูปต้องมีขนาดไม่เกิน 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPhotoPreview(String(reader.result)); setPhotoError(''); };
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customSkills = String(form.get('customSkills') ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (skills.length + customSkills.length === 0 || days.length === 0) return;
    setBusy(true);
    const from = String(form.get('availableFrom'));
    const to = String(form.get('availableTo'));
    const item = await upsertResident({
      id: editing?.id,
      shelterId: sid,
      name: String(form.get('name')),
      age: Number(form.get('age')),
      gender: String(form.get('gender')) as Resident['gender'],
      photoUrl: photoPreview || undefined,
      skills: [...new Set([...skills, ...customSkills])],
      availability: `${days.join(', ')} · ${from}–${to}`,
      workAvailability: true,
      notes: String(form.get('notes')),
      hasIdCard: form.get('idCardStatus') === 'has_card',
      idCardStatus: String(form.get('idCardStatus')) as Resident['idCardStatus'],
      availableDays: days,
      availableFrom: from,
      availableTo: to,
    });
    setItems((current) => editing ? current.map((resident) => resident.id === item.id ? item : resident) : [item, ...current]);
    setBusy(false);
    setOpen(false);
    setNotice(editing ? 'แก้ไขข้อมูลผู้เข้าร่วมเรียบร้อยแล้ว' : 'บันทึกข้อมูลผู้เข้าร่วมเรียบร้อยแล้ว');
  }

  const filtered = items.filter((item) => `${item.name} ${item.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="page-enter overflow-x-hidden">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-3xl font-extrabold text-navy-900">ผู้เข้าร่วมที่อยู่ในความดูแล</h1><p className="mt-2 text-slate-700">จัดการข้อมูลความพร้อมและทักษะที่ใช้ในการจับคู่งาน</p></div><Button ref={triggerRef} className="shrink-0" onClick={openForm}><Plus size={18}/>เพิ่มผู้เข้าร่วม</Button></div>
    {notice && <p role="status" className="mt-5 rounded-[10px] bg-green-50 p-3 font-semibold text-green-800">{notice}</p>}
    <label className="relative mt-6 block max-w-xl"><span className="sr-only">ค้นหาผู้เข้าร่วม</span><Search className="absolute left-3 top-3 text-slate-500" size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาด้วยชื่อหรือทักษะ" className="min-h-11 w-full rounded-[10px] border border-slate-300 bg-white pl-10 pr-4 placeholder:text-slate-600"/></label>
    <div className="mt-5 overflow-hidden rounded-[12px] bg-white shadow-[0_2px_6px_oklch(23%_0.074_255_/_0.07)]">
      {filtered.length === 0 ? <div className="p-10 text-center"><UserRound className="mx-auto text-navy-600"/><h2 className="mt-3 font-bold text-navy-900">ไม่พบผู้เข้าร่วม</h2><p className="mt-1 text-sm text-slate-700">ลองเปลี่ยนคำค้นหา หรือเพิ่มข้อมูลผู้เข้าร่วมคนแรก</p></div> : <div className="divide-y divide-slate-200">{filtered.map((item) => <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="font-bold text-navy-900">{item.name} <span className="font-normal text-slate-600">· {item.age} ปี</span></h2><div className="mt-2 flex flex-wrap gap-1.5">{item.skills.map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{skill}</span>)}</div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-1.5"><CreditCard size={16}/>{idStatusLabel(item)}</span><span className="flex items-center gap-1.5"><CalendarDays size={16}/>{item.availableDays?.length ? item.availableDays.join(', ') : item.availability}</span>{item.availableFrom && item.availableTo && <span className="flex items-center gap-1.5"><Clock3 size={16}/>{item.availableFrom}–{item.availableTo} น.</span>}</div></div><div className="flex items-center gap-2 sm:flex-col sm:items-end"><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">พร้อมรับงาน</span><div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => editItem(item)}><Pencil size={16}/>แก้ไข</Button><button type="button" onClick={() => removeResidentItem(item.id, item.name)} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-3 text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200"><Trash2 size={15}/>ลบ</button></div></div></article>)}</div>}
    </div>
      {open && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="new-resident" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7"><div><h2 id="new-resident" className="text-2xl font-bold text-navy-900">{editing ? 'แก้ไขข้อมูลผู้เข้าร่วม' : 'เพิ่มผู้เข้าร่วม'}</h2><p className="mt-1 text-sm text-slate-600">กรอกข้อมูลที่จำเป็นต่อการสนับสนุนและจับคู่งาน</p></div><button ref={closeButtonRef} type="button" aria-label="ปิดหน้าต่าง" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"><X/></button></div>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
        <fieldset className="sm:col-span-2"><legend className="text-base font-extrabold text-slate-950">ข้อมูลพื้นฐาน</legend><p className="mt-1 text-sm text-slate-500">รูปและข้อมูลนี้จะเปิดเผยแก่นายจ้างหลังศูนย์พักพิงอนุมัติการจับคู่</p><div className="mt-4 grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]"><div><div className="relative aspect-square overflow-hidden rounded-[14px] bg-brand-50">{photoPreview ? <Image src={photoPreview} alt="ตัวอย่างรูปผู้เข้าร่วม" fill className="object-cover"/> : <span className="grid h-full place-items-center text-brand-600"><UserRound size={44}/></span>}</div><label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-white px-3 text-sm font-bold text-brand-700 hover:bg-brand-50"><Camera size={17}/>{photoPreview ? 'เปลี่ยนรูป' : 'เลือกรูป'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only"/></label>{photoPreview && <button type="button" onClick={() => { setPhotoPreview(''); setPhotoError(''); }} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={16}/>ลบรูป</button>}<p className="mt-2 text-xs leading-5 text-slate-500">JPG, PNG หรือ WebP ไม่เกิน 2 MB</p>{photoError && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{photoError}</p>}</div><div className="grid content-start gap-4"><Field name="name" label="ชื่อที่ใช้แสดง" defaultValue={editing?.name} required autoFocus/><div className="grid gap-4 sm:grid-cols-2"><Field name="age" label="อายุ" type="number" min={18} max={80} defaultValue={editing?.age} required/><label className="grid gap-1.5 text-sm font-semibold text-slate-800"><span>เพศ <span className="text-red-700">*</span></span><select name="gender" defaultValue={editing?.gender ?? ''} required className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3.5 text-base text-slate-950 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"><option value="" disabled>เลือกเพศ</option>{GENDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div></div></fieldset>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">สถานะบัตรประชาชน <span className="text-red-700">*</span></legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{ID_STATUSES.map(([value, label]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-slate-300 px-4 hover:border-brand-400 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"><input type="radio" name="idCardStatus" value={value} defaultChecked={(editing?.idCardStatus ?? (editing?.hasIdCard === true ? 'has_card' : editing?.hasIdCard === false ? 'not_started' : undefined)) === value} required className="h-5 w-5 accent-brand-600"/><span className="font-semibold text-slate-800">{label}</span></label>)}</div><p className="mt-2 text-sm text-slate-500">เก็บเฉพาะสถานะ ไม่เก็บหมายเลขบัตรประชาชน</p></fieldset>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">เลือกทักษะ <span className="text-red-700">*</span></legend><div className="mt-2 flex flex-wrap gap-2">{SKILLS.map((skill) => <button key={skill} type="button" aria-pressed={skills.includes(skill)} onClick={() => toggle(skill, skills, setSkills)} className={`min-h-10 rounded-full border px-3.5 text-sm font-bold transition ${skills.includes(skill) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'}`}>{skills.includes(skill) ? '✓ ' : '+ '}{skill}</button>)}</div><div className="mt-3"><Field name="customSkills" label="ทักษะอื่น ๆ" placeholder="เช่น เย็บผ้า, ดูแลผู้สูงอายุ" hint="เพิ่มได้หลายทักษะโดยคั่นด้วยจุลภาค"/></div>{skills.length === 0 && <p className="mt-2 text-sm text-slate-500">เลือกอย่างน้อย 1 ทักษะ หรือกรอกทักษะอื่น ๆ</p>}</fieldset>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">วันที่พร้อมทำงาน <span className="text-red-700">*</span></legend><div className="mt-2 flex flex-wrap gap-2">{DAYS.map((day) => <button key={day} type="button" aria-pressed={days.includes(day)} onClick={() => toggle(day, days, setDays)} className={`min-h-10 rounded-[10px] border px-3 text-sm font-bold ${days.includes(day) ? 'border-opportunity-700 bg-opportunity-50 text-opportunity-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{day}</button>)}</div></fieldset>
        <Field name="availableFrom" label="เวลาเริ่มงาน" type="time" defaultValue={editing?.availableFrom ?? '09:00'} required/><Field name="availableTo" label="เวลาสิ้นสุด" type="time" defaultValue={editing?.availableTo ?? '17:00'} required/>
        <div className="sm:col-span-2"><TextareaField name="notes" label="ข้อมูลที่ช่วยในการสนับสนุน" defaultValue={editing?.notes} placeholder="ข้อจำกัดในการเดินทาง อุปกรณ์ที่ต้องใช้ หรือการสนับสนุนอื่น ๆ"/></div>
      </div><div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? 'กำลังบันทึก…' : editing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</Button></div></form>
    </section></div>, document.body)}
  </div>;
}
