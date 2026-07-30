import type {
  EmploymentCadence,
  EmploymentEndReason,
  EmploymentSupportState,
  EmploymentTracking,
} from '@/types';

export type TrackingUrgency = 'urgent' | 'overdue' | 'due_today' | 'upcoming';

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function addMonthClamped(value: string): string {
  const date = parseDate(value);
  const day = date.getUTCDate();
  const nextMonthStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );
  const lastDayOfNextMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0),
  ).getUTCDate();
  nextMonthStart.setUTCDate(Math.min(day, lastDayOfNextMonth));
  return formatDate(nextMonthStart);
}

export function getDefaultNextFollowUp(
  startedAt: string,
  completedAt: string,
  cadence: EmploymentCadence,
): string {
  const elapsedDays = Math.floor(
    (parseDate(completedAt).getTime() - parseDate(startedAt).getTime()) /
      86_400_000,
  );
  if (elapsedDays < 7) return addDays(completedAt, 1);
  return cadence === 'fortnightly'
    ? addDays(completedAt, 14)
    : addMonthClamped(completedAt);
}

export function getTrackingUrgency(
  nextFollowUpAt: string,
  supportState: EmploymentSupportState,
  today = formatDate(new Date()),
): TrackingUrgency {
  if (supportState === 'urgent') return 'urgent';
  if (nextFollowUpAt < today) return 'overdue';
  if (nextFollowUpAt === today) return 'due_today';
  return 'upcoming';
}

const URGENCY_ORDER: Record<TrackingUrgency, number> = {
  urgent: 0,
  overdue: 1,
  due_today: 2,
  upcoming: 3,
};

export function sortTrackingsByUrgency(
  trackings: EmploymentTracking[],
  today?: string,
): EmploymentTracking[] {
  return [...trackings].sort((a, b) => {
    const urgencyDifference =
      URGENCY_ORDER[getTrackingUrgency(a.nextFollowUpAt, a.supportState, today)] -
      URGENCY_ORDER[getTrackingUrgency(b.nextFollowUpAt, b.supportState, today)];
    return urgencyDifference || a.nextFollowUpAt.localeCompare(b.nextFollowUpAt);
  });
}

type EmploymentEndInput = {
  endedAt: string;
  endReason: EmploymentEndReason | '';
  finalNote: string;
  confirmed: boolean;
};

export function validateEmploymentEnd(
  input: EmploymentEndInput,
): string | null {
  if (!input.endedAt) return 'กรุณากรอกวันทำงานวันสุดท้าย';
  if (!input.endReason) return 'กรุณาเลือกเหตุผลที่ยุติการทำงาน';
  if (!input.finalNote.trim()) return 'กรุณาบันทึกสรุปก่อนยุติการทำงาน';
  if (!input.confirmed) return 'กรุณายืนยันการยุติการทำงาน';
  return null;
}
