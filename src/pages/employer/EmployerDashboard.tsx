import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, UsersRound, MapPin, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import { mockEmployers, mockResidents } from '../../data/mockData';
import { rankResidentsForJob } from '../../lib/matching';
import useRealtimeJobs from '../../hooks/useRealtimeJobs';

const EmployerDashboard = () => {
  const { jobs, loading } = useRealtimeJobs();
  const employer = mockEmployers[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-7 text-white shadow-lg shadow-emerald-900/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        <p className="relative text-sm font-bold uppercase tracking-widest text-emerald-200">
          {employer.businessName}
        </p>
        <h1 className="relative mt-2 text-3xl font-extrabold tracking-tight">แดชบอร์ดผู้จ้างงาน</h1>
        <p className="relative mt-2 max-w-2xl text-base text-emerald-100 leading-relaxed">
          ลงประกาศงาน ดูผู้สมัครที่เหมาะสม และเลือกคนที่ใช่ให้กับธุรกิจของคุณ
        </p>
      </section>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <PlusCircle className="text-blue-600" size={20} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">ประกาศงาน</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">{loading ? '...' : jobs.length}</p>
          <p className="mt-1 text-sm text-slate-500">ประกาศงานที่เปิดรับอยู่</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <UsersRound className="text-emerald-600" size={20} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">ผู้พักพิง</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">{mockResidents.length}</p>
          <p className="mt-1 text-sm text-slate-500">โปรไฟล์พร้อมรับงาน</p>
        </Card>

        <Card>
          <p className="text-sm font-bold text-slate-700">ขั้นตอนถัดไป</p>
          <p className="mt-1 text-xs text-slate-400">ลงประกาศงานเพื่อเริ่มจับคู่กับผู้สมัคร</p>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-blue-800 transition-all"
            to="/employer/create-job"
          >
            <PlusCircle size={16} />
            ลงประกาศงานใหม่
          </Link>
        </Card>
      </div>

      {/* Job Cards */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-700">
          ประกาศงานของคุณ
          {!loading && (
            <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-bold text-blue-700">{jobs.length}</span>
          )}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => {
            const topMatches = rankResidentsForJob(job, mockResidents).slice(0, 2);
            return (
              <Card key={job.id} skills={job.requiredSkills}>
                <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{job.description}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {job.location}
                  </span>
                  <span className="font-bold text-emerald-700">฿{job.dailyWage.toLocaleString()} / วัน</span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">ผู้สมัครที่เหมาะสมที่สุด</p>
                  <div className="space-y-2">
                    {topMatches.map((match) => (
                      <div
                        key={match.resident.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <img src={match.resident.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                          <span className="text-sm font-semibold text-slate-700">{match.resident.name}</span>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-600">{match.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/employer/matches"
                  className="mt-4 flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ดูผู้สมัครทั้งหมด <ArrowRight size={14} />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default EmployerDashboard;
