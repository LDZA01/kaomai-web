import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Percent, Star } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getAllResidents, upsertMatch } from '../../lib/db';
import { rankResidentsForJob } from '../../lib/matching';
import { useAuthContext } from '../../App';
import useRealtimeJobs from '../../hooks/useRealtimeJobs';
import type { Resident } from '../../types';

const Matches = () => {
  const { org } = useAuthContext();
  const employerId = org.employer?.id ?? '';

  const { jobs, loading: jobsLoading } = useRealtimeJobs(employerId);

  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [approvedResidentId, setApprovedResidentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllResidents()
      .then(setAllResidents)
      .catch(console.error)
      .finally(() => setResidentsLoading(false));
  }, []);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];
  const rankedMatches = useMemo(
    () => (selectedJob ? rankResidentsForJob(selectedJob, allResidents) : []),
    [selectedJob, allResidents],
  );

  const approveMatch = async (residentId: string, score: number) => {
    if (!selectedJob) return;
    setSaving(true);
    setMessage('');
    try {
      await upsertMatch({
        jobId: selectedJob.id,
        residentId,
        score,
        status: 'hired',
      });
      setApprovedResidentId(residentId);
      setMessage('ยืนยันการรับสมัครเรียบร้อยแล้ว!');
    } catch {
      setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = jobsLoading || residentsLoading;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">เลือกผู้สมัครงาน</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">เลือกตำแหน่งงานและดูผู้สมัครที่จัดเรียงตามความเหมาะสมของทักษะ</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-2" /> กำลังโหลด...
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-xs sm:text-sm text-slate-400">
          ยังไม่มีประกาศงาน —{' '}
          <a href="/employer/create-job" className="font-bold text-teal-600 hover:underline">
            ลงประกาศแรกของคุณ
          </a>
        </div>
      ) : (
        <>
          {/* Job Selector */}
          <Card>
            <label className="mb-2 block text-xs sm:text-sm font-bold text-slate-700">เลือกตำแหน่งงาน</label>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setApprovedResidentId(null);
                setMessage('');
              }}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.location}
                </option>
              ))}
            </select>

            {selectedJob && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    {selectedJob.location}
                  </span>
                  <span className="font-bold text-emerald-700">฿{selectedJob.dailyWage.toLocaleString()} / วัน</span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">{selectedJob.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold ${
              message.includes('ผิดพลาด')
                ? 'bg-red-50 border border-red-100 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {/* Ranked Candidates */}
          <section>
            <h2 className="mb-4 text-sm sm:text-base font-bold text-slate-700">
              ผู้สมัครที่เหมาะสม{' '}
              <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs sm:text-sm text-slate-500 font-semibold">
                {rankedMatches.length} คน
              </span>
            </h2>

            {rankedMatches.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-xs sm:text-sm text-slate-400">
                ไม่พบผู้สมัครที่ทักษะตรงกับงานนี้
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {rankedMatches.map(({ resident, score, matchedSkills }, index) => {
                  const isApproved = approvedResidentId === resident.id;
                  return (
                    <Card key={resident.id} imageUrl={resident.photoUrl} skills={resident.skills} className="flex flex-col justify-between">
                      {index === 0 && (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-sm z-10">
                          <Star size={11} fill="currentColor" /> อันดับ 1
                        </div>
                      )}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{resident.name}</h3>
                        <div className="mt-2 space-y-1 text-xs sm:text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">ความพร้อม:</span>
                            <span className="font-semibold text-slate-700">{resident.availability}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">ทักษะที่ตรงกัน:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[140px] text-right">{matchedSkills.join(', ') || '—'}</span>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Percent size={11} /> ความเหมาะสม
                            </span>
                            <span className="font-extrabold text-emerald-700">{score}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        className={`mt-4 w-full ${isApproved ? 'opacity-80' : ''}`}
                        type="button"
                        variant={isApproved ? 'secondary' : 'primary'}
                        onClick={() => approveMatch(resident.id, score)}
                        disabled={isApproved || saving}
                      >
                        {saving && !isApproved
                          ? <Loader2 size={18} className="animate-spin" aria-hidden />
                          : <CheckCircle2 size={18} aria-hidden />}
                        {isApproved ? '✓ รับสมัครแล้ว' : 'รับสมัคร / จ้างงาน'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Matches;
