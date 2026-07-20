'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Banknote, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, Clock3, CreditCard, Eye, MapPin, Phone, Send, ShieldCheck, Siren, UserCheck, X, XCircle } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getAllResidents, getJobs, getMatchesForEmployer, getMatchesForShelter, getShelters, updateMatchStatus, upsertMatch } from '@/lib/db';
import { rankResidentsForJob } from '@/lib/matching';
import type { Job, JobMatch, Resident, Shelter } from '@/types';
import { Button } from '@/components/ui/Button';

type State = { matches: JobMatch[]; jobs: Job[]; residents: Resident[]; shelters: Shelter[] };
type Action = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'primary' | 'danger';
  run: () => Promise<void>;
};

const STATUS: Record<JobMatch['status'], { label: string; className: string; step: number }> = {
  suggested: { label: 'รอผู้เข้าร่วมตัดสินใจ', className: 'bg-brand-50 text-brand-700', step: 1 },
  worker_accepted: { label: 'ผู้เข้าร่วมสนใจ · รอศูนย์พักพิงอนุมัติ', className: 'bg-amber-50 text-amber-800', step: 2 },
  worker_declined: { label: 'ผู้เข้าร่วมไม่รับงาน', className: 'bg-slate-100 text-slate-700', step: 2 },
  shelter_approved: { label: 'ศูนย์พักพิงอนุมัติแล้ว', className: 'bg-hope-100 text-hope-700', step: 3 },
  shelter_declined: { label: 'ศูนย์พักพิงไม่อนุมัติ', className: 'bg-red-50 text-red-700', step: 3 },
};

function MatchProgress({ status }: { status: JobMatch['status'] }) {
  const current = STATUS[status].step;
  const stopped = status === 'worker_declined' || status === 'shelter_declined';
  return <ol aria-label="ขั้นตอนการจับคู่" className="mt-5 flex w-full text-xs font-semibold text-slate-500">
    {['นายจ้างเสนองาน', 'ผู้เข้าร่วมตัดสินใจ', 'ศูนย์พักพิงอนุมัติ'].map((label, index) => {
      const reached = index + 1 <= current;
      const failed = stopped && index + 1 === current;
      const complete = index + 1 < current || status === 'shelter_approved';
      return <li key={label} className="relative flex min-w-0 flex-1 flex-col items-start gap-2 pr-2 last:flex-none last:pr-0 sm:flex-row sm:items-center">
        {index < 2 && <span aria-hidden className={`absolute left-7 right-0 top-3 h-0.5 ${index + 1 < current ? 'bg-brand-500' : 'bg-slate-200'}`}/>} 
        <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white ${failed ? 'bg-red-100 text-red-700' : reached ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{complete ? <Check size={15} strokeWidth={3}/> : index + 1}</span>
        <span className={`relative z-10 max-w-28 bg-white pr-2 leading-5 ${reached ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
      </li>;
    })}
  </ol>;
}

export function MatchesBoard({ role }: { role: 'shelter' | 'employer' }) {
  const { org } = useAuthContext();
  const [state, setState] = useState<State | null>(null);
  const [jobId, setJobId] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [expandedResidentId, setExpandedResidentId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const employerId = org.employer?.id ?? '';
      const [jobs, residents, matches, shelters] = await Promise.all([
        getJobs(role === 'employer' ? employerId : undefined),
        getAllResidents(),
        role === 'shelter' ? getMatchesForShelter(org.shelter?.id ?? '') : getMatchesForEmployer(employerId),
        getShelters(),
      ]);
      setState({ jobs, residents, matches, shelters });
      setJobId((current) => current || jobs.find((job) => job.status === 'open')?.id || jobs[0]?.id || '');
    })();
  }, [role, org]);

  useEffect(() => {
    if (!action) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setAction(null); };
    document.addEventListener('keydown', close);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = overflow; };
  }, [action]);

  useEffect(() => {
    if (!expandedResidentId) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpandedResidentId(null); };
    document.addEventListener('keydown', close);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = overflow; };
  }, [expandedResidentId]);

  const selectedJob = state?.jobs.find((job) => job.id === jobId);
  const ranked = useMemo(() => selectedJob && state ? rankResidentsForJob(selectedJob, state.residents) : [], [selectedJob, state]);
  const expandedResident = state?.residents.find((resident) => resident.id === expandedResidentId);
  const expandedShelter = expandedResident ? state?.shelters.find((shelter) => shelter.id === expandedResident.shelterId) : undefined;

  async function confirmAction() {
    if (!action) return;
    setSaving(true);
    try { await action.run(); setAction(null); } finally { setSaving(false); }
  }

  function updateLocal(id: string, status: JobMatch['status'], message: string) {
    setState((current) => current ? { ...current, matches: current.matches.map((match) => match.id === id ? { ...match, status } : match) } : current);
    setNotice(message);
  }

  function requestStatus(match: JobMatch, resident: Resident, job: Job, status: JobMatch['status']) {
    const accepting = status === 'worker_accepted' || status === 'shelter_approved';
    const copy = status === 'worker_accepted'
      ? ['บันทึกว่าผู้เข้าร่วมสนใจงานนี้?', `${resident.name} ยืนยันความสนใจในตำแหน่ง ${job.title}`, 'ผู้เข้าร่วมสนใจ']
      : status === 'worker_declined'
        ? ['บันทึกว่าผู้เข้าร่วมไม่รับงาน?', `${resident.name} ไม่ประสงค์รับตำแหน่ง ${job.title}`, 'บันทึกการปฏิเสธ']
        : status === 'shelter_approved'
          ? ['อนุมัติการจับคู่นี้?', `เมื่ออนุมัติ นายจ้างจะเห็นข้อมูลเพิ่มเติมของ ${resident.name} เพื่อประสานงาน`, 'อนุมัติและเปิดเผยข้อมูล']
          : ['ไม่อนุมัติการจับคู่นี้?', `นายจ้างจะเห็นว่าศูนย์พักพิงไม่อนุมัติ แต่จะไม่เห็นข้อมูลเพิ่มเติมของ ${resident.name}`, 'ไม่อนุมัติ'];
    setAction({ title: copy[0], description: copy[1], confirmLabel: copy[2], tone: accepting ? 'primary' : 'danger', run: async () => { await updateMatchStatus(match.id, status); updateLocal(match.id, status, `อัปเดตสถานะของ ${resident.name} เรียบร้อยแล้ว`); } });
  }

  function suggest(resident: Resident, score: number) {
    if (!selectedJob) return;
    setAction({
      title: 'ส่งข้อเสนองานให้ผู้เข้าร่วม?',
      description: `ส่งตำแหน่ง ${selectedJob.title} ให้ผู้เข้าร่วมที่มีความเหมาะสม ${score}% โดยศูนย์พักพิงจะบันทึกคำตอบของผู้เข้าร่วม`,
      confirmLabel: 'ส่งข้อเสนองาน',
      tone: 'primary',
      run: async () => {
        const match = await upsertMatch({ jobId: selectedJob.id, residentId: resident.id, score, status: 'suggested' });
        setState((current) => current ? { ...current, matches: [...current.matches.filter((item) => !(item.jobId === match.jobId && item.residentId === match.residentId)), match] } : current);
        setNotice('ส่งข้อเสนองานให้ศูนย์พักพิงเรียบร้อยแล้ว');
      },
    });
  }

  if (!state) return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[16px] bg-white"/>)}</div>;

  return <div className="page-enter">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-1 flex items-center gap-2 font-bold text-brand-600"><BriefcaseBusiness size={18}/>{role === 'employer' ? 'พื้นที่นายจ้าง' : 'พื้นที่ศูนย์พักพิง'}</p><h1 className="text-3xl font-extrabold tracking-[-0.025em] text-slate-950">{role === 'employer' ? 'แนะนำงานให้ผู้สมัคร' : 'การตัดสินใจและอนุมัติงาน'}</h1><p className="mt-2 max-w-2xl text-slate-600">{role === 'employer' ? 'เลือกตำแหน่ง ดูคะแนนความเหมาะสม และส่งข้อเสนองานผ่านศูนย์พักพิง' : 'บันทึกคำตอบของผู้เข้าร่วมก่อนตรวจสอบและอนุมัติการจับคู่'}</p></div>{role === 'shelter' && <div className="flex w-fit items-center gap-3 rounded-[12px] bg-white px-4 py-3 shadow-[0_2px_6px_oklch(21%_0.025_255_/_0.07)]"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700"><Clock3 size={20}/></span><div><p className="text-xs font-semibold text-slate-500">รอดำเนินการ</p><p className="font-extrabold text-slate-900">{state.matches.filter((match) => match.status === 'suggested' || match.status === 'worker_accepted').length} รายการ</p></div></div>}</div>
    {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-[12px] bg-hope-50 p-4 font-semibold text-hope-700"><CheckCircle2 size={19}/>{notice}</p>}

    {role === 'employer' && <label className="mt-6 grid max-w-xl gap-2 text-sm font-bold text-slate-800">เลือกตำแหน่งงาน<select value={jobId} onChange={(event) => setJobId(event.target.value)} className="min-h-12 rounded-[12px] border border-slate-300 bg-white px-4 text-base focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100">{state.jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.location}</option>)}</select></label>}

    <div className="mt-7 space-y-4">
      {role === 'employer' ? ranked.map(({ resident, score, matchedSkills }) => {
        const match = state.matches.find((item) => item.jobId === jobId && item.residentId === resident.id);
        const approved = match?.status === 'shelter_approved';
        return <article key={resident.id} className="overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]"><div className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold text-slate-950">{approved ? resident.name : `ผู้สมัคร #${resident.id.slice(-4)}`}</h2><span className="rounded-full bg-opportunity-50 px-3 py-1 text-sm font-extrabold text-opportunity-700">เหมาะสม {score}%</span>{match && <span className={`rounded-full px-3 py-1 text-sm font-bold ${STATUS[match.status].className}`}>{STATUS[match.status].label}</span>}</div><p className="mt-3 text-sm text-slate-600"><span className="font-bold text-slate-800">ทักษะที่ตรงกัน:</span> {matchedSkills.length ? matchedSkills.join(' · ') : 'พิจารณาจากความพร้อมโดยรวม'}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-1.5"><UserCheck size={16} className="text-brand-600"/><span className="font-semibold text-slate-800">อายุ</span> {resident.age} ปี</span><span><span className="font-semibold text-slate-800">เพศ</span> {resident.gender === 'male' ? 'ชาย' : resident.gender === 'female' ? 'หญิง' : resident.gender === 'non_binary' ? 'นอนไบนารี' : resident.gender === 'other' ? 'อื่น ๆ' : resident.gender === 'prefer_not_to_say' ? 'ไม่ประสงค์ระบุ' : 'ยังไม่ระบุ'}</span><span className="flex items-center gap-1.5"><CalendarDays size={16} className="text-opportunity-700"/><span className="font-semibold text-slate-800">ความพร้อม</span> {resident.availableDays?.length ? resident.availableDays.join(', ') : resident.availability}{resident.availableFrom && resident.availableTo ? ' · '+resident.availableFrom+'–'+resident.availableTo+' น.' : ''}</span></div>{match && <MatchProgress status={match.status}/>}</div><div className="flex shrink-0 items-center">{!match ? <Button onClick={() => suggest(resident, score)}><Send size={17}/>แนะนำงานนี้</Button> : match.status === 'suggested' || match.status === 'worker_accepted' ? <span className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"><Clock3 size={17}/>กำลังรอขั้นตอนถัดไป</span> : approved ? <Button variant="secondary" onClick={() => setExpandedResidentId(resident.id)}><Eye size={18}/>ดูโปรไฟล์เพิ่มเติม</Button> : null}</div></div></div>
        </article>;
      }) : state.matches.length ? state.matches.map((match) => {
        const resident = state.residents.find((item) => item.id === match.residentId);
        const job = state.jobs.find((item) => item.id === match.jobId);
        if (!resident || !job) return null;
        const actionable = match.status === 'suggested' || match.status === 'worker_accepted';
        return <article key={match.id} className="overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] transition-shadow duration-200 hover:shadow-[0_5px_8px_oklch(21%_0.025_255_/_0.10)]"><div className="grid md:grid-cols-[minmax(0,1fr)_17rem]"><div className="min-w-0 p-5 sm:p-6"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-opportunity-100 text-lg font-extrabold text-brand-700">{resident.name.charAt(0)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold text-slate-950">{resident.name}</h2><span className="rounded-full bg-opportunity-50 px-3 py-1 text-sm font-extrabold text-opportunity-700">เหมาะสม {match.score}%</span></div><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${STATUS[match.status].className}`}>{STATUS[match.status].label}</span></div></div><div className="mt-5 rounded-[12px] bg-slate-50 p-4"><p className="font-bold text-slate-900">{job.title}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-1.5"><MapPin size={16} className="text-brand-600"/>{job.location}</span><span className="flex items-center gap-1.5"><Banknote size={16} className="text-opportunity-700"/>{job.dailyWage.toLocaleString('th-TH')} บาท/วัน</span></div></div><MatchProgress status={match.status}/></div>
          {actionable ? <aside aria-label="การดำเนินการ" className="flex flex-col justify-center bg-slate-50 p-5 md:border-l md:border-slate-100"><p className="text-sm font-extrabold text-slate-900">{match.status === 'suggested' ? 'บันทึกคำตอบผู้เข้าร่วม' : 'ตรวจสอบและอนุมัติ'}</p><p className="mt-1 text-xs leading-5 text-slate-600">{match.status === 'suggested' ? 'ยืนยันคำตอบหลังพูดคุยกับผู้เข้าร่วมแล้ว' : 'การอนุมัติจะเปิดเผยข้อมูลเพิ่มเติมแก่นายจ้าง'}</p><div className="mt-4 grid gap-2">{match.status === 'suggested' && <><Button className="w-full" onClick={() => requestStatus(match, resident, job, 'worker_accepted')}><UserCheck size={17}/>ผู้เข้าร่วมสนใจ</Button><button type="button" onClick={() => requestStatus(match, resident, job, 'worker_declined')} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-100"><XCircle size={17}/>ผู้เข้าร่วมปฏิเสธ</button></>}{match.status === 'worker_accepted' && <><Button className="w-full" onClick={() => requestStatus(match, resident, job, 'shelter_approved')}><ShieldCheck size={17}/>อนุมัติการจับคู่</Button><button type="button" onClick={() => requestStatus(match, resident, job, 'shelter_declined')} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-100"><XCircle size={17}/>ไม่อนุมัติ</button></>}</div></aside> : <aside className={`flex items-center justify-center p-5 md:border-l md:border-slate-100 ${match.status === 'shelter_approved' ? 'bg-hope-50' : 'bg-slate-50'}`}><div className="text-center"><span className={`mx-auto grid h-11 w-11 place-items-center rounded-full ${match.status === 'shelter_approved' ? 'bg-hope-100 text-hope-700' : 'bg-slate-200 text-slate-600'}`}>{match.status === 'shelter_approved' ? <CheckCircle2/> : <XCircle/>}</span><p className="mt-2 text-sm font-bold text-slate-800">ดำเนินการเรียบร้อย</p></div></aside>}
        </div></article>;
      }) : <div className="rounded-[16px] bg-white p-10 text-center"><h2 className="font-bold text-slate-950">ยังไม่มีข้อเสนองาน</h2><p className="mt-1 text-slate-600">ข้อเสนอจากนายจ้างจะแสดงที่นี่เพื่อบันทึกคำตอบของผู้เข้าร่วม</p></div>}
    </div>

    {expandedResident && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedResidentId(null); }}><section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"><header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7"><div><p className="flex items-center gap-2 text-sm font-bold text-hope-700"><ShieldCheck size={17}/>ศูนย์พักพิงอนุมัติแล้ว</p><h2 id="profile-title" className="mt-1 text-2xl font-extrabold text-slate-950">โปรไฟล์ผู้สมัคร</h2></div><button type="button" aria-label="ปิดโปรไฟล์" onClick={() => setExpandedResidentId(null)} className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-brand-100" autoFocus><X/></button></header><div className="min-h-0 overflow-y-auto p-5 sm:p-7"><div className="grid gap-7 md:grid-cols-[13rem_minmax(0,1fr)]"><div>{expandedResident.photoUrl ? <Image src={expandedResident.photoUrl} alt={`รูปโปรไฟล์ของ ${expandedResident.name}`} width={416} height={416} className="aspect-square w-full rounded-[14px] object-cover"/> : <span className="grid aspect-square w-full place-items-center rounded-[14px] bg-brand-100 text-5xl font-extrabold text-brand-700">{expandedResident.name.charAt(0)}</span>}<h3 className="mt-4 text-center text-xl font-extrabold text-slate-950">{expandedResident.name}</h3><p className="mt-1 text-center text-sm font-semibold text-slate-500">ผู้สมัคร #{expandedResident.id.slice(-4)}</p></div><div><h3 className="text-lg font-extrabold text-slate-950">ข้อมูลสำหรับประสานงาน</h3><p className="mt-1 text-sm text-slate-600">ตรวจสอบความพร้อมก่อนนัดหมายขั้นตอนถัดไป</p><dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-[12px] bg-slate-50 p-4"><dt className="text-sm font-semibold text-slate-500">อายุ</dt><dd className="mt-1 font-bold text-slate-900">{expandedResident.age} ปี</dd></div><div className="rounded-[12px] bg-slate-50 p-4"><dt className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"><CalendarDays size={15}/>เวลาที่พร้อม</dt><dd className="mt-1 font-bold text-slate-900">{expandedResident.availability}</dd></div><div className="rounded-[12px] bg-slate-50 p-4"><dt className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"><CreditCard size={15}/>สถานะบัตรประชาชน</dt><dd className="mt-1 font-bold text-slate-900">{expandedResident.idCardStatus === 'has_card' ? 'มีบัตรประชาชน' : expandedResident.idCardStatus === 'in_progress' ? 'อยู่ระหว่างดำเนินการ' : expandedResident.idCardStatus === 'needs_support' ? 'ต้องการความช่วยเหลือ' : expandedResident.idCardStatus === 'not_started' ? 'ยังไม่ได้เริ่มดำเนินการ' : 'ยังไม่ระบุ'}</dd></div><div className="rounded-[12px] bg-slate-50 p-4"><dt className="text-sm font-semibold text-slate-500">ทักษะทั้งหมด</dt><dd className="mt-2 flex flex-wrap gap-1.5">{expandedResident.skills.map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{skill}</span>)}</dd></div></dl><div className="mt-3 rounded-[12px] bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-500">ข้อมูลที่ช่วยในการสนับสนุน</p><p className="mt-1 leading-7 text-slate-800">{expandedResident.notes || 'ไม่มีข้อมูลเพิ่มเติม'}</p><section className="mt-4 rounded-[12px] bg-brand-50 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-700"><Building2 size={20}/></span><div><p className="text-sm font-semibold text-brand-700">ศูนย์พักพิงที่ดูแลผู้สมัคร</p><h4 className="mt-0.5 font-extrabold text-slate-950">{expandedShelter?.name ?? 'ไม่พบข้อมูลศูนย์พักพิง'}</h4>{expandedShelter?.address && <p className="mt-1 text-sm text-slate-600">{expandedShelter.address}</p>}</div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{expandedShelter?.phone ? <a href={'tel:'+expandedShelter.phone} className="flex min-h-12 items-center gap-3 rounded-[10px] bg-white px-4 font-bold text-brand-700 hover:bg-brand-100"><Phone size={18}/><span><span className="block text-xs font-semibold text-slate-500">สอบถามข้อมูล</span>{expandedShelter.phone}</span></a> : <p className="rounded-[10px] bg-white p-3 text-sm text-slate-500">ยังไม่มีเบอร์สอบถามข้อมูล</p>}{expandedShelter?.emergencyPhone ? <a href={'tel:'+expandedShelter.emergencyPhone} className="flex min-h-12 items-center gap-3 rounded-[10px] bg-white px-4 font-bold text-red-700 hover:bg-red-50"><Siren size={18}/><span><span className="block text-xs font-semibold text-slate-500">กรณีเร่งด่วน</span>{expandedShelter.emergencyPhone}</span></a> : <p className="rounded-[10px] bg-white p-3 text-sm text-slate-500">ยังไม่มีเบอร์กรณีเร่งด่วน</p>}</div></section></div></div></div></div><footer className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 sm:px-7"><Button onClick={() => setExpandedResidentId(null)}>ปิดโปรไฟล์</Button></footer></section></div>, document.body)}

    {action && createPortal(<div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setAction(null); }}><section role="dialog" aria-modal="true" aria-labelledby="action-title" aria-describedby="action-description" className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl sm:p-7"><div className="flex justify-between gap-4"><span className={`grid h-12 w-12 place-items-center rounded-full ${action.tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'}`}>{action.tone === 'danger' ? <XCircle/> : <CheckCircle2/>}</span><button type="button" aria-label="ปิดหน้าต่าง" onClick={() => setAction(null)} className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100"><X/></button></div><h2 id="action-title" className="mt-5 text-2xl font-extrabold text-slate-950">{action.title}</h2><p id="action-description" className="mt-2 leading-7 text-slate-600">{action.description}</p><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setAction(null)} disabled={saving}>ยกเลิก</Button><Button variant={action.tone} onClick={confirmAction} disabled={saving} autoFocus>{saving ? 'กำลังบันทึก…' : action.confirmLabel}</Button></div></section></div>, document.body)}
  </div>;
}
