import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, UsersRound, ArrowRight, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getMatchesForShelter, getResidents, getJobs } from '../../lib/db';
import { useAuthContext } from '../../App';
import type { Job, JobMatch, Resident } from '../../types';

const statusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  hired: 'รับเข้าทำงานแล้ว',
  rejected: 'ปฏิเสธ',
};

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  hired: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
};

const ShelterDashboard = () => {
  const { org } = useAuthContext();
  const shelter = org.shelter;
  const shelterId = shelter?.id ?? '';

  const [residents, setResidents] = useState<Resident[]>([]);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!shelterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resData, matchData, jobData] = await Promise.all([
        getResidents(shelterId),
        getMatchesForShelter(shelterId),
        getJobs(),
      ]);
      setResidents(resData);
      setMatches(matchData);
      setJobs(jobData);
    } catch (err) {
      console.error('[ShelterDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [shelterId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingCount = matches.filter((m) => m.status === 'pending').length;
  const hiredCount = matches.filter((m) => m.status === 'hired').length;

  const recentMatches = matches.slice(0, 3).map((match) => ({
    ...match,
    resident: residents.find((r) => r.id === match.residentId),
    job: jobs.find((j) => j.id === match.jobId),
  }));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-7 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0d2236 0%, #173A5E 60%, #1e4d7b 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        <p className="relative text-xs sm:text-sm font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>
          {shelter?.name ?? 'ศูนย์คนไร้บ้าน'}
        </p>
        <h1 className="relative mt-1.5 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          แดชบอร์ดศูนย์คนไร้บ้าน
        </h1>
        <p className="relative mt-2 max-w-2xl text-xs sm:text-base text-blue-100 leading-relaxed">
          จัดการโปรไฟล์คนไร้บ้าน ติดตามคำขอจากผู้จ้างงาน และยืนยันการจับคู่ทั้งหมดในที่เดียว
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#ddeaf6' }}>
              <UsersRound size={20} style={{ color: '#173A5E' }} aria-hidden />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">คนไร้บ้าน</span>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold" style={{ color: '#173A5E' }}>
            {loading ? <Loader2 size={24} className="animate-spin" /> : residents.length}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">โปรไฟล์คนไร้บ้านที่ใช้งานอยู่</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#f0fdfa' }}>
              <Briefcase size={20} style={{ color: '#0d9488' }} aria-hidden />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">รอดำเนินการ</span>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-amber-600">
            {loading ? <Loader2 size={24} className="animate-spin" /> : pendingCount}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">คำขอจากผู้จ้างงานที่รอดำเนินการ</p>
        </Card>

        <Card className="flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#f0fdfa' }}>
              <CheckCircle2 size={20} style={{ color: '#0d9488' }} aria-hidden />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">สำเร็จ</span>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold" style={{ color: '#0d9488' }}>
            {loading ? <Loader2 size={24} className="animate-spin" /> : hiredCount}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">การจ้างงานที่ยืนยันแล้ว</p>
        </Card>
      </section>

      {/* Bottom Grid */}
      <section className="grid gap-4 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
        <Card title="กิจกรรมการจับคู่ล่าสุด" description="คำขอจากผู้จ้างงานที่ต้องการการดำเนินการ">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" /> กำลังโหลด...
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-slate-400">
              ยังไม่มีกิจกรรมการจับคู่ล่าสุด
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-50">
              {recentMatches.map((match) => (
                <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    {match.resident?.photoUrl ? (
                      <img
                        src={match.resident.photoUrl}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                        {match.resident?.name?.[0] ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{match.resident?.name ?? 'ไม่ระบุชื่อ'}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">{match.job?.title ?? 'ตำแหน่งงาน'}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor[match.status]}`}>
                    {statusLabel[match.status] ?? match.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="ทำสิ่งต่อไป" description="เข้าถึงฟังก์ชันหลักได้ทันที">
          <div className="mt-4 grid gap-3">
            <Link
              className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #173A5E, #1e4d7b)', boxShadow: '0 4px 12px rgba(23,58,94,0.2)' }}
              to="/shelter/residents"
            >
              <span>จัดการคนไร้บ้าน</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold transition-all active:scale-95"
              style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488' }}
              to="/shelter/matching"
            >
              <span>ตรวจสอบการจับคู่</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ShelterDashboard;
