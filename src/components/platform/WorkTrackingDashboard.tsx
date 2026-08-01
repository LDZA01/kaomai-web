'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  History,
  Phone,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import {
  getCaseManagers,
  getJobs,
  getMatchesForShelter,
  getResidents,
} from '@/lib/db';
import {
  addEmploymentCheckIn,
  endEmploymentTracking,
  getEmploymentCheckIns,
  getEmploymentTrackings,
  startEmploymentTracking,
} from '@/lib/employment-tracking-db';
import {
  getDefaultNextFollowUp,
  getTrackingUrgency,
  sortTrackingsByUrgency,
  validateEmploymentEnd,
} from '@/lib/employment-tracking';
import type {
  CaseManager,
  EmploymentCadence,
  EmploymentCheckIn,
  EmploymentEndReason,
  EmploymentSupportState,
  EmploymentTracking,
  Job,
  JobMatch,
  Resident,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';

type PageData = {
  residents: Resident[];
  jobs: Job[];
  matches: JobMatch[];
  managers: CaseManager[];
  trackings: EmploymentTracking[];
};

const URGENCY_COPY = {
  urgent: { label: 'ต้องช่วยเหลือเร่งด่วน', className: 'bg-red-50 text-red-700' },
  overdue: { label: 'เกินกำหนดติดตาม', className: 'bg-amber-50 text-amber-900' },
  due_today: { label: 'ติดตามวันนี้', className: 'bg-brand-50 text-brand-700' },
  upcoming: { label: 'นัดติดตามแล้ว', className: 'bg-slate-100 text-slate-700' },
} as const;

const SUPPORT_COPY: Record<EmploymentSupportState, string> = {
  good: 'ปรับตัวได้ดี',
  needs_support: 'ต้องการการสนับสนุน',
  urgent: 'ต้องช่วยเหลือเร่งด่วน',
};

const ATTENDANCE_COPY: Record<EmploymentCheckIn['attendance'], string> = {
  normal: 'มาทำงานตามปกติ',
  absent: 'ขาดงาน',
  late: 'มาสาย',
};

const END_REASONS: Array<[EmploymentEndReason, string]> = [
  ['contract_completed', 'สิ้นสุดสัญญาตามกำหนด'],
  ['resigned', 'ผู้เข้าร่วมลาออก'],
  ['employer_ended', 'นายจ้างยุติการจ้าง'],
  ['health_or_personal', 'เหตุผลด้านสุขภาพหรือส่วนตัว'],
  ['lost_contact', 'ไม่สามารถติดต่อได้'],
  ['other', 'เหตุผลอื่น ๆ'],
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function thaiDate(value?: string) {
  if (!value) return 'ยังไม่มีข้อมูล';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function WorkTrackingDashboard() {
  const { org } = useAuthContext();
  const shelterId = org.shelter?.id ?? '';
  const today = todayValue();
  const [data, setData] = useState<PageData | null>(null);
  const [pageError, setPageError] = useState('');
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [managerFilter, setManagerFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [checkIns, setCheckIns] = useState<EmploymentCheckIn[]>([]);
  const [dialog, setDialog] = useState<'check-in' | 'end' | 'start' | null>(null);
  const [dialogError, setDialogError] = useState('');
  const [busy, setBusy] = useState(false);
  const [startMatchId, setStartMatchId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [startCadence, setStartCadence] = useState<EmploymentCadence>('fortnightly');
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkInCadence, setCheckInCadence] = useState<EmploymentCadence>('fortnightly');
  const [checkInNextDate, setCheckInNextDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [endReason, setEndReason] = useState<EmploymentEndReason | ''>('');
  const [endNote, setEndNote] = useState('');
  const [returnToMatching, setReturnToMatching] = useState(false);
  const [endConfirmed, setEndConfirmed] = useState(false);

  useEffect(() => {
    if (!shelterId) return;
    let active = true;
    Promise.all([
      getResidents(shelterId),
      getJobs(),
      getMatchesForShelter(shelterId),
      getCaseManagers(shelterId).catch(() => []),
      getEmploymentTrackings(shelterId),
    ])
      .then(([residents, jobs, matches, managers, trackings]) => {
        if (!active) return;
        setData({ residents, jobs, matches, managers, trackings });
        const firstActive = sortTrackingsByUrgency(
          trackings.filter((tracking) => tracking.status === 'active'),
          today,
        )[0];
        setSelectedId(firstActive?.id ?? trackings[0]?.id ?? '');
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : '';
        if (message.includes('employment_trackings') || message.includes('schema cache')) {
          setMigrationMissing(true);
        } else {
          setPageError('ไม่สามารถโหลดข้อมูลติดตามการทำงานได้ โปรดลองอีกครั้ง');
        }
      });
    return () => {
      active = false;
    };
  }, [shelterId, today]);

  useEffect(() => {
    if (!selectedId) {
      setCheckIns([]);
      return;
    }
    getEmploymentCheckIns(selectedId)
      .then(setCheckIns)
      .catch(() => setCheckIns([]));
  }, [selectedId]);

  const activeTrackings = data?.trackings.filter((tracking) => tracking.status === 'active') ?? [];
  const approvedUntracked = useMemo(() => {
    if (!data) return [];
    const trackedMatchIds = new Set(data.trackings.map((tracking) => tracking.matchId));
    return data.matches.filter(
      (match) => match.status === 'shelter_approved' && !trackedMatchIds.has(match.id),
    );
  }, [data]);
  const visibleTrackings = useMemo(() => {
    if (!data) return [];
    let trackings = data.trackings.filter((tracking) => {
      if (statusFilter === 'active') return tracking.status === 'active';
      if (statusFilter === 'ended') return tracking.status === 'ended';
      if (statusFilter === 'due') {
        const urgency = getTrackingUrgency(tracking.nextFollowUpAt, tracking.supportState, today);
        return tracking.status === 'active' && (urgency === 'due_today' || urgency === 'overdue');
      }
      if (statusFilter === 'urgent') return tracking.status === 'active' && tracking.supportState === 'urgent';
      return true;
    });
    if (managerFilter !== 'all') {
      trackings = trackings.filter((tracking) =>
        managerFilter === 'unassigned'
          ? !tracking.caseManagerId
          : tracking.caseManagerId === managerFilter,
      );
    }
    return sortTrackingsByUrgency(trackings, today);
  }, [data, managerFilter, statusFilter, today]);

  const selected = data?.trackings.find((tracking) => tracking.id === selectedId);
  const selectedResident = data?.residents.find((resident) => resident.id === selected?.residentId);
  const selectedJob = data?.jobs.find((job) => job.id === selected?.jobId);
  const selectedManager = data?.managers.find((manager) => manager.id === selected?.caseManagerId);
  const dueToday = activeTrackings.filter((tracking) => tracking.nextFollowUpAt === today).length;
  const overdue = activeTrackings.filter((tracking) => tracking.nextFollowUpAt < today).length;
  const needsSupport = activeTrackings.filter((tracking) => tracking.supportState !== 'good').length;

  function residentFor(tracking: EmploymentTracking) {
    return data?.residents.find((resident) => resident.id === tracking.residentId);
  }
  function jobFor(tracking: EmploymentTracking) {
    return data?.jobs.find((job) => job.id === tracking.jobId);
  }
  function managerFor(tracking: EmploymentTracking) {
    return data?.managers.find((manager) => manager.id === tracking.caseManagerId);
  }

  function openCheckIn(tracking: EmploymentTracking) {
    setSelectedId(tracking.id);
    setCheckInDate(today);
    setCheckInCadence(tracking.cadence);
    setCheckInNextDate(
      getDefaultNextFollowUp(tracking.startedAt, today, tracking.cadence),
    );
    setDialogError('');
    setDialog('check-in');
  }

  function openEnd(tracking: EmploymentTracking) {
    setSelectedId(tracking.id);
    setEndDate(today);
    setEndReason('');
    setEndNote('');
    setReturnToMatching(false);
    setEndConfirmed(false);
    setDialogError('');
    setDialog('end');
  }

  async function saveStart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || !startMatchId) {
      setDialogError('กรุณาเลือกผู้เข้าร่วมที่เริ่มทำงาน');
      return;
    }
    const match = data.matches.find((item) => item.id === startMatchId);
    const resident = data.residents.find((item) => item.id === match?.residentId);
    if (!match || !resident) return;
    setBusy(true);
    setDialogError('');
    try {
      const tracking = await startEmploymentTracking({
        matchId: match.id,
        residentId: resident.id,
        jobId: match.jobId,
        shelterId,
        caseManagerId: resident.caseManagerId,
        startedAt: startDate,
        cadence: startCadence,
        nextFollowUpAt: startDate,
      });
      setData((current) => current ? { ...current, trackings: [tracking, ...current.trackings] } : current);
      setSelectedId(tracking.id);
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'ไม่สามารถเริ่มติดตามงานได้');
    } finally {
      setBusy(false);
    }
  }

  async function saveCheckIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setDialogError('');
    try {
      const result = await addEmploymentCheckIn({
        employmentTrackingId: selected.id,
        checkInDate,
        attendance: String(form.get('attendance')) as EmploymentCheckIn['attendance'],
        adjustment: String(form.get('adjustment')) as EmploymentSupportState,
        participantFeedback: String(form.get('participantFeedback') ?? ''),
        employerFeedback: String(form.get('employerFeedback') ?? ''),
        privateNote: String(form.get('privateNote') ?? ''),
        nextFollowUpAt: checkInNextDate,
      }, checkInCadence);
      setData((current) => current ? {
        ...current,
        trackings: current.trackings.map((tracking) =>
          tracking.id === result.tracking.id
            ? result.tracking
            : tracking,
        ),
      } : current);
      setCheckIns((current) => [result.checkIn, ...current]);
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการติดตามได้');
    } finally {
      setBusy(false);
    }
  }

  async function saveEnd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const validationError = validateEmploymentEnd({
      endedAt: endDate,
      endReason,
      finalNote: endNote,
      confirmed: endConfirmed,
    });
    if (validationError) {
      setDialogError(validationError);
      return;
    }
    setBusy(true);
    setDialogError('');
    try {
      const updated = await endEmploymentTracking(selected.id, {
        endedAt: endDate,
        endReason: endReason as EmploymentEndReason,
        finalNote: endNote,
        returnToMatching,
      });
      setData((current) => current ? {
        ...current,
        trackings: current.trackings.map((tracking) =>
          tracking.id === updated.id ? updated : tracking,
        ),
      } : current);
      setStatusFilter('ended');
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'ไม่สามารถยุติการทำงานได้');
    } finally {
      setBusy(false);
    }
  }

  if (migrationMissing) {
    return (
      <div className="page-enter">
        <h1 className="text-3xl font-extrabold text-slate-950">ติดตามการทำงาน</h1>
        <div className="mt-7 rounded-[16px] bg-white p-8 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
          <AlertTriangle className="text-amber-700" size={34}/>
          <h2 className="mt-4 text-xl font-bold text-slate-950">ยังไม่ได้ติดตั้งฐานข้อมูลติดตามการทำงาน</h2>
          <p className="mt-2 max-w-2xl text-slate-700">รันไฟล์ migration 016_employment_tracking.sql ใน Supabase แล้วเปิดหน้านี้อีกครั้ง หน้าอื่นของระบบยังใช้งานได้ตามปกติ</p>
        </div>
      </div>
    );
  }

  const summary = [
    ['ติดตามวันนี้', data ? dueToday : undefined, CalendarCheck2, 'bg-brand-50 text-brand-700'],
    ['เกินกำหนด', data ? overdue : undefined, Clock3, 'bg-amber-50 text-amber-800'],
    ['กำลังทำงาน', data ? activeTrackings.length : undefined, BriefcaseBusiness, 'bg-cyan-50 text-cyan-800'],
    ['ต้องการความช่วยเหลือ', data ? needsSupport : undefined, AlertTriangle, 'bg-red-50 text-red-700'],
  ] as const;

  return (
    <div className="page-enter overflow-x-hidden">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <p className="font-bold text-brand-700">{org.shelter?.name ?? 'ศูนย์คนไร้บ้าน'}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950">ติดตามการทำงาน</h1>
          <p className="mt-2 text-slate-700">ติดตามช่วงเริ่มงาน บันทึกการปรับตัว และวางแผนช่วยเหลืออย่างต่อเนื่อง</p>
        </div>
        <Button onClick={() => { setStartMatchId(approvedUntracked[0]?.id ?? ''); setDialogError(''); setDialog('start'); }} disabled={approvedUntracked.length === 0}>
          <Plus size={17}/> เริ่มติดตามงาน
        </Button>
      </header>

      {pageError && <p role="alert" className="mt-6 rounded-[12px] bg-red-50 p-4 font-semibold text-red-800">{pageError}</p>}

      <section aria-label="สรุปการติดตามงาน" className="mt-7 grid gap-px overflow-hidden rounded-[16px] bg-slate-200 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(([label, value, Icon, color]) => (
          <div key={label} className="bg-white p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-[12px] ${color}`}><Icon size={20}/></span>
            {value === undefined ? <div className="mt-5 h-8 w-16 animate-pulse rounded bg-slate-100"/> : <p className="mt-5 text-2xl font-extrabold tabular-nums text-slate-950">{value} <span className="text-sm font-semibold text-slate-600">รายการ</span></p>}
            <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
          </div>
        ))}
      </section>

      <div className="mt-7 flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1 text-sm font-semibold text-slate-800">สถานะ
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3">
            <option value="active">กำลังทำงาน</option><option value="due">ถึงกำหนด/เกินกำหนด</option><option value="urgent">เร่งด่วน</option><option value="ended">สิ้นสุดแล้ว</option><option value="all">ทั้งหมด</option>
          </select>
        </label>
        <label className="grid flex-1 gap-1 text-sm font-semibold text-slate-800">ผู้จัดการรายกรณี
          <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)} className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3">
            <option value="all">ทั้งหมด</option><option value="unassigned">ยังไม่ได้มอบหมาย</option>
            {data?.managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)]">
        <section aria-labelledby="tracking-queue-heading" className="overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
          <div className="border-b border-slate-100 p-5 sm:p-6"><h2 id="tracking-queue-heading" className="text-xl font-bold text-slate-950">คิวติดตาม</h2><p className="mt-1 text-sm text-slate-600">เรียงจากรายการที่ต้องดูแลเร่งด่วนที่สุด</p></div>
          {!data ? <div className="space-y-3 p-5">{[1,2,3].map((item)=><div key={item} className="h-28 animate-pulse rounded-[12px] bg-slate-100"/>)}</div> :
          visibleTrackings.length === 0 ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto text-green-700" size={34}/><h3 className="mt-3 font-bold text-slate-950">ไม่มีรายการในตัวกรองนี้</h3><p className="mt-1 text-sm text-slate-600">ลองเลือกสถานะหรือผู้จัดการรายกรณีอื่น</p></div> :
          <div className="divide-y divide-slate-100">{visibleTrackings.map((tracking)=>{
            const resident=residentFor(tracking); const job=jobFor(tracking); const manager=managerFor(tracking); const urgency=getTrackingUrgency(tracking.nextFollowUpAt,tracking.supportState,today); const urgencyCopy=URGENCY_COPY[urgency];
            return <article key={tracking.id} className={`p-5 sm:p-6 ${selectedId===tracking.id?'bg-brand-50/50':''}`}>
              <button type="button" onClick={()=>setSelectedId(tracking.id)} className="w-full text-left">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold text-slate-950">{resident?.name??'ผู้เข้าร่วม'}</h3><p className="mt-1 text-sm font-semibold text-brand-700">{job?.title??'ตำแหน่งงาน'}</p><p className="mt-1 text-sm text-slate-600">{manager?.name??'ยังไม่ได้มอบหมายผู้จัดการ'} · เริ่ม {thaiDate(tracking.startedAt)}</p></div><span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${tracking.status==='ended'?'bg-slate-100 text-slate-700':urgencyCopy.className}`}>{tracking.status==='ended'?'สิ้นสุดการทำงานแล้ว':urgencyCopy.label}</span></div>
                <p className="mt-3 text-sm text-slate-700">ติดตามครั้งถัดไป: <strong>{thaiDate(tracking.nextFollowUpAt)}</strong> · {SUPPORT_COPY[tracking.supportState]}</p>
              </button>
              {tracking.status==='active'&&<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={()=>openCheckIn(tracking)}>บันทึกติดตาม</Button><Button size="sm" variant="secondary" onClick={()=>openEnd(tracking)}>ยุติการทำงาน</Button></div>}
            </article>})}</div>}
        </section>

        <aside aria-labelledby="history-heading" className="self-start overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] xl:sticky xl:top-24">
          <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-center gap-2"><History className="text-brand-700" size={20}/><h2 id="history-heading" className="text-xl font-bold text-slate-950">ประวัติการติดตาม</h2></div>{selected&&<p className="mt-2 font-semibold text-slate-700">{selectedResident?.name} · {selectedJob?.title}</p>}</div>
          {!selected ? <div className="p-8 text-center text-sm text-slate-600">เลือกรายการจากคิวเพื่อดูประวัติ</div> :
          <div><div className="border-b border-slate-100 p-5 text-sm text-slate-700"><p>ผู้รับผิดชอบ: <strong>{selectedManager?.name??'ยังไม่ได้มอบหมาย'}</strong></p>{selectedManager&&<a href={`tel:${selectedManager.phone}`} className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold text-brand-700"><Phone size={16}/>{selectedManager.phone}</a>}{selected.status==='ended'&&<div className="mt-3 rounded-[10px] bg-slate-50 p-3"><p className="font-bold">สิ้นสุด {thaiDate(selected.endedAt)}</p><p className="mt-1">{selected.finalNote}</p>{selected.returnToMatching&&<p className="mt-2 font-semibold text-brand-700">กลับเข้าสู่กระบวนการหางาน</p>}</div>}</div>
          {checkIns.length===0?<div className="p-8 text-center text-sm text-slate-600">ยังไม่มีบันทึกการติดตาม</div>:<ol className="divide-y divide-slate-100">{checkIns.map((checkIn)=><li key={checkIn.id} className="p-5"><p className="font-bold text-slate-950">{thaiDate(checkIn.checkInDate)}</p><p className="mt-1 text-sm text-slate-700">{ATTENDANCE_COPY[checkIn.attendance]} · {SUPPORT_COPY[checkIn.adjustment]}</p>{checkIn.participantFeedback&&<p className="mt-3 text-sm text-slate-700"><strong>ผู้เข้าร่วม:</strong> {checkIn.participantFeedback}</p>}{checkIn.employerFeedback&&<p className="mt-2 text-sm text-slate-700"><strong>นายจ้าง:</strong> {checkIn.employerFeedback}</p>}{checkIn.privateNote&&<p className="mt-2 rounded-[9px] bg-brand-50 p-2 text-sm text-brand-900"><strong>บันทึกภายใน:</strong> {checkIn.privateNote}</p>}</li>)}</ol>}</div>}
        </aside>
      </div>

      <p className="mt-6 text-sm text-slate-600">ต้องการแก้ไขผู้จัดการรายกรณี? <Link href="/shelter/residents" className="font-bold text-brand-700 hover:underline">ไปหน้าผู้เข้าร่วม <ArrowRight className="inline" size={14}/></Link></p>

      {dialog&&createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={()=>setDialog(null)}><section role="dialog" aria-modal="true" aria-labelledby="tracking-dialog-title" onMouseDown={(event)=>event.stopPropagation()} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 p-5 sm:px-6"><div><h2 id="tracking-dialog-title" className="text-xl font-bold text-slate-950">{dialog==='check-in'?'บันทึกการติดตาม':dialog==='end'?'ยุติการทำงาน':'เริ่มติดตามการทำงาน'}</h2><p className="mt-1 text-sm text-slate-600">{dialog==='end'?'ข้อมูลจะถูกเก็บไว้ในประวัติและไม่ถูกลบ':'บันทึกข้อมูลที่จำเป็นสำหรับการดูแลต่อเนื่อง'}</p></div><button type="button" aria-label="ปิดหน้าต่าง" onClick={()=>setDialog(null)} className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-700 hover:bg-slate-100"><X/></button></div>
        {dialog==='start'?<form onSubmit={saveStart} className="flex min-h-0 flex-1 flex-col"><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 sm:p-6"><label className="grid gap-1.5 text-sm font-semibold text-slate-800">ผู้เข้าร่วมและตำแหน่งงาน<select value={startMatchId} onChange={(event)=>setStartMatchId(event.target.value)} required className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3"><option value="">เลือกรายการ</option>{approvedUntracked.map((match)=>{const resident=data?.residents.find((item)=>item.id===match.residentId);const job=data?.jobs.find((item)=>item.id===match.jobId);return <option key={match.id} value={match.id}>{resident?.name} · {job?.title}</option>})}</select></label><Field name="startDate" label="วันเริ่มงาน" type="date" value={startDate} onChange={(event)=>setStartDate(event.target.value)} required/><label className="grid gap-1.5 text-sm font-semibold text-slate-800">หลังสัปดาห์แรกติดตาม<select value={startCadence} onChange={(event)=>setStartCadence(event.target.value as EmploymentCadence)} className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3"><option value="fortnightly">ทุก 2 สัปดาห์</option><option value="monthly">ทุกเดือน</option></select></label>{dialogError&&<p role="alert" className="rounded-[10px] bg-red-50 p-3 text-sm font-semibold text-red-700">{dialogError}</p>}</div><div className="flex justify-end gap-2 border-t border-slate-200 p-4 sm:px-6"><Button type="button" variant="ghost" onClick={()=>setDialog(null)}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy?'กำลังบันทึก…':'เริ่มติดตาม'}</Button></div></form>:
        dialog==='check-in'?<form onSubmit={saveCheckIn} className="flex min-h-0 flex-1 flex-col"><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6"><Field name="checkInDate" label="วันที่ติดตาม" type="date" value={checkInDate} onChange={(event)=>{const value=event.target.value;setCheckInDate(value);if(selected)setCheckInNextDate(getDefaultNextFollowUp(selected.startedAt,value,checkInCadence))}} required/><label className="grid gap-1.5 text-sm font-semibold text-slate-800">ความถี่หลังสัปดาห์แรก<select value={checkInCadence} onChange={(event)=>{const cadence=event.target.value as EmploymentCadence;setCheckInCadence(cadence);if(selected)setCheckInNextDate(getDefaultNextFollowUp(selected.startedAt,checkInDate,cadence))}} className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3"><option value="fortnightly">ทุก 2 สัปดาห์</option><option value="monthly">ทุกเดือน</option></select></label><fieldset><legend className="text-sm font-semibold text-slate-800">การมาทำงาน</legend><div className="mt-2 grid gap-2">{([['normal','ปกติ'],['late','มาสาย'],['absent','ขาดงาน']] as const).map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-slate-300 px-3"><input type="radio" name="attendance" value={value} defaultChecked={value==='normal'} required className="h-5 w-5 accent-brand-600"/>{label}</label>)}</div></fieldset><fieldset><legend className="text-sm font-semibold text-slate-800">การปรับตัวกับงาน</legend><div className="mt-2 grid gap-2">{([['good','ปรับตัวได้ดี'],['needs_support','ต้องการการสนับสนุน'],['urgent','เร่งด่วน']] as const).map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-slate-300 px-3"><input type="radio" name="adjustment" value={value} defaultChecked={value===selected?.supportState} required className="h-5 w-5 accent-brand-600"/>{label}</label>)}</div></fieldset><TextareaField name="participantFeedback" label="ความคิดเห็นจากผู้เข้าร่วม" placeholder="สิ่งที่ทำได้ดีหรือปัญหาที่พบ"/><TextareaField name="employerFeedback" label="ความคิดเห็นจากนายจ้าง" placeholder="ผลงาน การปรับตัว หรือสิ่งที่ควรช่วยเหลือ"/><div className="sm:col-span-2"><TextareaField name="privateNote" label="บันทึกภายในของผู้จัดการรายกรณี" placeholder="ข้อมูลสำหรับทีมศูนย์เท่านั้น"/></div><Field name="nextFollowUpAt" label="ติดตามครั้งถัดไป" type="date" value={checkInNextDate} onChange={(event)=>setCheckInNextDate(event.target.value)} required className="sm:col-span-2"/>{dialogError&&<p role="alert" className="sm:col-span-2 rounded-[10px] bg-red-50 p-3 text-sm font-semibold text-red-700">{dialogError}</p>}</div><div className="flex justify-end gap-2 border-t border-slate-200 p-4 sm:px-6"><Button type="button" variant="ghost" onClick={()=>setDialog(null)}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกการติดตาม'}</Button></div></form>:
        <form onSubmit={saveEnd} className="flex min-h-0 flex-1 flex-col"><div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 sm:p-6"><Field name="endedAt" label="วันทำงานวันสุดท้าย" type="date" value={endDate} onChange={(event)=>setEndDate(event.target.value)} required/><label className="grid gap-1.5 text-sm font-semibold text-slate-800">เหตุผลที่ยุติการทำงาน<select value={endReason} onChange={(event)=>setEndReason(event.target.value as EmploymentEndReason)} required className="min-h-11 rounded-[12px] border border-slate-300 bg-white px-3"><option value="">เลือกเหตุผล</option>{END_REASONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><TextareaField name="finalNote" label="สรุปก่อนยุติการทำงาน" value={endNote} onChange={(event)=>setEndNote(event.target.value)} required placeholder="สรุปสถานการณ์ การสนับสนุนที่ผ่านมา และขั้นตอนถัดไป"/><label className="flex min-h-12 items-center gap-3 rounded-[12px] bg-brand-50 px-4 text-sm font-semibold text-brand-900"><input type="checkbox" checked={returnToMatching} onChange={(event)=>setReturnToMatching(event.target.checked)} className="h-5 w-5 accent-brand-600"/>กลับเข้าสู่กระบวนการหางาน</label><label className="flex min-h-12 items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900"><input type="checkbox" checked={endConfirmed} onChange={(event)=>setEndConfirmed(event.target.checked)} className="mt-0.5 h-5 w-5 accent-red-700"/>ฉันตรวจสอบข้อมูลแล้วและยืนยันการยุติการทำงาน รายการและประวัติจะยังคงถูกเก็บไว้</label>{dialogError&&<p role="alert" className="rounded-[10px] bg-red-100 p-3 text-sm font-semibold text-red-800">{dialogError}</p>}</div><div className="flex justify-end gap-2 border-t border-slate-200 p-4 sm:px-6"><Button type="button" variant="ghost" onClick={()=>setDialog(null)}>ยกเลิก</Button><Button type="submit" variant="danger" disabled={busy}>{busy?'กำลังบันทึก…':'ยืนยันยุติการทำงาน'}</Button></div></form>}
      </section></div>,document.body)}
    </div>
  );
}
