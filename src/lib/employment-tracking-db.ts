import { isSupabaseConfigured, supabase } from './supabase';
import {
  mockEmploymentCheckIns,
  mockEmploymentTrackings,
} from '@/data/mockData';
import type {
  EmploymentCadence,
  EmploymentCheckIn,
  EmploymentEndReason,
  EmploymentTracking,
} from '@/types';

let mockTrackingStore = [...mockEmploymentTrackings];
let mockCheckInStore = [...mockEmploymentCheckIns];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTracking(row: any): EmploymentTracking {
  return {
    id: row.id,
    matchId: row.match_id,
    residentId: row.resident_id,
    jobId: row.job_id,
    shelterId: row.shelter_id,
    caseManagerId: row.case_manager_id ?? undefined,
    startedAt: row.started_at,
    cadence: row.cadence,
    nextFollowUpAt: row.next_follow_up_at,
    supportState: row.support_state,
    status: row.status,
    endedAt: row.ended_at ?? undefined,
    endReason: row.end_reason ?? undefined,
    finalNote: row.final_note ?? undefined,
    returnToMatching: Boolean(row.return_to_matching),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCheckIn(row: any): EmploymentCheckIn {
  return {
    id: row.id,
    employmentTrackingId: row.employment_tracking_id,
    checkInDate: row.check_in_date,
    attendance: row.attendance,
    adjustment: row.adjustment,
    participantFeedback: row.participant_feedback ?? undefined,
    employerFeedback: row.employer_feedback ?? undefined,
    privateNote: row.private_note ?? undefined,
    nextFollowUpAt: row.next_follow_up_at,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getEmploymentTrackings(
  shelterId: string,
): Promise<EmploymentTracking[]> {
  if (!isSupabaseConfigured) {
    return mockTrackingStore.filter((tracking) => tracking.shelterId === shelterId);
  }
  const { data, error } = await supabase
    .from('employment_trackings')
    .select('*')
    .eq('shelter_id', shelterId)
    .order('next_follow_up_at');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toTracking);
}

export async function getEmploymentCheckIns(
  employmentTrackingId: string,
): Promise<EmploymentCheckIn[]> {
  if (!isSupabaseConfigured) {
    return mockCheckInStore
      .filter((checkIn) => checkIn.employmentTrackingId === employmentTrackingId)
      .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
  }
  const { data, error } = await supabase
    .from('employment_check_ins')
    .select('*')
    .eq('employment_tracking_id', employmentTrackingId)
    .order('check_in_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCheckIn);
}

export async function startEmploymentTracking(
  input: Omit<
    EmploymentTracking,
    'id' | 'supportState' | 'status' | 'returnToMatching'
  >,
): Promise<EmploymentTracking> {
  if (!isSupabaseConfigured) {
    const tracking: EmploymentTracking = {
      ...input,
      id: `tracking-${crypto.randomUUID()}`,
      supportState: 'good',
      status: 'active',
      returnToMatching: false,
    };
    mockTrackingStore = [tracking, ...mockTrackingStore];
    return tracking;
  }
  const { data, error } = await supabase
    .from('employment_trackings')
    .insert({
      match_id: input.matchId,
      resident_id: input.residentId,
      job_id: input.jobId,
      shelter_id: input.shelterId,
      case_manager_id: input.caseManagerId ?? null,
      started_at: input.startedAt,
      cadence: input.cadence,
      next_follow_up_at: input.nextFollowUpAt,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTracking(data);
}

export async function addEmploymentCheckIn(
  input: Omit<EmploymentCheckIn, 'id' | 'createdAt' | 'createdBy'>,
  cadence: EmploymentCadence,
): Promise<{ checkIn: EmploymentCheckIn; tracking: EmploymentTracking }> {
  if (!isSupabaseConfigured) {
    const checkIn: EmploymentCheckIn = {
      ...input,
      id: `check-in-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    mockCheckInStore = [checkIn, ...mockCheckInStore];
    const tracking = mockTrackingStore.find(
      (item) => item.id === input.employmentTrackingId,
    );
    if (!tracking) throw new Error('ไม่พบรายการติดตามการทำงาน');
    const updated = {
      ...tracking,
      cadence,
      supportState: input.adjustment,
      nextFollowUpAt: input.nextFollowUpAt,
    };
    mockTrackingStore = mockTrackingStore.map((item) =>
      item.id === updated.id ? updated : item,
    );
    return { checkIn, tracking: updated };
  }

  const { data: checkInData, error: checkInError } = await supabase
    .from('employment_check_ins')
    .insert({
      employment_tracking_id: input.employmentTrackingId,
      check_in_date: input.checkInDate,
      attendance: input.attendance,
      adjustment: input.adjustment,
      participant_feedback: input.participantFeedback?.trim() || null,
      employer_feedback: input.employerFeedback?.trim() || null,
      private_note: input.privateNote?.trim() || null,
      next_follow_up_at: input.nextFollowUpAt,
    })
    .select()
    .single();
  if (checkInError) throw new Error(checkInError.message);

  const { data: trackingData, error: trackingError } = await supabase
    .from('employment_trackings')
    .update({
      cadence,
      support_state: input.adjustment,
      next_follow_up_at: input.nextFollowUpAt,
    })
    .eq('id', input.employmentTrackingId)
    .select()
    .single();
  if (trackingError) throw new Error(trackingError.message);
  return {
    checkIn: toCheckIn(checkInData),
    tracking: toTracking(trackingData),
  };
}

export async function endEmploymentTracking(
  id: string,
  input: {
    endedAt: string;
    endReason: EmploymentEndReason;
    finalNote: string;
    returnToMatching: boolean;
  },
): Promise<EmploymentTracking> {
  if (!isSupabaseConfigured) {
    const tracking = mockTrackingStore.find((item) => item.id === id);
    if (!tracking) throw new Error('ไม่พบรายการติดตามการทำงาน');
    const updated: EmploymentTracking = {
      ...tracking,
      status: 'ended',
      endedAt: input.endedAt,
      endReason: input.endReason,
      finalNote: input.finalNote.trim(),
      returnToMatching: input.returnToMatching,
    };
    mockTrackingStore = mockTrackingStore.map((item) =>
      item.id === id ? updated : item,
    );
    return updated;
  }
  const { data, error } = await supabase
    .from('employment_trackings')
    .update({
      status: 'ended',
      ended_at: input.endedAt,
      end_reason: input.endReason,
      final_note: input.finalNote.trim(),
      return_to_matching: input.returnToMatching,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTracking(data);
}
