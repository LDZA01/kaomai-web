'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  MapPin,
  PlusCircle,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getAllResidents, getJobs, getMatchesForEmployer } from '@/lib/db';
import { filterCandidatesByMinimumScore, getMatchesForJob, sortEmployerJobs } from '@/lib/employer-job-browser';
import { rankResidentsForJob } from '@/lib/matching';
import { formatPreferredWorkType } from '@/lib/resident-intake';
import type { Job, JobMatch, Resident } from '@/types';

const JOB_STATUS: Record<Job['status'], { label: string; className: string }> = {
  open: { label: 'เปิดรับสมัคร', className: 'bg-hope-100 text-hope-800' },
  draft: { label: 'ฉบับร่าง', className: 'bg-amber-50 text-amber-800' },
  filled: { label: 'ปิดรับสมัคร', className: 'bg-slate-100 text-slate-700' },
};

type State = {
  jobs: Job[];
  residents: Resident[];
  matches: JobMatch[];
};

export function EmployerJobsIndex() {
  const { org } = useAuthContext();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const employerId = org.employer?.id;
    if (!employerId) return;
    (async () => {
      const [jobs, residents, matches] = await Promise.all([
        getJobs(employerId),
        getAllResidents(),
        getMatchesForEmployer(employerId),
      ]);
      setState({ jobs, residents, matches });
    })();
  }, [org.employer?.id]);

  const jobs = useMemo(() => sortEmployerJobs(state?.jobs ?? []), [state?.jobs]);

  if (!state) {
    return <div className="grid gap-3 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-[16px] bg-white" />)}</div>;
  }

  return (
    <div className="page-enter">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 flex items-center gap-2 font-bold text-brand-600"><BriefcaseBusiness size={18}/>จัดการประกาศงานและการคัดเลือก</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-slate-950">งานและผู้สมัคร</h1>
          <p className="mt-2 max-w-3xl text-slate-600">เลือกงานเพื่อเปิดดูผู้สมัครที่มีทักษะและความพร้อมสอดคล้องกันในหน้ารายละเอียด</p>
        </div>
        <Link href="/employer/create-job" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-brand-600 px-5 font-bold text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] hover:bg-brand-700"><PlusCircle size={18}/>ประกาศงานใหม่</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-7 rounded-[16px] bg-white px-6 py-14 text-center shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.07)]">
          <BriefcaseBusiness className="mx-auto text-brand-600" size={44}/>
          <h2 className="mt-4 text-xl font-bold text-slate-950">เริ่มจากสร้างประกาศงานแรก</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">เมื่อประกาศงานแล้ว ระบบจะจัดอันดับผู้สมัครที่เหมาะกับทักษะของงานนั้นให้โดยอัตโนมัติ</p>
          <Link href="/employer/create-job" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-brand-600 px-5 font-bold text-white hover:bg-brand-700"><PlusCircle size={18}/>ประกาศงานใหม่</Link>
        </div>
      ) : (
        <section aria-labelledby="employer-jobs-heading" className="mt-7">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="employer-jobs-heading" className="text-xl font-bold text-slate-950">งานของฉัน</h2><p className="mt-1 text-sm text-slate-600">กดการ์ดงานเพื่อดูผู้สมัครและจัดการข้อเสนอ</p></div>
            <p className="text-sm font-semibold text-slate-600">{jobs.length} งาน</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {jobs.map((job) => {
              const candidates = rankResidentsForJob(job, state.residents);
              const qualifyingCandidates = filterCandidatesByMinimumScore(candidates, job.minimumMatchScore);
              const jobMatches = getMatchesForJob(state.matches, job.id);
              return (
                <Link key={job.id} href={`/employer/matches/job?jobId=${encodeURIComponent(job.id)}`} className="group flex min-h-64 flex-col rounded-[16px] border border-slate-200 bg-white p-5 transition hover:border-brand-400 hover:shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                  <div className="flex items-start justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${JOB_STATUS[job.status].className}`}>{JOB_STATUS[job.status].label}</span><span className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">ดูผู้สมัคร <ArrowRight size={16}/></span></div>
                  <h3 className="mt-4 text-xl font-extrabold text-slate-950 group-hover:text-brand-700">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600"><span className="inline-flex items-center gap-1"><MapPin size={15}/>{job.location}</span><span className="inline-flex items-center gap-1"><Banknote size={15}/>฿{job.dailyWage.toLocaleString()}/วัน</span></div>
                  <div className="mt-4 flex flex-wrap gap-1.5">{job.requiredSkills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{skill}</span>)}<span className="rounded-full bg-opportunity-50 px-2.5 py-1 text-xs font-bold text-opportunity-800">{formatPreferredWorkType(job.workType)}</span><span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">ต้องมีอย่างน้อย {job.minimumMatchScore}%</span></div>
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-center sm:grid-cols-4">
                    <span><b className="block text-lg text-slate-950">{qualifyingCandidates.length}/{candidates.length}</b><span className="text-xs text-slate-600">สอดคล้อง / ทั้งหมด</span></span>
                    <span><b className="block text-lg text-amber-700">{candidates.length - qualifyingCandidates.length}</b><span className="text-xs text-slate-600">ต่ำกว่าเกณฑ์</span></span>
                    <span><b className="block text-lg text-brand-700">{candidates[0]?.score ?? 0}%</b><span className="text-xs text-slate-600">คะแนนสูงสุด</span></span>
                    <span><b className="block text-lg text-slate-950">{jobMatches.length}</b><span className="text-xs text-slate-600">ข้อเสนอ</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
