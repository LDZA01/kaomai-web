import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, XCircle, MapPin, Percent } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getMatchesForShelter, updateMatchStatus, getAllResidents } from '../../lib/db';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { mockJobs } from '../../data/mockData';
import { useAuthContext } from '../../App';
import type { Job, JobMatch, Resident } from '../../types';

const statusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  hired: 'รับเข้าทำงานแล้ว',
  rejected: 'ปฏิเสธ',
};

const statusColor: Record<string, 'yellow' | 'green' | 'red'> = {
  pending: 'yellow',
  hired: 'green',
  rejected: 'red',
};

const Matching = () => {
  const { org } = useAuthContext();
  const shelterId = org.shelter?.id ?? '';

  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!shelterId) return;
    setPageLoading(true);
    try {
      const [matchData, residentData] = await Promise.all([
        getMatchesForShelter(shelterId),
        getAllResidents(),
      ]);
      setMatches(matchData);
      setResidents(residentData);

      // Fetch jobs referenced in the matches
      if (matchData.length > 0) {
        const jobIds = [...new Set(matchData.map((m) => m.jobId))];
        if (isSupabaseConfigured) {
          const { data } = await supabase
            .from('jobs')
            .select('id, title, location, job_description, required_skills, daily_wage, employer_id, status')
            .in('id', jobIds);
          if (data) {
            setJobs(data.map((row: any) => ({
              id: row.id,
              employerId: row.employer_id,
              title: row.title,
              description: row.job_description,
              requiredSkills: row.required_skills ?? [],
              location: row.location,
              dailyWage: Number(row.daily_wage),
              status: row.status,
            })));
          }
        } else {
          setJobs(mockJobs.filter((j) => jobIds.includes(j.id)));
        }
      }
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setPageLoading(false);
    }
  }, [shelterId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusChange = async (id: string, status: JobMatch['status']) => {
    try {
      await updateMatchStatus(id, status);
      setMatches((current) =>
        current.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    } catch {
      setError('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // Enrich matches with job + resident details
  const enriched = matches.map((match) => ({
    ...match,
    job: jobs.find((j) => j.id === match.jobId),
    resident: residents.find((r) => r.id === match.residentId),
  })).filter((m) => m.resident); // show even if job not found yet

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">การติดตามการจับคู่</h1>
        <p className="mt-1 text-slate-500">ติดตามคำขอและประสานงานการยืนยันการจ้างงานกับผู้จ้างงาน</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          <span>⚠</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {pageLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-2" /> กำลังโหลด...
        </div>
      ) : enriched.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400">
          ยังไม่มีการจับคู่ — ผู้จ้างงานจะส่งคำขอมาที่นี่
        </div>
      ) : (
        <div className="grid gap-4">
          {enriched.map((match) => (
            <Card key={match.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Resident + Job info */}
                <div className="flex gap-4">
                  <div className="relative">
                    {match.resident?.photoUrl ? (
                      <img
                        src={match.resident.photoUrl}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-bold">
                        {match.resident?.name?.[0] ?? '?'}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                      match.status === 'hired' ? 'bg-emerald-500' : match.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{match.resident?.name}</h2>
                      <Badge
                        label={statusLabel[match.status] ?? match.status}
                        color={statusColor[match.status] ?? 'gray'}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      {match.job && (
                        <span className="font-semibold text-slate-700">{match.job.title}</span>
                      )}
                      {match.job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {match.job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <Percent size={12} />
                        ความเหมาะสม {match.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleStatusChange(match.id, 'pending')}
                    disabled={match.status === 'pending'}
                  >
                    <Clock3 size={15} aria-hidden /> รอดำเนินการ
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    onClick={() => handleStatusChange(match.id, 'hired')}
                    disabled={match.status === 'hired'}
                  >
                    <CheckCircle2 size={15} aria-hidden /> ยืนยันการจ้างงาน
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    onClick={() => handleStatusChange(match.id, 'rejected')}
                    disabled={match.status === 'rejected'}
                  >
                    <XCircle size={15} aria-hidden /> ปฏิเสธ
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matching;
