import { describe, expect, it } from 'vitest';
import type { EmploymentTracking } from '@/types';
import {
  getDefaultNextFollowUp,
  getTrackingUrgency,
  sortTrackingsByUrgency,
  validateEmploymentEnd,
} from './employment-tracking';

describe('getDefaultNextFollowUp', () => {
  it('schedules the next calendar day during the first employment week', () => {
    expect(
      getDefaultNextFollowUp('2026-07-01', '2026-07-03', 'fortnightly'),
    ).toBe('2026-07-04');
  });

  it('uses a fourteen-day cadence after the first week', () => {
    expect(
      getDefaultNextFollowUp('2026-07-01', '2026-07-08', 'fortnightly'),
    ).toBe('2026-07-22');
  });

  it('uses a calendar-month cadence after the first week', () => {
    expect(
      getDefaultNextFollowUp('2026-07-01', '2026-07-31', 'monthly'),
    ).toBe('2026-08-31');
  });
});

describe('getTrackingUrgency', () => {
  it('identifies overdue, due-today, and upcoming records', () => {
    expect(getTrackingUrgency('2026-07-10', 'good', '2026-07-11')).toBe('overdue');
    expect(getTrackingUrgency('2026-07-11', 'good', '2026-07-11')).toBe('due_today');
    expect(getTrackingUrgency('2026-07-12', 'good', '2026-07-11')).toBe('upcoming');
  });

  it('prioritizes urgent support regardless of due date', () => {
    expect(getTrackingUrgency('2026-08-01', 'urgent', '2026-07-11')).toBe('urgent');
  });
});

describe('sortTrackingsByUrgency', () => {
  it('sorts urgent, overdue, due today, and upcoming in that order', () => {
    const tracking = (
      id: string,
      nextFollowUpAt: string,
      supportState: EmploymentTracking['supportState'],
    ): EmploymentTracking => ({
      id,
      matchId: `match-${id}`,
      residentId: `resident-${id}`,
      jobId: `job-${id}`,
      shelterId: 'shelter-1',
      startedAt: '2026-07-01',
      cadence: 'fortnightly',
      nextFollowUpAt,
      supportState,
      status: 'active',
      returnToMatching: false,
    });

    const sorted = sortTrackingsByUrgency(
      [
        tracking('upcoming', '2026-07-14', 'good'),
        tracking('today', '2026-07-11', 'good'),
        tracking('urgent', '2026-07-20', 'urgent'),
        tracking('overdue', '2026-07-09', 'needs_support'),
      ],
      '2026-07-11',
    );

    expect(sorted.map((item) => item.id)).toEqual([
      'urgent',
      'overdue',
      'today',
      'upcoming',
    ]);
  });
});

describe('validateEmploymentEnd', () => {
  it('requires the last working date, reason, final note, and confirmation', () => {
    expect(
      validateEmploymentEnd({
        endedAt: '',
        endReason: '',
        finalNote: '',
        confirmed: false,
      }),
    ).toBe('กรุณากรอกวันทำงานวันสุดท้าย');
    expect(
      validateEmploymentEnd({
        endedAt: '2026-07-30',
        endReason: '',
        finalNote: '',
        confirmed: false,
      }),
    ).toBe('กรุณาเลือกเหตุผลที่ยุติการทำงาน');
    expect(
      validateEmploymentEnd({
        endedAt: '2026-07-30',
        endReason: 'resigned',
        finalNote: ' ',
        confirmed: false,
      }),
    ).toBe('กรุณาบันทึกสรุปก่อนยุติการทำงาน');
    expect(
      validateEmploymentEnd({
        endedAt: '2026-07-30',
        endReason: 'resigned',
        finalNote: 'ผู้เข้าร่วมขอเปลี่ยนสายงาน',
        confirmed: false,
      }),
    ).toBe('กรุณายืนยันการยุติการทำงาน');
  });
});
