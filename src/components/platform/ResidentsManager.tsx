'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { BriefcaseBusiness, CalendarDays, Camera, Clock3, CreditCard, FileText, Pencil, Phone, Plus, Search, Trash2, Upload, UserRound, UsersRound, WalletCards, X } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { deleteCaseManager, deleteResident, getCaseManagers, getResidents, upsertCaseManager, upsertResident } from '@/lib/db';
import { formatCaseManagerAssignment, validateCaseManager } from '@/lib/case-managers';
import {
  createResidentDocumentDownloadUrl,
  deleteResidentDocument,
  getResidentDocuments,
  uploadResidentDocument,
} from '@/lib/resident-documents';
import {
  DOCUMENT_CATEGORIES,
  formatDocumentCategory,
  formatPaymentPreference,
  formatPreferredWorkType,
  validateResidentDocuments,
} from '@/lib/resident-intake';
import type { CaseManager, DocumentCategory, Resident, ResidentDocument } from '@/types';
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

type StagedDocument = {
  id: string;
  file: File;
  category: DocumentCategory;
};

function idStatusLabel(item: Resident) {
  const status = item.idCardStatus ?? (item.hasIdCard === true ? 'has_card' : item.hasIdCard === false ? 'not_started' : undefined);
  return ID_STATUSES.find(([value]) => value === status)?.[1] ?? 'ยังไม่ระบุสถานะบัตร';
}

export function ResidentsManager() {
  const { org } = useAuthContext();
  const [items, setItems] = useState<Resident[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [managerBusy, setManagerBusy] = useState(false);
  const [managerError, setManagerError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [documents, setDocuments] = useState<ResidentDocument[]>([]);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [documentError, setDocumentError] = useState('');
  const [saveError, setSaveError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sid = org.shelter?.id ?? '';

  useEffect(() => {
    if (!sid) return;
    getResidents(sid)
      .then(setItems)
      .catch((error) => setManagerError(error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลผู้เข้าร่วมได้'));
    getCaseManagers(sid)
      .then(setCaseManagers)
      .catch(() => setManagerError('ยังไม่ได้ติดตั้งฐานข้อมูลผู้จัดการรายกรณี กรุณารัน migration 015'));
  }, [sid]);
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
    setDocuments([]);
    setStagedDocuments([]);
    setRemovedDocumentIds([]);
    setDocumentError('');
    setSaveError('');
    setOpen(true);
  }

  async function editItem(item: Resident) {
    setEditing(item);
    setSkills(item.skills);
    setDays(item.availableDays?.length ? item.availableDays : item.availability.includes('สุดสัปดาห์') ? ['เสาร์', 'อาทิตย์'] : DAYS.slice(0, 5));
    setPhotoPreview(item.photoUrl ?? '');
    setPhotoError('');
    setStagedDocuments([]);
    setRemovedDocumentIds([]);
    setDocumentError('');
    setSaveError('');
    try {
      const storedDocuments = await getResidentDocuments(item.id);
      setDocuments(storedDocuments.length > 0 ? storedDocuments : item.documents ?? []);
    } catch (error) {
      setDocuments(item.documents ?? []);
      setDocumentError(error instanceof Error ? error.message : 'ไม่สามารถโหลดเอกสารได้');
    }
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

  function resetManagerForm() {
    setEditingManagerId(null);
    setManagerName('');
    setManagerPhone('');
    setManagerError('');
  }

  function editManager(manager: CaseManager) {
    setEditingManagerId(manager.id);
    setManagerName(manager.name);
    setManagerPhone(manager.phone);
    setManagerError('');
  }

  async function saveManager(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCaseManager({ name: managerName, phone: managerPhone });
    if (validationError) {
      setManagerError(validationError);
      return;
    }

    setManagerBusy(true);
    setManagerError('');
    try {
      const saved = await upsertCaseManager({
        id: editingManagerId ?? undefined,
        shelterId: sid,
        name: managerName,
        phone: managerPhone,
      });
      setCaseManagers((current) =>
        editingManagerId
          ? current.map((manager) => (manager.id === saved.id ? saved : manager))
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name, 'th')),
      );
      setItems((current) =>
        current.map((resident) =>
          resident.caseManagerId === saved.id ? { ...resident, caseManager: saved } : resident,
        ),
      );
      setNotice(editingManagerId ? 'แก้ไขข้อมูลผู้จัดการรายกรณีแล้ว' : 'เพิ่มผู้จัดการรายกรณีแล้ว');
      resetManagerForm();
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : 'ไม่สามารถบันทึกผู้จัดการรายกรณีได้');
    } finally {
      setManagerBusy(false);
    }
  }

  async function removeManager(manager: CaseManager) {
    if (!confirm(`ลบผู้จัดการรายกรณี "${manager.name}" ใช่หรือไม่? ผู้เข้าร่วมที่อยู่ในความดูแลจะเปลี่ยนเป็นยังไม่ได้มอบหมาย`)) return;
    setManagerError('');
    try {
      await deleteCaseManager(manager.id);
      setCaseManagers((current) => current.filter((item) => item.id !== manager.id));
      setItems((current) =>
        current.map((resident) =>
          resident.caseManagerId === manager.id
            ? { ...resident, caseManagerId: undefined, caseManager: undefined }
            : resident,
        ),
      );
      if (editingManagerId === manager.id) resetManagerForm();
      setNotice(`ลบผู้จัดการรายกรณี ${manager.name} แล้ว`);
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : 'ไม่สามารถลบผู้จัดการรายกรณีได้');
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

  function stageDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const retainedDocumentCount = documents.length - removedDocumentIds.length;
    const validationError = validateResidentDocuments(
      selectedFiles,
      retainedDocumentCount + stagedDocuments.length,
    );

    event.target.value = '';
    if (validationError) {
      setDocumentError(validationError);
      return;
    }

    setStagedDocuments((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        category: 'education' as const,
      })),
    ]);
    setDocumentError('');
  }

  function updateStagedDocumentCategory(id: string, category: DocumentCategory) {
    setStagedDocuments((current) =>
      current.map((document) => (document.id === id ? { ...document, category } : document)),
    );
  }

  function toggleExistingDocumentRemoval(id: string) {
    setRemovedDocumentIds((current) =>
      current.includes(id) ? current.filter((documentId) => documentId !== id) : [...current, id],
    );
    setDocumentError('');
  }

  async function downloadDocument(document: ResidentDocument) {
    try {
      const url = await createResidentDocumentDownloadUrl(document.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'ไม่สามารถเปิดเอกสารได้');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customSkills = String(form.get('customSkills') ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (skills.length + customSkills.length === 0 || days.length === 0) return;
    const retainedDocumentCount = documents.length - removedDocumentIds.length;
    const validationError = validateResidentDocuments(
      stagedDocuments.map((document) => document.file),
      retainedDocumentCount,
    );
    if (validationError) {
      setDocumentError(validationError);
      return;
    }

    setBusy(true);
    setSaveError('');
    const from = String(form.get('availableFrom'));
    const to = String(form.get('availableTo'));
    const uploadedDocuments: ResidentDocument[] = [];

    try {
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
        chronicConditions: String(form.get('chronicConditions')).trim(),
        preferredWorkType: String(form.get('preferredWorkType')) as Resident['preferredWorkType'],
        paymentPreference: String(form.get('paymentPreference')) as Resident['paymentPreference'],
        caseManagerId: String(form.get('caseManagerId') || '') || undefined,
      });

      for (const stagedDocument of stagedDocuments) {
        const uploadedDocument = await uploadResidentDocument(
          sid,
          item.id,
          stagedDocument.file,
          stagedDocument.category,
        );
        uploadedDocuments.push(uploadedDocument);
      }

      const documentsToDelete = documents.filter((document) =>
        removedDocumentIds.includes(document.id),
      );
      for (const document of documentsToDelete) {
        await deleteResidentDocument(document);
      }

      const retainedDocuments = documents.filter(
        (document) => !removedDocumentIds.includes(document.id),
      );
      const assignedManager = caseManagers.find((manager) => manager.id === item.caseManagerId);
      const savedItem = {
        ...item,
        caseManager: assignedManager,
        documents: [...retainedDocuments, ...uploadedDocuments],
      };

      setItems((current) =>
        editing
          ? current.map((resident) => (resident.id === savedItem.id ? savedItem : resident))
          : [savedItem, ...current],
      );
      setOpen(false);
      setNotice(
        editing
          ? 'แก้ไขข้อมูลผู้เข้าร่วมเรียบร้อยแล้ว'
          : 'บันทึกข้อมูลผู้เข้าร่วมเรียบร้อยแล้ว',
      );
    } catch (error) {
      await Promise.allSettled(
        uploadedDocuments.map((document) => deleteResidentDocument(document)),
      );
      setSaveError(
        error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง',
      );
    } finally {
      setBusy(false);
    }
  }

  const filtered = items.filter((item) => `${item.name} ${item.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="page-enter overflow-x-hidden">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-3xl font-extrabold text-navy-900">ผู้เข้าร่วมที่อยู่ในความดูแล</h1><p className="mt-2 text-slate-700">จัดการข้อมูลความพร้อมและทักษะที่ใช้ในการจับคู่งาน</p></div><Button ref={triggerRef} className="shrink-0" onClick={openForm}><Plus size={18}/>เพิ่มผู้เข้าร่วม</Button></div>
    {notice && <p role="status" className="mt-5 rounded-[10px] bg-green-50 p-3 font-semibold text-green-800">{notice}</p>}
    <section className="mt-6 rounded-[16px] bg-white p-5 shadow-[0_2px_6px_oklch(23%_0.074_255_/_0.07)] sm:p-6" aria-labelledby="case-manager-heading">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><UsersRound size={22}/></span>
        <div>
          <h2 id="case-manager-heading" className="text-xl font-extrabold text-navy-900">ผู้จัดการรายกรณี</h2>
          <p className="mt-1 text-sm text-slate-600">หนึ่งคนสามารถดูแลผู้เข้าร่วมได้หลายคน นายจ้างจะเห็นเฉพาะชื่อและเบอร์โทร</p>
        </div>
      </div>
      <form onSubmit={saveManager} className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <Field name="managerName" label="ชื่อผู้จัดการรายกรณี" value={managerName} onChange={(event) => setManagerName(event.target.value)} required/>
        <Field name="managerPhone" label="เบอร์โทรศัพท์" type="tel" value={managerPhone} onChange={(event) => setManagerPhone(event.target.value)} required/>
        <div className="flex min-h-11 gap-2">
          <Button type="submit" disabled={managerBusy}>{managerBusy ? 'กำลังบันทึก…' : editingManagerId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้จัดการ'}</Button>
          {editingManagerId && <Button type="button" variant="ghost" onClick={resetManagerForm}>ยกเลิก</Button>}
        </div>
      </form>
      {managerError && <p role="alert" className="mt-3 rounded-[10px] bg-red-50 p-3 text-sm font-semibold text-red-700">{managerError}</p>}
      <div className="mt-4 grid gap-2">
        {caseManagers.length === 0 ? (
          <p className="rounded-[12px] bg-slate-50 p-4 text-sm text-slate-600">ยังไม่มีผู้จัดการรายกรณี เพิ่มรายชื่อด้านบนก่อนมอบหมายให้ผู้เข้าร่วม</p>
        ) : caseManagers.map((manager) => {
          const assignedCount = items.filter((resident) => resident.caseManagerId === manager.id).length;
          return (
            <article key={manager.id} className="flex flex-col gap-3 rounded-[12px] border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-950">{manager.name}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><Phone size={15}/>{manager.phone}</span><span>ดูแล {assignedCount} คน</span></p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => editManager(manager)}><Pencil size={15}/>แก้ไข</Button>
                <button type="button" onClick={() => removeManager(manager)} className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={15}/>ลบ</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
    <label className="relative mt-6 block max-w-xl"><span className="sr-only">ค้นหาผู้เข้าร่วม</span><Search className="absolute left-3 top-3 text-slate-500" size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาด้วยชื่อหรือทักษะ" className="min-h-11 w-full rounded-[10px] border border-slate-300 bg-white pl-10 pr-4 placeholder:text-slate-600"/></label>
    <div className="mt-5 overflow-hidden rounded-[12px] bg-white shadow-[0_2px_6px_oklch(23%_0.074_255_/_0.07)]">
      {filtered.length === 0 ? <div className="p-10 text-center"><UserRound className="mx-auto text-navy-600"/><h2 className="mt-3 font-bold text-navy-900">ไม่พบผู้เข้าร่วม</h2><p className="mt-1 text-sm text-slate-700">ลองเปลี่ยนคำค้นหา หรือเพิ่มข้อมูลผู้เข้าร่วมคนแรก</p></div> : <div className="divide-y divide-slate-200">{filtered.map((item) => <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="font-bold text-navy-900">{item.name} <span className="font-normal text-slate-600">· {item.age} ปี</span></h2><div className="mt-2 flex flex-wrap gap-1.5">{item.skills.map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{skill}</span>)}</div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-1.5"><CreditCard size={16}/>{idStatusLabel(item)}</span><span className="flex items-center gap-1.5"><BriefcaseBusiness size={16}/>{formatPreferredWorkType(item.preferredWorkType)}</span><span className="flex items-center gap-1.5"><WalletCards size={16}/>{formatPaymentPreference(item.paymentPreference)}</span><span className="flex items-center gap-1.5"><UsersRound size={16}/>{formatCaseManagerAssignment(caseManagers.find((manager) => manager.id === item.caseManagerId) ?? item.caseManager)}</span><span className="flex items-center gap-1.5"><CalendarDays size={16}/>{item.availableDays?.length ? item.availableDays.join(', ') : item.availability}</span>{item.availableFrom && item.availableTo && <span className="flex items-center gap-1.5"><Clock3 size={16}/>{item.availableFrom}–{item.availableTo} น.</span>}</div></div><div className="flex items-center gap-2 sm:flex-col sm:items-end"><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">พร้อมรับงาน</span><div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => editItem(item)}><Pencil size={16}/>แก้ไข</Button><button type="button" onClick={() => removeResidentItem(item.id, item.name)} className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200"><Trash2 size={15}/>ลบ</button></div></div></article>)}</div>}
    </div>
      {open && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="new-resident" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7"><div><h2 id="new-resident" className="text-2xl font-bold text-navy-900">{editing ? 'แก้ไขข้อมูลผู้เข้าร่วม' : 'เพิ่มผู้เข้าร่วม'}</h2><p className="mt-1 text-sm text-slate-600">กรอกข้อมูลที่จำเป็นต่อการสนับสนุนและจับคู่งาน</p></div><button ref={closeButtonRef} type="button" aria-label="ปิดหน้าต่าง" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"><X/></button></div>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
        <fieldset className="sm:col-span-2"><legend className="text-base font-extrabold text-slate-950">ข้อมูลพื้นฐาน</legend><p className="mt-1 text-sm text-slate-500">รูปและข้อมูลนี้จะเปิดเผยแก่นายจ้างหลังศูนย์พักพิงอนุมัติการจับคู่</p><div className="mt-4 grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]"><div><div className="relative aspect-square overflow-hidden rounded-[14px] bg-brand-50">{photoPreview ? <Image src={photoPreview} alt="ตัวอย่างรูปผู้เข้าร่วม" fill className="object-cover"/> : <span className="grid h-full place-items-center text-brand-600"><UserRound size={44}/></span>}</div><label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-white px-3 text-sm font-bold text-brand-700 hover:bg-brand-50"><Camera size={17}/>{photoPreview ? 'เปลี่ยนรูป' : 'เลือกรูป'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only"/></label>{photoPreview && <button type="button" onClick={() => { setPhotoPreview(''); setPhotoError(''); }} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={16}/>ลบรูป</button>}<p className="mt-2 text-xs leading-5 text-slate-500">JPG, PNG หรือ WebP ไม่เกิน 2 MB</p>{photoError && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{photoError}</p>}</div><div className="grid content-start gap-4"><Field name="name" label="ชื่อที่ใช้แสดง" defaultValue={editing?.name} required autoFocus/><div className="grid gap-4 sm:grid-cols-2"><Field name="age" label="อายุ" type="number" min={18} max={80} defaultValue={editing?.age} required/><label className="grid gap-1.5 text-sm font-semibold text-slate-800"><span>เพศ <span className="text-red-700">*</span></span><select name="gender" defaultValue={editing?.gender ?? ''} required className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3.5 text-base text-slate-950 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"><option value="" disabled>เลือกเพศ</option>{GENDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div></div></fieldset>
        <div className="sm:col-span-2">
          <TextareaField
            name="chronicConditions"
            label="โรคประจำตัว"
            defaultValue={editing?.chronicConditions}
            placeholder="เช่น เบาหวาน, ความดันโลหิตสูง หรือไม่มี"
          />
          <p className="mt-1 text-sm text-slate-500">ข้อมูลนี้ใช้สำหรับการดูแลโดยเจ้าหน้าที่ศูนย์พักพิง และไม่แสดงแก่นายจ้าง</p>
        </div>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800 sm:col-span-2">
          <span>ผู้จัดการรายกรณี</span>
          <select name="caseManagerId" defaultValue={editing?.caseManagerId ?? ''} className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3.5 text-base text-slate-950 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100">
            <option value="">ยังไม่ได้มอบหมาย</option>
            {caseManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} · {manager.phone}</option>)}
          </select>
          <span className="font-normal text-slate-500">นายจ้างจะเห็นชื่อและเบอร์โทรของผู้ที่ได้รับมอบหมาย</span>
        </label>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">สถานะบัตรประชาชน <span className="text-red-700">*</span></legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{ID_STATUSES.map(([value, label]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-slate-300 px-4 hover:border-brand-400 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"><input type="radio" name="idCardStatus" value={value} defaultChecked={(editing?.idCardStatus ?? (editing?.hasIdCard === true ? 'has_card' : editing?.hasIdCard === false ? 'not_started' : undefined)) === value} required className="h-5 w-5 accent-brand-600"/><span className="font-semibold text-slate-800">{label}</span></label>)}</div><p className="mt-2 text-sm text-slate-500">เก็บเฉพาะสถานะ ไม่เก็บหมายเลขบัตรประชาชน</p></fieldset>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">เลือกทักษะ <span className="text-red-700">*</span></legend><div className="mt-2 flex flex-wrap gap-2">{SKILLS.map((skill) => <button key={skill} type="button" aria-pressed={skills.includes(skill)} onClick={() => toggle(skill, skills, setSkills)} className={`min-h-10 rounded-full border px-3.5 text-sm font-bold transition ${skills.includes(skill) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'}`}>{skills.includes(skill) ? '✓ ' : '+ '}{skill}</button>)}</div><div className="mt-3"><Field name="customSkills" label="ทักษะอื่น ๆ" placeholder="เช่น เย็บผ้า, ดูแลผู้สูงอายุ" hint="เพิ่มได้หลายทักษะโดยคั่นด้วยจุลภาค"/></div>{skills.length === 0 && <p className="mt-2 text-sm text-slate-500">เลือกอย่างน้อย 1 ทักษะ หรือกรอกทักษะอื่น ๆ</p>}</fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">รูปแบบงานที่ต้องการ <span className="text-red-700">*</span></legend>
          <div className="mt-2 grid gap-2">
            {([['full_time', 'งานเต็มเวลา'], ['part_time', 'งานพาร์ทไทม์']] as const).map(([value, label]) => (
              <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-slate-300 px-4 hover:border-brand-400 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input type="radio" name="preferredWorkType" value={value} defaultChecked={editing?.preferredWorkType === value} required className="h-5 w-5 accent-brand-600"/>
                <span className="font-semibold text-slate-800">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">วิธีรับค่าจ้างที่สะดวก <span className="text-red-700">*</span></legend>
          <div className="mt-2 grid gap-2">
            {([['cash', 'เงินสด'], ['bank_transfer', 'โอนเข้าบัญชีธนาคาร']] as const).map(([value, label]) => (
              <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-slate-300 px-4 hover:border-brand-400 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input type="radio" name="paymentPreference" value={value} defaultChecked={editing?.paymentPreference === value} required className="h-5 w-5 accent-brand-600"/>
                <span className="font-semibold text-slate-800">{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">ระบบจะไม่เก็บเลขบัญชีธนาคาร</p>
        </fieldset>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-800">วันที่พร้อมทำงาน <span className="text-red-700">*</span></legend><div className="mt-2 flex flex-wrap gap-2">{DAYS.map((day) => <button key={day} type="button" aria-pressed={days.includes(day)} onClick={() => toggle(day, days, setDays)} className={`min-h-10 rounded-[10px] border px-3 text-sm font-bold ${days.includes(day) ? 'border-opportunity-700 bg-opportunity-50 text-opportunity-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{day}</button>)}</div></fieldset>
        <Field name="availableFrom" label="เวลาเริ่มงาน" type="time" defaultValue={editing?.availableFrom ?? '09:00'} required/><Field name="availableTo" label="เวลาสิ้นสุด" type="time" defaultValue={editing?.availableTo ?? '17:00'} required/>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-800">เอกสารประกอบ</legend>
          <p className="mt-1 text-sm text-slate-500">PDF, JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อไฟล์ สูงสุด 5 ไฟล์</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 hover:bg-brand-50">
            <Upload size={18}/>
            อัปโหลดเอกสาร
            <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={stageDocuments} className="sr-only"/>
          </label>

          {(documents.length > 0 || stagedDocuments.length > 0) && (
            <div className="mt-4 grid gap-2">
              {documents.map((document) => {
                const markedForRemoval = removedDocumentIds.includes(document.id);
                return (
                  <div key={document.id} className={`grid gap-3 rounded-[12px] border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${markedForRemoval ? 'border-red-200 bg-red-50/60 opacity-70' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="min-w-0">
                      <p className={`flex items-center gap-2 truncate font-semibold text-slate-800 ${markedForRemoval ? 'line-through' : ''}`}><FileText size={17} className="shrink-0"/>{document.originalName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDocumentCategory(document.category)} · {(document.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <div className="flex gap-2">
                      {!markedForRemoval && <button type="button" onClick={() => downloadDocument(document)} className="min-h-10 rounded-[9px] px-3 text-sm font-bold text-brand-700 hover:bg-brand-50">เปิด</button>}
                      <button type="button" onClick={() => toggleExistingDocumentRemoval(document.id)} className="min-h-10 rounded-[9px] px-3 text-sm font-bold text-red-700 hover:bg-red-50">{markedForRemoval ? 'เก็บไว้' : 'ลบ'}</button>
                    </div>
                  </div>
                );
              })}
              {stagedDocuments.map((document) => (
                <div key={document.id} className="grid gap-3 rounded-[12px] border border-brand-200 bg-brand-50/50 p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold text-slate-800"><FileText size={17} className="shrink-0"/>{document.file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{(document.file.size / 1024 / 1024).toFixed(1)} MB · รอการบันทึก</p>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-slate-700">
                    ประเภทเอกสาร
                    <select value={document.category} onChange={(event) => updateStagedDocumentCategory(document.id, event.target.value as DocumentCategory)} className="min-h-10 rounded-[9px] border border-slate-300 bg-white px-2 text-sm">
                      {DOCUMENT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                    </select>
                  </label>
                  <button type="button" aria-label={`ลบ ${document.file.name}`} onClick={() => setStagedDocuments((current) => current.filter((item) => item.id !== document.id))} className="grid h-10 w-10 place-items-center rounded-[9px] text-red-700 hover:bg-red-50"><Trash2 size={17}/></button>
                </div>
              ))}
            </div>
          )}
          {documentError && <p role="alert" className="mt-3 rounded-[10px] bg-red-50 p-3 text-sm font-semibold text-red-700">{documentError}</p>}
        </fieldset>
        <div className="sm:col-span-2"><TextareaField name="notes" label="ข้อมูลที่ช่วยในการสนับสนุน" defaultValue={editing?.notes} placeholder="ข้อจำกัดในการเดินทาง อุปกรณ์ที่ต้องใช้ หรือการสนับสนุนอื่น ๆ"/></div>
        {saveError && <p role="alert" className="sm:col-span-2 rounded-[10px] bg-red-50 p-3 text-sm font-semibold text-red-700">{saveError}</p>}
      </div><div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? 'กำลังบันทึก…' : editing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</Button></div></form>
    </section></div>, document.body)}
  </div>;
}
