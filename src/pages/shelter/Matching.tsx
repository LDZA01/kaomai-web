import React, { useState } from 'react';
import { CheckCircle2, Clock3, XCircle, MapPin, Percent } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { mockJobMatches, mockJobs, mockResidents } from '../../data/mockData';
import { getEnrichedMatches } from '../../lib/matching';
import type { JobMatch } from '../../types';

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
  const [matches, setMatches] = useState<JobMatch[]>(mockJobMatches);
  const enrichedMatches = getEnrichedMatches(matches, mockJobs, mockResidents);

  const updateStatus = (id: string, status: JobMatch['status']) => {
    setMatches((current) => current.map((match) => (match.id === id ? { ...match, status } : match)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">การติดตามการจับคู่</h1>
        <p className="mt-1 text-slate-500">ติดตามคำขอและประสานงานการยืนยันการจ้างงานกับผู้จ้างงาน</p>
      </div>

      <div className="grid gap-4">
        {enrichedMatches.map((match) => (
          <Card key={match.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: Resident Info */}
              <div className="flex gap-4">
                <div className="relative">
                  <img
                    src={match.resident?.photoUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-slate-100"
                  />
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
                    <span className="font-semibold text-slate-700">{match.job?.title}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {match.job?.location}
                    </span>
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
                  onClick={() => updateStatus(match.id, 'pending')}
                >
                  <Clock3 size={15} aria-hidden />
                  รอดำเนินการ
                </Button>
                <Button
                  type="button"
                  size="small"
                  onClick={() => updateStatus(match.id, 'hired')}
                >
                  <CheckCircle2 size={15} aria-hidden />
                  ยืนยันการจ้างงาน
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={() => updateStatus(match.id, 'rejected')}
                >
                  <XCircle size={15} aria-hidden />
                  ปฏิเสธ
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Matching;
