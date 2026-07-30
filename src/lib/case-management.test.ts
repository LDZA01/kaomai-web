import { describe, expect, it } from 'vitest';
import type { CaseManager, JobMatch, Resident } from '@/types';
import {
  CASE_MANAGER_CAPACITY,
  getCaseManagerWorkloads,
  getCoordinationStatus,
  getLatestMatchByResident,
} from './case-management';

const managers: CaseManager[] = [
  { id: 'cm-1', shelterId: 'shelter-1', name: 'อรทัย', phone: '0811111111' },
  { id: 'cm-2', shelterId: 'shelter-1', name: 'วิชัย', phone: '0822222222' },
];

function resident(id: string, caseManagerId?: string): Resident {
  return {
    id,
    shelterId: 'shelter-1',
    name: id,
    age: 30,
    skills: [],
    availability: 'เต็มเวลา',
    workAvailability: true,
    caseManagerId,
  };
}

describe('getCaseManagerWorkloads', () => {
  it('counts several participants assigned to the same manager', () => {
    const workloads = getCaseManagerWorkloads(managers, [
      resident('r-1', 'cm-1'),
      resident('r-2', 'cm-1'),
      resident('r-3'),
    ]);

    expect(workloads.map(({ manager, assignedCount }) => [manager.id, assignedCount])).toEqual([
      ['cm-1', 2],
      ['cm-2', 0],
    ]);
  });

  it('marks a portfolio above five participants as high workload', () => {
    const workloads = getCaseManagerWorkloads(
      [managers[0]],
      Array.from({ length: CASE_MANAGER_CAPACITY + 1 }, (_, index) =>
        resident(`r-${index}`, 'cm-1'),
      ),
    );

    expect(workloads[0].isOverCapacity).toBe(true);
  });
});

describe('getLatestMatchByResident', () => {
  it('keeps the newest match for each participant', () => {
    const matches: JobMatch[] = [
      { id: 'm-old', jobId: 'j-1', residentId: 'r-1', status: 'suggested', score: 60, requestedAt: '2026-07-01T00:00:00Z' },
      { id: 'm-new', jobId: 'j-2', residentId: 'r-1', status: 'shelter_approved', score: 90, requestedAt: '2026-07-20T00:00:00Z' },
    ];

    expect(getLatestMatchByResident(matches).get('r-1')?.id).toBe('m-new');
  });
});

describe('getCoordinationStatus', () => {
  it.each([
    [undefined, 'ยังไม่มีการจับคู่'],
    ['suggested', 'รอประสานผู้เข้าร่วม'],
    ['worker_accepted', 'รอศูนย์อนุมัติ'],
    ['worker_declined', 'ผู้เข้าร่วมยังไม่พร้อม'],
    ['shelter_approved', 'พร้อมเริ่มงาน'],
    ['shelter_declined', 'ต้องทบทวนโอกาสใหม่'],
  ] as const)('maps %s to a clear Thai label', (status, label) => {
    expect(getCoordinationStatus(status).label).toBe(label);
  });
});
