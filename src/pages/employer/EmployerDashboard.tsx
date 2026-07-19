import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, UsersRound, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getAllResidents } from '../../lib/db';
import { rankResidentsForJob } from '../../lib/matching';
import { useAuthContext } from '../../App';
import useRealtimeJobs from '../../hooks/useRealtimeJobs';
import type { Resident } from '../../types';

const EmployerDashboard = () => {
  const { org } = useAuthContext();
  const employer = org.employer;
  const employerId = employer?.id ?? '';

  const { jobs, loading: jobsLoading } = useRealtimeJobs(employerId);

  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(true);

  useEffect(() => {
    getAllResidents()
      .then(setAllResidents)
      .catch(console.error)
      .finally(() => setResidentsLoading(false));
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-7 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0d4f47 0%, #0d9488 60%, #14b8a6 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        <p className="relative text-xs sm:text-sm font-bold uppercase tracking-widest" style={{ color: '#99f6e4' }}>
          {employer?.businessName ?? 'ผู้จ้างงาน'}
        </p>
        <h1 className="relative mt-1.5 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">แดชบอร์ดผู้จ้างงาน</h1>
        <p className="relative mt-2 max-w-2xl text-xs sm:text-base text-emerald-100 leading-relaxed">
          ลงประกาศงาน ดูผู้สมัครที่เหมาะสม และเลือกคนที่ใช่ให้กับธุรกิจของคุณ
        </p>
      </section>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#ddeaf6' }}>
              <PlusCircle size={20} style={{ color: '#173A5E' }} aria-hidden />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">ประกาศงาน</span>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
            {jobsLoading ? <Loader2 size={24} className="animate-spin" /> : jobs.length}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">ประกาศงานที่เปิดรับอยู่</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#f0fdfa' }}>
              <UsersRound size={20} style={{ color: '#0d9488' }} aria-hidden />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">คนไร้บ้าน</span>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
            {residentsLoading ? <Loader2 size={24} className="animate-spin" /> : allResidents.length}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">โปรไฟล์พร้อมรับงาน (ทุกศูนย์)</p>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700">ขั้นตอนถัดไป</p>
            <p className="mt-1 text-xs text-slate-400">ลงประกาศงานเพื่อเริ่มจับคู่กับผู้สมัคร</p>
          </div>
          <Link
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #173A5E, #1e4d7b)', boxShadow: '0 4px 12px rgba(23,58,94,0.2)' }}
            to="/employer/create-job"
          >
            <PlusCircle size={16} />
            ลงประกาศงานใหม่
          </Link>
        </Card>
      </div>

      {/* Job Cards */}
      <section>
        <h2 className="mb-4 text-base sm:text-lg font-bold text-slate-700">
          ประกาศงานของคุณ
          {!jobsLoading && (
            <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs sm:text-sm font-bold text-blue-700">
              {jobs.length}
            </span>
          )}
        </h2>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={28} className="animate-spin mr-2" /> กำลังโหลด...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-xs sm:text-sm text-slate-400">
            ยังไม่มีประกาศงาน —{' '}
            <Link to="/employer/create-job" className="font-bold text-teal-600 hover:underline">
              ลงประกาศแรกของคุณ
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => {
              const topMatches = rankResidentsForJob(job, allResidents).slice(0, 2);
              return (
                <Card key={job.id} skills={job.requiredSkills} className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{job.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">{job.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {job.location}
                      </span>
                      <span className="font-bold text-emerald-700">฿{job.dailyWage.toLocaleString()} / วัน</span>
                    </div>

                    {topMatches.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">ผู้สมัครที่เหมาะสมที่สุด</p>
                        <div className="space-y-1.5">
                          {topMatches.map((match) => (
                            <div
                              key={match.resident.id}
                              className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {match.resident.photoUrl ? (
                                  <img src={match.resident.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                    {match.resident.name[0]}
                                  </div>
                                )}
                                <span className="font-semibold text-slate-700 truncate">{match.resident.name}</span>
                              </div>
                              <span className="font-extrabold text-emerald-600 shrink-0 ml-2">{match.score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/employer/matches"
                    className="mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ดูผู้สมัครทั้งหมด <ArrowRight size={14} />
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployerDashboard;
