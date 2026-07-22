'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Compass,
  Eye,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getAllResidents, getJobs, getMatchesForEmployer, getMatchesForShelter, getResidents } from '@/lib/db';
import type { Job, JobMatch, Resident } from '@/types';

type Data = { residents: Resident[]; jobs: Job[]; matches: JobMatch[] };

const STATUS_TEXT: Record<JobMatch['status'], { label: string; className: string }> = {
  suggested: { label: 'ยื่นข้อเสนอแล้ว · รอศูนย์ตอบ', className: 'bg-brand-50 text-brand-700' },
  worker_accepted: { label: 'ผู้สมัครสนใจ · รอศูนย์อนุมัติ', className: 'bg-amber-50 text-amber-800' },
  worker_declined: { label: 'ผู้สมัครไม่สะดวกรับงาน', className: 'bg-slate-100 text-slate-700' },
  shelter_approved: { label: 'ศูนย์อนุมัติแล้ว · พร้อมเริ่มงาน', className: 'bg-hope-100 text-hope-800 font-bold' },
  shelter_declined: { label: 'ศูนย์ไม่อนุมัติการจับคู่', className: 'bg-red-50 text-red-700' },
};

export function DashboardOverview({ role }: { role: 'shelter' | 'employer' }) {
  const { org } = useAuthContext();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (role === 'shelter') {
          const sid = org.shelter?.id ?? '';
          const [residents, jobs, matches] = await Promise.all([
            getResidents(sid),
            getJobs(),
            getMatchesForShelter(sid),
          ]);
          setData({ residents, jobs, matches });
        } else {
          const eid = org.employer?.id ?? '';
          const [jobs, matches, residents] = await Promise.all([
            getJobs(eid),
            getMatchesForEmployer(eid),
            getAllResidents(),
          ]);
          setData({ residents, jobs, matches });
        }
      } catch {
        setError('ไม่สามารถโหลดข้อมูลได้ โปรดลองอีกครั้ง');
      }
    })();
  }, [role, org]);

  const title = role === 'shelter' ? org.shelter?.name : org.employer?.businessName;

  const stats: Array<[string, number | undefined, LucideIcon, string, string]> =
    role === 'shelter'
      ? [
          [
            'ข้อเสนองานที่รอดำเนินการ',
            data?.matches.filter((x) => x.status === 'suggested' || x.status === 'worker_accepted').length,
            Clock3,
            'bg-brand-100 text-brand-700',
            'รายการ',
          ],
          [
            'คนไร้บ้านในความดูแล',
            data?.residents.length,
            UsersRound,
            'bg-opportunity-100 text-opportunity-700',
            'คน',
          ],
          [
            'อนุมัติการจับคู่สำเร็จ',
            data?.matches.filter((x) => x.status === 'shelter_approved').length,
            CheckCircle2,
            'bg-hope-100 text-hope-700',
            'รายการ',
          ],
        ]
      : [
          [
            'ประกาศงานที่เปิดรับ',
            data?.jobs.filter((x) => x.status === 'open').length,
            BriefcaseBusiness,
            'bg-brand-100 text-brand-700',
            'ตำแหน่ง',
          ],
          [
            'ข้อเสนอที่กำลังติดตาม',
            data?.matches.filter((x) => x.status === 'suggested' || x.status === 'worker_accepted').length,
            Clock3,
            'bg-opportunity-100 text-opportunity-700',
            'คน',
          ],
          [
            'ศูนย์อนุมัติพร้อมเริ่มงาน',
            data?.matches.filter((x) => x.status === 'shelter_approved').length,
            CheckCircle2,
            'bg-hope-100 text-hope-700',
            'คน',
          ],
        ];

  return (
    <div className="page-enter">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-bold text-brand-600">{title ?? (role === 'shelter' ? 'ศูนย์คนไร้บ้าน' : 'ผู้จ้างงาน')}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950">ภาพรวมระบบและการติดตามงาน</h1>
          <p className="mt-2 text-slate-600">ยินดีต้อนรับกลับ นี่คือข้อมูลสรุปและรายการที่ต้องติดตามสำหรับวันนี้</p>
        </div>
        <Link
          href={role === 'shelter' ? '/shelter/residents' : '/employer/create-job'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-brand-600 px-5 font-bold text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] hover:bg-brand-700"
        >
          {role === 'shelter' ? 'เพิ่มผู้เข้าร่วมใหม่' : 'ประกาศงานใหม่'} <ArrowRight size={17} />
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-[12px] bg-red-50 p-4 font-semibold text-red-800">
          {error}
        </p>
      )}

      {/* Stats Cards */}
      <section aria-label="สรุปข้อมูล" className="mt-7 grid gap-4 md:grid-cols-3">
        {stats.map(([label, value, Icon, color, unit], index) => (
          <div
            key={label}
            className={`lift rounded-[16px] bg-white p-5 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] ${
              index === 1 ? 'md:translate-y-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-[13px] ${color}`}>
                <Icon size={21} />
              </span>
              {index === 2 && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-hope-700">
                  <TrendingUp size={15} /> สำเร็จ
                </span>
              )}
            </div>
            {data ? (
              <p className="mt-5 text-3xl font-extrabold tabular-nums text-slate-950">
                {value} <span className="text-base font-medium text-slate-500">{unit}</span>
              </p>
            ) : (
              <div className="mt-5 h-9 w-24 animate-pulse rounded bg-slate-100" />
            )}
            <p className="mt-1 font-semibold text-slate-700">{label}</p>
          </div>
        ))}
      </section>

      {/* Navigation Shortcut Banner */}
      <section className="mt-8 flex flex-col justify-between gap-5 rounded-[16px] bg-gradient-to-r from-brand-50 via-sky-50 to-opportunity-50 p-5 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:p-6">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Compass />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {role === 'employer' ? 'คัดเลือกผู้สมัครงานที่เหมาะสม' : 'พิจารณาข้อเสนองานจากผู้จ้างงาน'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {role === 'employer'
                ? 'ระบบคำนวณคะแนนความเหมาะสมให้อัตโนมัติ สามารถยื่นข้อเสนอไปยังศูนย์คนไร้บ้านได้ในคลิกเดียว'
                : 'ตรวจสอบข้อเสนอ สอบถามความพร้อมของคนไร้บ้านในดูแล และอนุมัติการจับคู่'}
            </p>
          </div>
        </div>
        <Link
          href={role === 'shelter' ? '/shelter/matching' : '/employer/matches'}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-white px-4 font-bold text-brand-700 shadow-sm hover:bg-brand-50"
        >
          {role === 'employer' ? 'ไปยังหน้าคัดเลือกผู้สมัคร' : 'ไปที่หน้าอนุมัติงาน'} <ArrowRight size={17} />
        </Link>
      </section>

      {/* REDESIGNED TASK LIST: CLEAR NAMES & CANDIDATES (NO CRYPTIC IDS) */}
      <section className="mt-8 overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {role === 'employer' ? 'ข้อเสนองานที่อยู่ระหว่างติดตาม' : 'รายการข้อเสนอที่รอดำเนินการ'}
            </h2>
            <p className="text-sm text-slate-500">แสดงรายชื่อผู้สมัคร ตำแหน่งงาน และสถานะล่าสุด</p>
          </div>
          <Link
            href={role === 'shelter' ? '/shelter/matching' : '/employer/matches'}
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
          >
            ดูรายการทั้งหมด <ArrowRight size={15} />
          </Link>
        </div>

        {!data ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((x) => (
              <div key={x} className="h-16 animate-pulse rounded-[12px] bg-slate-100" />
            ))}
          </div>
        ) : data.matches.length === 0 ? (
          <div className="p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <CheckCircle2 size={32} />
            </span>
            <h3 className="mt-4 font-bold text-slate-950">ยังไม่มีรายการที่อยู่ระหว่างติดตาม</h3>
            <p className="mt-1 text-sm text-slate-600">
              {role === 'employer'
                ? 'เมื่อคุณยื่นข้อเสนองานให้ผู้สมัคร รายการติดตามสถานะจะแสดงที่นี่'
                : 'ข้อเสนองานใหม่จากผู้จ้างงานจะแสดงขึ้นที่นี่อัตโนมัติ'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.matches.slice(0, 5).map((match) => {
              const resident = data.residents.find((r) => r.id === match.residentId);
              const job = data.jobs.find((j) => j.id === match.jobId);
              const statusInfo = STATUS_TEXT[match.status] || {
                label: match.status,
                className: 'bg-slate-100 text-slate-700',
              };

              return (
                <div key={match.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
                  {/* Candidate Name & Job Title */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-950 text-base">
                        {resident?.name || 'ผู้สมัคร'}
                      </p>
                      <span className="text-xs font-bold text-slate-400">·</span>
                      <p className="font-semibold text-brand-700 text-sm">
                        {job?.title || 'ตำแหน่งงาน'}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      คะแนนความเหมาะสม: <b className="text-slate-800">{match.score}%</b>
                      {job?.dailyWage ? ` · ค่าจ้าง ฿${job.dailyWage.toLocaleString()}/วัน` : ''}
                    </p>
                  </div>

                  {/* Status Tag */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-3.5 py-1 text-xs font-bold ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>

                    <Link
                      href={role === 'shelter' ? '/shelter/matching' : '/employer/matches'}
                      className="inline-flex items-center gap-1 rounded-[10px] bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                    >
                      <Eye size={14} /> ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
