import React, { useMemo, useState } from 'react';
import { CheckCircle2, MapPin, Percent, Star } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { mockJobs, mockResidents } from '../../data/mockData';
import { rankResidentsForJob } from '../../lib/matching';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const Matches = () => {
  const [selectedJobId, setSelectedJobId] = useState(mockJobs[0].id);
  const [approvedResidentId, setApprovedResidentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const selectedJob = mockJobs.find((job) => job.id === selectedJobId) || mockJobs[0];
  const rankedMatches = useMemo(() => rankResidentsForJob(selectedJob, mockResidents), [selectedJob]);

  const approveMatch = async (residentId: string, score: number) => {
    setApprovedResidentId(residentId);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('job_matches').insert({
        job_id: selectedJob.id,
        homeless_profile_id: residentId,
        match_status: 'hired',
        score,
      });

      if (error) {
        setMessage(`เกิดข้อผิดพลาด: ${error.message}`);
        return;
      }
    }

    setMessage(isSupabaseConfigured ? 'ยืนยันการรับสมัครเรียบร้อยแล้ว!' : 'ยืนยันการรับสมัครเรียบร้อยแล้ว (Mock)');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">เลือกผู้สมัครงาน</h1>
        <p className="mt-1 text-slate-500">เลือกตำแหน่งงานและดูผู้สมัครที่จัดเรียงตามความเหมาะสมของทักษะ</p>
      </div>

      {/* Job Selector */}
      <Card>
        <label className="mb-2 block text-sm font-bold text-slate-700">เลือกตำแหน่งงาน</label>
        <select
          value={selectedJobId}
          onChange={(e) => {
            setSelectedJobId(e.target.value);
            setApprovedResidentId(null);
            setMessage('');
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {mockJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} — {job.location}
            </option>
          ))}
        </select>

        {/* Selected job details */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin size={13} className="text-slate-400" />
              {selectedJob.location}
            </span>
            <span className="font-bold text-emerald-700">฿{selectedJob.dailyWage.toLocaleString()} / วัน</span>
          </div>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{selectedJob.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedJob.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl p-4 text-sm font-semibold ${
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
        <h2 className="mb-4 text-base font-bold text-slate-700">
          ผู้สมัครที่เหมาะสม <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">{rankedMatches.length} คน</span>
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {rankedMatches.map(({ resident, score, matchedSkills }, index) => {
            const isApproved = approvedResidentId === resident.id;
            return (
              <Card key={resident.id} imageUrl={resident.photoUrl} skills={resident.skills}>
                {/* Rank badge */}
                {index === 0 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-900 shadow">
                    <Star size={11} fill="currentColor" />
                    อันดับ 1
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900">{resident.name}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ความพร้อม:</span>
                    <span className="font-semibold text-slate-700">{resident.availability}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ทักษะที่ตรงกัน:</span>
                    <span className="font-semibold text-slate-700">{matchedSkills.join(', ') || '—'}</span>
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 flex items-center gap-1"><Percent size={11} /> ความเหมาะสม</span>
                    <span className="font-extrabold text-emerald-700">{score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                <Button
                  className={`mt-4 w-full ${isApproved ? 'opacity-80' : ''}`}
                  type="button"
                  variant={isApproved ? 'secondary' : 'primary'}
                  onClick={() => approveMatch(resident.id, score)}
                  disabled={isApproved}
                >
                  <CheckCircle2 size={18} aria-hidden />
                  {isApproved ? '✓ รับสมัครแล้ว' : 'รับสมัคร / จ้างงาน'}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Matches;
