'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import {
  getAllResidents,
  getJobs,
  getMatchesForEmployer,
  getMatchesForShelter,
  getShelters,
  updateMatchStatus,
  upsertMatch,
} from '@/lib/db';
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
  suggested: { label: 'ยื่นข้อเสนอแล้ว · รอศูนย์สอบถามผู้สมัคร', className: 'bg-brand-50 text-brand-700', step: 1 },
  worker_accepted: { label: 'ผู้สมัครสนใจ · รอศูนย์คนไร้บ้านอนุมัติ', className: 'bg-amber-50 text-amber-800', step: 2 },
  worker_declined: { label: 'ผู้สมัครไม่สะดวกรับงาน', className: 'bg-slate-100 text-slate-700', step: 2 },
  shelter_approved: { label: 'ศูนย์อนุมัติแล้ว · พร้อมเริ่มงาน', className: 'bg-hope-100 text-hope-700', step: 3 },
  shelter_declined: { label: 'ศูนย์ไม่อนุมัติการจับคู่', className: 'bg-red-50 text-red-700', step: 3 },
};

function idCardBadge(status?: Resident['idCardStatus']) {
  if (status === 'has_card') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200"><CheckCircle2 size={13} />มีบัตรประชาชน</span>;
  }
  if (status === 'in_progress') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200"><Clock3 size={13} />อยู่ระหว่างทำบัตร</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"><CreditCard size={13} />ต้องการความช่วยเหลือบัตร</span>;
}

function MatchProgress({ status }: { status: JobMatch['status'] }) {
  const current = STATUS[status].step;
  const stopped = status === 'worker_declined' || status === 'shelter_declined';
  return (
    <ol aria-label="ขั้นตอนการจับคู่" className="mt-4 flex w-full text-xs font-semibold text-slate-500">
      {['1. ยื่นข้อเสนอ', '2. ผู้สมัครยินยอม', '3. ศูนย์อนุมัติ'].map((label, index) => {
        const reached = index + 1 <= current;
        const failed = stopped && index + 1 === current;
        const complete = index + 1 < current || status === 'shelter_approved';
        return (
          <li
            key={label}
            className="relative flex min-w-0 flex-1 flex-col items-start gap-1.5 pr-2 last:flex-none last:pr-0 sm:flex-row sm:items-center"
          >
            {index < 2 && (
              <span
                aria-hidden
                className={`absolute left-7 right-0 top-3 h-0.5 ${
                  index + 1 < current ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ring-4 ring-white ${
                failed
                  ? 'bg-red-100 text-red-700'
                  : reached
                  ? 'bg-brand-600 font-bold text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {complete ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={`relative z-10 truncate bg-white pr-2 text-[11px] leading-5 ${
                reached ? 'font-bold text-slate-800' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function MatchesBoard({ role }: { role: 'shelter' | 'employer' }) {
  const { org } = useAuthContext();
  const [state, setState] = useState<State | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'sent' | 'approved'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
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
    })();
  }, [role, org]);

  const activeJobs = state?.jobs ?? [];
  const primaryJob = activeJobs[0];

  // Ranked candidates for available jobs
  const ranked = useMemo(() => {
    if (!state) return [];
    if (primaryJob) {
      return rankResidentsForJob(primaryJob, state.residents);
    }
    return state.residents.map((resident) => ({
      resident,
      score: 85,
      matchedSkills: resident.skills,
    }));
  }, [primaryJob, state]);

  const expandedResident = state?.residents.find((resident) => resident.id === expandedResidentId);
  const expandedShelter = expandedResident
    ? state?.shelters.find((shelter) => shelter.id === expandedResident.shelterId)
    : undefined;

  async function confirmAction() {
    if (!action) return;
    setSaving(true);
    try {
      await action.run();
      setAction(null);
    } finally {
      setSaving(false);
    }
  }

  function updateLocal(id: string, status: JobMatch['status'], message: string) {
    setState((current) =>
      current
        ? {
            ...current,
            matches: current.matches.map((match) => (match.id === id ? { ...match, status } : match)),
          }
        : current,
    );
    setNotice(message);
  }

  function requestStatus(match: JobMatch, resident: Resident, job: Job, status: JobMatch['status']) {
    const accepting = status === 'shelter_approved' || status === 'worker_accepted';
    const copy =
      status === 'shelter_approved'
        ? [
            'ยืนยันอนุมัติการจับคู่นี้?',
            `เมื่ออนุมัติ นายจ้างจะสามารถดูข้อมูลติดต่อศูนย์พักพิงและโปรไฟล์ของ ${resident.name} เพื่อประสานงานเริ่มงานได้ทันที`,
            'อนุมัติการจับคู่และเปิดเผยข้อมูล',
          ]
        : [
            'ไม่อนุมัติการจับคู่นี้?',
            `ระบบจะบันทึกว่าศูนย์คนไร้บ้านไม่อนุมัติข้อเสนองานนี้ และจะไม่เปิดเผยข้อมูลเพิ่มเติม`,
            'ปฏิเสธข้อเสนองาน',
          ];

    setAction({
      title: copy[0],
      description: copy[1],
      confirmLabel: copy[2],
      tone: accepting ? 'primary' : 'danger',
      run: async () => {
        await updateMatchStatus(match.id, status);
        updateLocal(match.id, status, `อัปเดตสถานะของ ${resident.name} เรียบร้อยแล้ว`);
      },
    });
  }

  function suggest(resident: Resident, score: number) {
    if (!primaryJob) return;
    setAction({
      title: `ยื่นข้อเสนองานให้ ${resident.name}?`,
      description: `ส่งตำแหน่งงาน "${primaryJob.title}" (ตรงกัน ${score}%) ไปยังศูนย์คนไร้บ้าน เพื่อให้เจ้าหน้าที่สอบถามความสมัครใจของผู้สมัคร`,
      confirmLabel: 'ยืนยันยื่นข้อเสนองาน',
      tone: 'primary',
      run: async () => {
        const match = await upsertMatch({
          jobId: primaryJob.id,
          residentId: resident.id,
          score,
          status: 'suggested',
        });
        setState((current) =>
          current
            ? {
                ...current,
                matches: [
                  ...current.matches.filter(
                    (item) => !(item.jobId === match.jobId && item.residentId === match.residentId),
                  ),
                  match,
                ],
              }
            : current,
        );
        setNotice(`ยื่นข้อเสนองาน "${primaryJob.title}" ให้ ${resident.name} สำเร็จแล้ว! ศูนย์คนไร้บ้านจะดำเนินการติดต่อผู้สมัคร`);
      },
    });
  }

  if (!state)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-[16px] bg-white" />
        ))}
      </div>
    );

  const sentMatches = state.matches.filter(
    (m) => m.status === 'suggested' || m.status === 'worker_accepted',
  );
  const approvedMatches = state.matches.filter((m) => m.status === 'shelter_approved');

  // Filter candidates based on search query
  const filteredRanked = ranked.filter(({ resident }) =>
    `${resident.name} ${resident.skills.join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="page-enter">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 flex items-center gap-2 font-bold text-brand-600">
            <BriefcaseBusiness size={18} />
            {role === 'employer' ? 'ระบบคัดเลือกผู้สมัคร' : 'ระบบพิจารณาจับคู่สำหรับศูนย์คนไร้บ้าน'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-slate-950">
            {role === 'employer' ? 'รายชื่อผู้สมัครที่เหมาะสม' : 'พิจารณาอนุมัติข้อเสนองาน'}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {role === 'employer'
              ? 'รายชื่อคนไร้บ้านที่ผ่านการคัดกรองทักษะและความพร้อม สามารถกด "ยื่นข้อเสนองาน" เพื่อให้ศูนย์สอบถามความสมัครใจ'
              : 'พิจารณาข้อเสนอจากผู้จ้างงาน บันทึกคำตอบจากคนไร้บ้านในดูแล และอนุมัติการจับคู่'}
          </p>
        </div>

        {role === 'employer' && (
          <Link
            href="/employer/create-job"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-brand-600 px-5 font-bold text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] hover:bg-brand-700"
          >
            <PlusCircle size={18} /> ประกาศงานใหม่
          </Link>
        )}
      </div>

      {notice && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-[12px] bg-hope-50 p-4 font-semibold text-hope-700">
          <CheckCircle2 size={19} />
          {notice}
        </p>
      )}

      {/* ── EMPLOYER WORKFLOW VIEW ────────────────────────────────────────────── */}
      {role === 'employer' ? (
        <div className="mt-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('recommended')}
                className={`flex min-h-11 items-center gap-2 rounded-[12px] px-4 font-bold text-sm transition ${
                  activeTab === 'recommended'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles size={17} />
                ผู้สมัครแนะนำ ({filteredRanked.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sent')}
                className={`flex min-h-11 items-center gap-2 rounded-[12px] px-4 font-bold text-sm transition ${
                  activeTab === 'sent'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock3 size={17} />
                ยื่นเสนอแล้ว/รอตอบ ({sentMatches.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`flex min-h-11 items-center gap-2 rounded-[12px] px-4 font-bold text-sm transition ${
                  activeTab === 'approved'
                    ? 'bg-hope-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck size={17} />
                อนุมัติแล้ว/พร้อมเริ่มงาน ({approvedMatches.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ ทักษะ..."
                className="min-h-10 w-full rounded-[10px] border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          {/* TAB 1: RECOMMENDED CANDIDATES */}
          {activeTab === 'recommended' && (
            <div className="space-y-4">
              {filteredRanked.length === 0 ? (
                <div className="rounded-[16px] bg-white p-12 text-center shadow-sm">
                  <Users className="mx-auto text-slate-400" size={48} />
                  <h3 className="mt-3 text-lg font-bold text-slate-900">ไม่พบผู้สมัครที่ตรงกับคำค้นหา</h3>
                  <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหา หรือสร้างประกาศงานเพิ่มเติม</p>
                </div>
              ) : (
                filteredRanked.map(({ resident, score, matchedSkills }) => {
                  const match = state.matches.find((m) => m.residentId === resident.id);
                  const isApproved = match?.status === 'shelter_approved';
                  const shelter = state.shelters.find((s) => s.id === resident.shelterId);

                  return (
                    <article
                      key={resident.id}
                      className="overflow-hidden rounded-[16px] bg-white p-6 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] transition hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-brand-100">
                            {resident.photoUrl ? (
                              <Image src={resident.photoUrl} alt="" fill className="object-cover" />
                            ) : (
                              <span className="grid h-full place-items-center text-xl font-bold text-brand-700">
                                {resident.name.charAt(0)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-extrabold text-slate-950">{resident.name}</h3>
                              {idCardBadge(resident.idCardStatus)}
                              <span className="rounded-full bg-opportunity-100 px-3 py-0.5 text-xs font-extrabold text-opportunity-800">
                                คะแนนสอดคล้อง {score}%
                              </span>
                            </div>

                            {/* Demographics & Shelter */}
                            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                              <span>
                                <b>อายุ:</b> {resident.age} ปี
                              </span>
                              <span>
                                <b>ศูนย์ดูแล:</b> {shelter?.name || 'ศูนย์คนไร้บ้านบ้านใหม่'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={15} className="text-opportunity-700" />
                                <b>พร้อมทำงาน:</b>{' '}
                                {resident.availableDays?.length ? resident.availableDays.join(', ') : resident.availability}
                                {resident.availableFrom && resident.availableTo
                                  ? ` (${resident.availableFrom}–${resident.availableTo} น.)`
                                  : ''}
                              </span>
                            </div>

                            {/* Skills Tags */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-700 mr-1">ทักษะความเชี่ยวชาญ:</span>
                              {resident.skills.map((skill) => {
                                const isMatch = matchedSkills.includes(skill);
                                return (
                                  <span
                                    key={skill}
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      isMatch
                                        ? 'bg-brand-600 text-white ring-2 ring-brand-200'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {isMatch ? `✓ ${skill}` : skill}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Notes Summary */}
                            {resident.notes && (
                              <p className="mt-2 text-xs text-slate-500 line-clamp-1 italic">
                                💬 หมายเหตุจากศูนย์: "{resident.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col shrink-0 items-stretch sm:items-center lg:items-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setExpandedResidentId(resident.id)}>
                            <Eye size={16} /> ดูรายละเอียดโปรไฟล์
                          </Button>

                          {!match ? (
                            <Button size="md" onClick={() => suggest(resident, score)}>
                              <Send size={16} /> ยื่นข้อเสนองาน
                            </Button>
                          ) : isApproved ? (
                            <div className="rounded-[12px] bg-hope-100 px-3 py-2 text-xs font-extrabold text-hope-800 flex items-center gap-1.5">
                              <ShieldCheck size={16} /> ศูนย์อนุมัติเรียบร้อย
                            </div>
                          ) : (
                            <div className="rounded-[12px] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Clock3 size={16} /> ยื่นเสนอแล้ว (รอตอบ)
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SENT OFFERS */}
          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentMatches.length === 0 ? (
                <div className="rounded-[16px] bg-white p-12 text-center shadow-sm">
                  <Clock3 className="mx-auto text-slate-400" size={48} />
                  <h3 className="mt-3 text-lg font-bold text-slate-900">ยังไม่มีข้อเสนอที่อยู่ระหว่างรอคำตอบ</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    เลือกผู้สมัครในแท็บ <b>"ผู้สมัครแนะนำ"</b> แล้วกด <b>"ยื่นข้อเสนองาน"</b> เพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                sentMatches.map((match) => {
                  const resident = state.residents.find((r) => r.id === match.residentId);
                  const job = state.jobs.find((j) => j.id === match.jobId);
                  if (!resident) return null;

                  return (
                    <article
                      key={match.id}
                      className="overflow-hidden rounded-[16px] bg-white p-6 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-extrabold text-slate-950">{resident.name}</h3>
                            {idCardBadge(resident.idCardStatus)}
                            <span className="rounded-full bg-opportunity-100 px-3 py-0.5 text-xs font-extrabold text-opportunity-800">
                              คะแนน {match.score}%
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            ตำแหน่งงานที่ยื่น: <b>{job?.title || 'ตำแหน่งงาน'}</b> (฿{job?.dailyWage.toLocaleString()}/วัน)
                          </p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${STATUS[match.status].className}`}>
                          {STATUS[match.status].label}
                        </span>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <MatchProgress status={match.status} />
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: APPROVED MATCHES */}
          {activeTab === 'approved' && (
            <div className="space-y-4">
              {approvedMatches.length === 0 ? (
                <div className="rounded-[16px] bg-white p-12 text-center shadow-sm">
                  <ShieldCheck className="mx-auto text-hope-600" size={48} />
                  <h3 className="mt-3 text-lg font-bold text-slate-900">ยังไม่มีรายชื่อที่ศูนย์อนุมัติสมบูรณ์</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    เมื่อศูนย์คนไร้บ้านอนุมัติการจับคู่ รายชื่อผู้สมัครพร้อมข้อมูลเบอร์โทรศัพท์ติดต่อจะปรากฏที่นี่
                  </p>
                </div>
              ) : (
                approvedMatches.map((match) => {
                  const resident = state.residents.find((r) => r.id === match.residentId);
                  const shelter = resident ? state.shelters.find((s) => s.id === resident.shelterId) : undefined;
                  const job = state.jobs.find((j) => j.id === match.jobId);
                  if (!resident) return null;

                  return (
                    <article
                      key={match.id}
                      className="overflow-hidden rounded-[16px] border-2 border-hope-200 bg-white p-6 shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-hope-100 px-3 py-1 text-xs font-bold text-hope-800">
                            <ShieldCheck size={15} /> ศูนย์อนุมัติการจับคู่แล้ว · พร้อมรับงาน
                          </span>
                          <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{resident.name}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            ตำแหน่ง: <b>{job?.title || 'ตำแหน่งงาน'}</b> · ศูนย์ดูแล:{' '}
                            <b>{shelter?.name || 'ศูนย์คนไร้บ้าน'}</b> ({shelter?.address || 'กรุงเทพมหานคร'})
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                            <span><b>อายุ:</b> {resident.age} ปี</span>
                            <span><b>ทักษะ:</b> {resident.skills.join(', ')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <Button size="lg" onClick={() => setExpandedResidentId(resident.id)}>
                            <Phone size={18} /> ดูเบอร์ติดต่อและโปรไฟล์ฉบับเต็ม
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── SHELTER WORKFLOW VIEW ────────────────────────────────────────────── */
        <div className="mt-7 space-y-6">
          <div className="rounded-[16px] bg-brand-50 p-5 ring-1 ring-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white">
                <Clock3 size={24} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">ข้อเสนองานที่รอดำเนินการ</h2>
                <p className="text-sm text-slate-600">
                  ตรวจสอบข้อเสนอจากนายจ้าง สอบถามคนไร้บ้านในดูแล และกดอนุมัติการจับคู่เพื่อเปิดเผยข้อมูลติดต่อ
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-600 px-4 py-2 text-sm font-extrabold text-white">
              {state.matches.filter((m) => m.status === 'suggested' || m.status === 'worker_accepted').length} รายการ
            </span>
          </div>

          <div className="space-y-4">
            {state.matches.length === 0 ? (
              <div className="rounded-[16px] bg-white p-12 text-center shadow-sm">
                <CheckCircle2 className="mx-auto text-brand-600" size={48} />
                <h3 className="mt-3 text-lg font-bold text-slate-900">ไม่มีข้อเสนองานที่รอดำเนินการ</h3>
                <p className="mt-1 text-sm text-slate-500">ข้อเสนองานใหม่จากผู้จ้างงานจะแสดงขึ้นที่นี่อัตโนมัติ</p>
              </div>
            ) : (
              state.matches.map((match) => {
                const resident = state.residents.find((item) => item.id === match.residentId);
                const job = state.jobs.find((item) => item.id === match.jobId);
                if (!resident || !job) return null;
                const actionable = match.status === 'suggested' || match.status === 'worker_accepted';

                return (
                  <article
                    key={match.id}
                    className="overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]"
                  >
                    <div className="grid md:grid-cols-[minmax(0,1fr)_18rem]">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-opportunity-100 text-lg font-extrabold text-brand-700">
                            {resident.name.charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-extrabold text-slate-950">{resident.name}</h3>
                              {idCardBadge(resident.idCardStatus)}
                              <span className="rounded-full bg-opportunity-50 px-3 py-1 text-xs font-extrabold text-opportunity-700">
                                ความเหมาะสม {match.score}%
                              </span>
                            </div>
                            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS[match.status].className}`}>
                              {STATUS[match.status].label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[12px] bg-slate-50 p-4">
                          <p className="font-bold text-slate-900">{job.title}</p>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={16} className="text-brand-600" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Banknote size={16} className="text-opportunity-700" />฿
                              {job.dailyWage.toLocaleString()} บาท/วัน
                            </span>
                          </div>
                        </div>

                        <MatchProgress status={match.status} />
                      </div>

                      {actionable ? (
                        <aside className="flex flex-col justify-center bg-slate-50 p-6 md:border-l md:border-slate-100">
                          <p className="text-sm font-extrabold text-slate-900">การพิจารณาและอนุมัติ</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            เมื่อศูนย์คนไร้บ้านอนุมัติ นายจ้างจะเห็นข้อมูลติดต่อเบอร์ศูนย์เพื่อเตรียมนัดหมายเริ่มงาน
                          </p>
                          <div className="mt-4 grid gap-2">
                            <Button className="w-full" onClick={() => requestStatus(match, resident, job, 'shelter_approved')}>
                              <ShieldCheck size={17} /> อนุมัติการจับคู่
                            </Button>
                            <button
                              type="button"
                              onClick={() => requestStatus(match, resident, job, 'shelter_declined')}
                              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
                            >
                              <XCircle size={17} /> ไม่อนุมัติ / ผู้สมัครไม่สะดวก
                            </button>
                          </div>
                        </aside>
                      ) : (
                        <aside
                          className={`flex items-center justify-center p-6 md:border-l md:border-slate-100 ${
                            match.status === 'shelter_approved' ? 'bg-hope-50' : 'bg-slate-50'
                          }`}
                        >
                          <div className="text-center">
                            <span
                              className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
                                match.status === 'shelter_approved' ? 'bg-hope-100 text-hope-700' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {match.status === 'shelter_approved' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            </span>
                            <p className="mt-2 text-sm font-bold text-slate-800">
                              {match.status === 'shelter_approved' ? 'อนุมัติเรียบร้อย' : 'ยุติการจับคู่'}
                            </p>
                          </div>
                        </aside>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Profile Preview Detail Modal */}
      {expandedResident &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setExpandedResidentId(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-title"
              className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
            >
              <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
                    <UserRound size={17} /> ข้อมูลพรีวิวโปรไฟล์ผู้สมัคร
                  </p>
                  <h2 id="profile-title" className="mt-1 text-2xl font-extrabold text-slate-950">
                    {expandedResident.name}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="ปิดโปรไฟล์"
                  onClick={() => setExpandedResidentId(null)}
                  className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100"
                  autoFocus
                >
                  <X />
                </button>
              </header>
              <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-7 md:grid-cols-[13rem_minmax(0,1fr)]">
                  <div>
                    {expandedResident.photoUrl ? (
                      <Image
                        src={expandedResident.photoUrl}
                        alt={`รูปโปรไฟล์ของ ${expandedResident.name}`}
                        width={416}
                        height={416}
                        className="aspect-square w-full rounded-[14px] object-cover"
                      />
                    ) : (
                      <span className="grid aspect-square w-full place-items-center rounded-[14px] bg-brand-100 text-5xl font-extrabold text-brand-700">
                        {expandedResident.name.charAt(0)}
                      </span>
                    )}
                    <h3 className="mt-4 text-center text-xl font-extrabold text-slate-950">{expandedResident.name}</h3>
                    <div className="mt-2 flex justify-center">{idCardBadge(expandedResident.idCardStatus)}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">ข้อมูลทักษะและความพร้อมทำงาน</h3>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[12px] bg-slate-50 p-4">
                        <dt className="text-sm font-semibold text-slate-500">อายุ</dt>
                        <dd className="mt-1 font-bold text-slate-900">{expandedResident.age} ปี</dd>
                      </div>
                      <div className="rounded-[12px] bg-slate-50 p-4">
                        <dt className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                          <CalendarDays size={15} /> วัน/เวลาที่พร้อม
                        </dt>
                        <dd className="mt-1 font-bold text-slate-900">{expandedResident.availability}</dd>
                      </div>
                      <div className="rounded-[12px] bg-slate-50 p-4 sm:col-span-2">
                        <dt className="text-sm font-semibold text-slate-500">ทักษะความสามารถทั้งหมด</dt>
                        <dd className="mt-2 flex flex-wrap gap-1.5">
                          {expandedResident.skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                              ✓ {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    </dl>

                    {/* Notes */}
                    {expandedResident.notes && (
                      <div className="mt-4 rounded-[12px] bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-500">การประเมินและข้อแนะนำจากศูนย์คนไร้บ้าน</p>
                        <p className="mt-1 text-sm text-slate-800 leading-6">{expandedResident.notes}</p>
                      </div>
                    )}

                    {/* Shelter Contact Section */}
                    <div className="mt-5 rounded-[16px] bg-brand-50 p-5 ring-1 ring-brand-100">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-700">
                          <Building2 size={20} />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                            ศูนย์คนไร้บ้านที่ดูแลผู้สมัคร (ผู้ประสานงานหลัก)
                          </p>
                          <h4 className="mt-0.5 text-lg font-extrabold text-slate-950">
                            {expandedShelter?.name ?? 'ศูนย์คนไร้บ้านบ้านใหม่'}
                          </h4>
                          {expandedShelter?.address && (
                            <p className="mt-1 text-sm text-slate-600">{expandedShelter.address}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="flex min-h-12 items-center gap-3 rounded-[12px] bg-white px-4 font-bold text-brand-700 shadow-sm">
                          <Phone size={18} />
                          <div>
                            <span className="block text-xs font-semibold text-slate-500">เบอร์สอบถาม/นัดหมาย</span>
                            {expandedShelter?.phone || '02-354-3388'}
                          </div>
                        </div>

                        <div className="flex min-h-12 items-center gap-3 rounded-[12px] bg-white px-4 font-bold text-red-700 shadow-sm">
                          <Siren size={18} />
                          <div>
                            <span className="block text-xs font-semibold text-slate-500">กรณีเร่งด่วน</span>
                            {expandedShelter?.emergencyPhone || '1300'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-7">
                <Button variant="secondary" onClick={() => setExpandedResidentId(null)}>
                  ปิดหน้าต่าง
                </Button>
                {role === 'employer' && (
                  <Button onClick={() => { setExpandedResidentId(null); suggest(expandedResident, 85); }}>
                    <Send size={16} /> ยื่นข้อเสนองานให้ {expandedResident.name}
                  </Button>
                )}
              </footer>
            </section>
          </div>,
          document.body,
        )}

      {/* Action Confirmation Dialog */}
      {action &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setAction(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="action-title"
              aria-describedby="action-description"
              className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex justify-between gap-4">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full ${
                    action.tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {action.tone === 'danger' ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
                </span>
                <button
                  type="button"
                  aria-label="ปิดหน้าต่าง"
                  onClick={() => setAction(null)}
                  className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100"
                >
                  <X />
                </button>
              </div>
              <h2 id="action-title" className="mt-5 text-2xl font-extrabold text-slate-950">
                {action.title}
              </h2>
              <p id="action-description" className="mt-2 leading-7 text-slate-600">
                {action.description}
              </p>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setAction(null)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button variant={action.tone} onClick={confirmAction} disabled={saving} autoFocus>
                  {saving ? 'กำลังบันทึก…' : action.confirmLabel}
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
