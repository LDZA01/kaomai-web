import type { CaseManager, JobMatch, Resident } from '@/types';

export const CASE_MANAGER_CAPACITY = 5;

export type CaseManagerWorkload = {
  manager: CaseManager;
  assignedCount: number;
  capacityPercent: number;
  isOverCapacity: boolean;
};

export type CoordinationStatus = {
  label: string;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
};

export function getCaseManagerWorkloads(
  managers: CaseManager[],
  residents: Resident[],
): CaseManagerWorkload[] {
  const assignedCounts = new Map<string, number>();
  for (const resident of residents) {
    if (!resident.caseManagerId) continue;
    assignedCounts.set(
      resident.caseManagerId,
      (assignedCounts.get(resident.caseManagerId) ?? 0) + 1,
    );
  }

  return managers.map((manager) => {
    const assignedCount = assignedCounts.get(manager.id) ?? 0;
    return {
      manager,
      assignedCount,
      capacityPercent: Math.min(
        100,
        Math.round((assignedCount / CASE_MANAGER_CAPACITY) * 100),
      ),
      isOverCapacity: assignedCount > CASE_MANAGER_CAPACITY,
    };
  });
}

export function getLatestMatchByResident(
  matches: JobMatch[],
): Map<string, JobMatch> {
  const latest = new Map<string, JobMatch>();
  for (const match of matches) {
    const current = latest.get(match.residentId);
    if (
      !current ||
      new Date(match.requestedAt).getTime() >
        new Date(current.requestedAt).getTime()
    ) {
      latest.set(match.residentId, match);
    }
  }
  return latest;
}

export function getCoordinationStatus(
  status?: JobMatch['status'],
): CoordinationStatus {
  switch (status) {
    case 'suggested':
      return { label: 'รอประสานผู้เข้าร่วม', tone: 'info' };
    case 'worker_accepted':
      return { label: 'รอศูนย์อนุมัติ', tone: 'warning' };
    case 'worker_declined':
      return { label: 'ผู้เข้าร่วมยังไม่พร้อม', tone: 'neutral' };
    case 'shelter_approved':
      return { label: 'พร้อมเริ่มงาน', tone: 'success' };
    case 'shelter_declined':
      return { label: 'ต้องทบทวนโอกาสใหม่', tone: 'danger' };
    default:
      return { label: 'ยังไม่มีการจับคู่', tone: 'neutral' };
  }
}
