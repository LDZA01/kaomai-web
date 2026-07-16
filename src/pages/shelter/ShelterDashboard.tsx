import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, UsersRound, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import { mockJobMatches, mockJobs, mockResidents, mockShelters } from '../../data/mockData';
import { getEnrichedMatches } from '../../lib/matching';

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
  const hiredCount = mockJobMatches.filter((match) => match.status === 'hired').length;
  const pendingCount = mockJobMatches.filter((match) => match.status === 'pending').length;
  const recentMatches = getEnrichedMatches(mockJobMatches, mockJobs, mockResidents).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 p-7 text-white shadow-lg shadow-blue-900/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        <p className="relative text-sm font-bold uppercase tracking-widest text-blue-300">
          {mockShelters[0].name}
        </p>
        <h1 className="relative mt-2 text-3xl font-extrabold tracking-tight">
          แดชบอร์ดศูนย์พักพิง
        </h1>
        <p className="relative mt-2 max-w-2xl text-base text-blue-100 leading-relaxed">
          จัดการโปรไฟล์ผู้พักพิง ติดตามคำขอจากผู้จ้างงาน และยืนยันการจับคู่ทั้งหมดในที่เดียว
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <UsersRound className="text-blue-600" size={20} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">ผู้พักพิง</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">{mockResidents.length}</p>
          <p className="mt-1 text-sm text-slate-500">โปรไฟล์ผู้พักพิงที่ใช้งานอยู่</p>
        </Card>
        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Briefcase className="text-amber-600" size={20} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">รอดำเนินการ</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-sm text-slate-500">คำขอจากผู้จ้างงานที่รอดำเนินการ</p>
        </Card>
        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="text-emerald-600" size={20} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">สำเร็จ</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">{hiredCount}</p>
          <p className="mt-1 text-sm text-slate-500">การจ้างงานที่ยืนยันแล้ว</p>
        </Card>
      </section>

      {/* Bottom Grid */}
      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card title="กิจกรรมการจับคู่ล่าสุด" description="คำขอจากผู้จ้างงานที่ต้องการการดำเนินการ">
          <div className="mt-4 divide-y divide-slate-50">
            {recentMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={match.resident?.photoUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{match.resident?.name}</p>
                    <p className="text-xs text-slate-500">{match.job?.title}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor[match.status]}`}>
                  {statusLabel[match.status] ?? match.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="ทำสิ่งต่อไป" description="เข้าถึงฟังก์ชันหลักได้ทันที">
          <div className="mt-4 grid gap-3">
            <Link
              className="group flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-blue-800 transition-all"
              to="/shelter/residents"
            >
              <span>จัดการผู้พักพิง</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className="group flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
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
