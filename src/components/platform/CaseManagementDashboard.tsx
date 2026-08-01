'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Phone,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import {
  getCaseManagers,
  getMatchesForShelter,
  getResidents,
} from '@/lib/db';
import {
  CASE_MANAGER_CAPACITY,
  getCaseManagerWorkloads,
  getCoordinationStatus,
  getLatestMatchByResident,
} from '@/lib/case-management';
import { formatPreferredWorkType } from '@/lib/resident-intake';
import type { CaseManager, JobMatch, Resident } from '@/types';

type DashboardData = {
  residents: Resident[];
  managers: CaseManager[];
  matches: JobMatch[];
};

const STATUS_STYLES = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-50 text-red-700',
} as const;

export function CaseManagementDashboard() {
  const { org } = useAuthContext();
  const shelterId = org.shelter?.id ?? '';
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [managerWarning, setManagerWarning] = useState('');
  const [managerFilter, setManagerFilter] = useState('all');

  useEffect(() => {
    if (!shelterId) return;
    let active = true;

    Promise.allSettled([
      getResidents(shelterId),
      getCaseManagers(shelterId),
      getMatchesForShelter(shelterId),
    ]).then(([residentsResult, managersResult, matchesResult]) => {
      if (!active) return;
      if (residentsResult.status === 'rejected') {
        setError('ไม่สามารถโหลดข้อมูลผู้เข้าร่วมได้ โปรดลองอีกครั้ง');
        return;
      }

      setData({
        residents: residentsResult.value,
        managers:
          managersResult.status === 'fulfilled' ? managersResult.value : [],
        matches: matchesResult.status === 'fulfilled' ? matchesResult.value : [],
      });
      if (managersResult.status === 'rejected') {
        setManagerWarning(
          'ข้อมูลผู้จัดการรายกรณียังไม่พร้อม กรุณาติดตั้ง migration 015 เพื่อเปิดใช้การมอบหมาย',
        );
      }
    });

    return () => {
      active = false;
    };
  }, [shelterId]);

  const workloads = useMemo(
    () => getCaseManagerWorkloads(data?.managers ?? [], data?.residents ?? []),
    [data],
  );
  const latestMatches = useMemo(
    () => getLatestMatchByResident(data?.matches ?? []),
    [data],
  );
  const unassigned = data?.residents.filter((resident) => !resident.caseManagerId) ?? [];
  const coordinationCount =
    data?.residents.filter((resident) => {
      const status = latestMatches.get(resident.id)?.status;
      return status === 'suggested' || status === 'worker_accepted';
    }).length ?? 0;
  const filteredResidents =
    data?.residents.filter((resident) => {
      if (managerFilter === 'all') return true;
      if (managerFilter === 'unassigned') return !resident.caseManagerId;
      return resident.caseManagerId === managerFilter;
    }) ?? [];

  const metrics = [
    {
      label: 'ผู้เข้าร่วมในความดูแล',
      value: data?.residents.length,
      unit: 'คน',
      icon: UsersRound,
      iconClass: 'bg-brand-50 text-brand-700',
      href: '/shelter/residents',
    },
    {
      label: 'ยังไม่ได้มอบหมาย',
      value: data ? unassigned.length : undefined,
      unit: 'คน',
      icon: UserPlus,
      iconClass: 'bg-amber-50 text-amber-800',
      href: '/shelter/residents',
    },
    {
      label: 'ผู้จัดการที่ปฏิบัติงาน',
      value: data?.managers.length,
      unit: 'คน',
      icon: ClipboardList,
      iconClass: 'bg-cyan-50 text-cyan-800',
      href: '#workload',
    },
    {
      label: 'ต้องประสานงาน',
      value: data ? coordinationCount : undefined,
      unit: 'รายการ',
      icon: BriefcaseBusiness,
      iconClass: 'bg-green-50 text-green-800',
      href: '/shelter/matching',
    },
  ];

  return (
    <div className="page-enter overflow-x-hidden">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <p className="font-bold text-brand-700">
            {org.shelter?.name ?? 'ศูนย์คนไร้บ้าน'}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950">
            การดูแลรายกรณี
          </h1>
          <p className="mt-2 text-slate-700">
            ดูภาระงาน มอบหมายผู้รับผิดชอบ และติดตามการประสานงานของผู้เข้าร่วมในที่เดียว
          </p>
        </div>
        <Link
          href="/shelter/residents"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-brand-600 px-5 font-bold text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] hover:bg-brand-700"
        >
          จัดการผู้เข้าร่วม <ArrowRight size={17} />
        </Link>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-[12px] bg-red-50 p-4 font-semibold text-red-800">
          {error}
        </p>
      )}
      {managerWarning && (
        <p role="status" className="mt-6 rounded-[12px] bg-amber-50 p-4 font-semibold text-amber-900">
          {managerWarning}
        </p>
      )}

      <section aria-label="สรุปงานดูแลรายกรณี" className="mt-7 grid gap-px overflow-hidden rounded-[16px] bg-slate-200 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, unit, icon: Icon, iconClass, href }) => (
          <Link key={label} href={href} className="group min-w-0 bg-white p-5 hover:bg-slate-50">
            <div className="flex items-start justify-between gap-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] ${iconClass}`}>
                <Icon size={20} />
              </span>
              <ArrowRight size={16} className="mt-1 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
            </div>
            {value === undefined ? (
              <div className="mt-5 h-8 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-5 text-2xl font-extrabold tabular-nums text-slate-950">
                {value} <span className="text-sm font-semibold text-slate-600">{unit}</span>
              </p>
            )}
            <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
          </Link>
        ))}
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)]">
        <section id="workload" aria-labelledby="workload-heading" className="rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 id="workload-heading" className="text-xl font-bold text-slate-950">ภาระงานผู้จัดการรายกรณี</h2>
            <p className="mt-1 text-sm text-slate-600">คำแนะนำเบื้องต้นไม่เกิน {CASE_MANAGER_CAPACITY} คนต่อผู้จัดการหนึ่งคน</p>
          </div>
          {!data ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-[12px] bg-slate-100" />)}
            </div>
          ) : workloads.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="font-bold text-slate-950">ยังไม่มีผู้จัดการรายกรณี</h3>
              <p className="mt-1 text-sm text-slate-600">เพิ่มรายชื่อและเบอร์โทรในหน้าจัดการผู้เข้าร่วมก่อนเริ่มมอบหมาย</p>
              <Link href="/shelter/residents" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-brand-600 px-4 font-bold text-white">เพิ่มผู้จัดการ <ArrowRight size={16}/></Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {workloads.map(({ manager, assignedCount, capacityPercent, isOverCapacity }) => (
                <article key={manager.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-950">{manager.name}</h3>
                      <a href={`tel:${manager.phone}`} aria-label={`โทรหา ${manager.name} ที่ ${manager.phone}`} className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
                        <Phone size={16}/> {manager.phone}
                      </a>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-extrabold tabular-nums text-slate-950">{assignedCount} คน</p>
                      <p className={`text-xs font-bold ${isOverCapacity ? 'text-red-700' : 'text-slate-600'}`}>
                        {isOverCapacity ? 'ภาระงานสูง' : assignedCount === 0 ? 'พร้อมรับมอบหมาย' : 'อยู่ในเกณฑ์แนะนำ'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`ภาระงาน ${assignedCount} จากคำแนะนำ ${CASE_MANAGER_CAPACITY} คน`}>
                    <div className={`h-full rounded-full ${isOverCapacity ? 'bg-red-600' : 'bg-brand-600'}`} style={{ width: `${capacityPercent}%` }}/>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="unassigned-heading" className="rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 id="unassigned-heading" className="text-xl font-bold text-slate-950">รอมอบหมายผู้ดูแล</h2>
              <p className="mt-1 text-sm text-slate-600">จัดลำดับก่อนเริ่มประสานโอกาสงาน</p>
            </div>
            {data && <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">{unassigned.length} คน</span>}
          </div>
          {!data ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-[12px] bg-slate-100" />)}
            </div>
          ) : unassigned.length === 0 ? (
            <div className="p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-800"><CheckCircle2/></span>
              <h3 className="mt-4 font-bold text-slate-950">มอบหมายครบทุกคนแล้ว</h3>
              <p className="mt-1 text-sm text-slate-600">กลับมาตรวจสอบเมื่อมีผู้เข้าร่วมใหม่เข้าระบบ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassigned.slice(0, 5).map((resident) => (
                <article key={resident.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-950">{resident.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{formatPreferredWorkType(resident.preferredWorkType)} · {resident.skills.slice(0, 2).join(', ') || 'ยังไม่ระบุทักษะ'}</p>
                    </div>
                    <Link href="/shelter/residents" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-brand-50 px-3 text-sm font-bold text-brand-700 hover:bg-brand-100">
                      มอบหมาย <ArrowRight size={15}/>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="portfolio-heading" className="mt-7 overflow-hidden rounded-[16px] bg-white shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:p-6">
          <div>
            <h2 id="portfolio-heading" className="text-xl font-bold text-slate-950">ผู้เข้าร่วมทั้งหมด</h2>
            <p className="mt-1 text-sm text-slate-600">ติดตามผู้รับผิดชอบและสถานะการประสานงานล่าสุด</p>
          </div>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            กรองตามผู้จัดการ
            <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)} className="min-h-11 min-w-56 rounded-[12px] border border-slate-300 bg-white px-3 text-base focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100">
              <option value="all">ทั้งหมด</option>
              <option value="unassigned">ยังไม่ได้มอบหมาย</option>
              {data?.managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </select>
          </label>
        </div>

        {!data ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[12px] bg-slate-100" />)}
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-bold text-slate-950">ไม่พบผู้เข้าร่วมในตัวกรองนี้</h3>
            <p className="mt-1 text-sm text-slate-600">เลือกผู้จัดการคนอื่นหรือแสดงทั้งหมด</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredResidents.map((resident) => {
              const manager = data.managers.find((item) => item.id === resident.caseManagerId) ?? resident.caseManager;
              const latestMatch = latestMatches.get(resident.id);
              const status = getCoordinationStatus(latestMatch?.status);
              return (
                <article key={resident.id} className="p-5 sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(12rem,.8fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-950">{resident.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{formatPreferredWorkType(resident.preferredWorkType)} · {resident.skills.slice(0, 3).join(', ') || 'ยังไม่ระบุทักษะ'}</p>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-slate-500">ผู้รับผิดชอบ</p>
                      <p className="mt-0.5 truncate font-bold text-slate-800">{manager?.name ?? 'ยังไม่ได้มอบหมาย'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status.tone]}`}>{status.label}</span>
                      <Link href={latestMatch ? '/shelter/matching' : '/shelter/residents'} className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                        {latestMatch ? 'ดูการจับคู่' : 'ดูข้อมูล'} <ArrowRight size={15}/>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
