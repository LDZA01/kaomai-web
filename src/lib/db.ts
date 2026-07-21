/**
 * db.ts — Centralised data-access layer.
 *
 * Every function tries Supabase first; when Supabase is not configured
 * (no .env) it falls back to the in-memory mock data so development
 * works without any credentials.
 */

import { isSupabaseConfigured, supabase } from './supabase';
import type { Employer, Job, JobMatch, Resident, Shelter } from '../types';
import {
  mockEmployers,
  mockJobMatches,
  mockJobs,
  mockResidents,
  mockShelters,
} from '../data/mockData';

// ── Row mappers (snake_case DB → camelCase TS) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toResident = (row: any): Resident => {
  let days: string[] = row.available_days ?? [];
  let from: string | undefined = row.available_from?.slice?.(0, 5);
  let to: string | undefined = row.available_to?.slice?.(0, 5);

  if ((!days || days.length === 0) && row.availability) {
    const parts = row.availability.split('·');
    if (parts[0]) {
      days = parts[0].split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (parts[1] && parts[1].includes('–')) {
      const times = parts[1].split('–');
      from = times[0]?.trim();
      to = times[1]?.trim();
    }
  }

  return {
    id: row.id,
    shelterId: row.shelter_id,
    name: row.name,
    age: row.age,
    gender: row.gender ?? undefined,
    skills: row.skills ?? [],
    photoUrl: row.photo_url ?? undefined,
    availability: row.availability,
    workAvailability: row.work_availability,
    notes: row.notes ?? undefined,
    hasIdCard: row.has_id_card ?? (row.id_card_status === 'has_card' ? true : row.id_card_status ? false : null),
    idCardStatus: row.id_card_status ?? (row.has_id_card === true ? 'has_card' : row.has_id_card === false ? 'not_started' : 'has_card'),
    availableDays: days,
    availableFrom: from,
    availableTo: to,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toJob = (row: any): Job => ({
  id: row.id,
  employerId: row.employer_id,
  title: row.title,
  description: row.job_description,
  requiredSkills: row.required_skills ?? [],
  location: row.location,
  dailyWage: Number(row.daily_wage),
  status: row.status as Job['status'],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toMatch = (row: any): JobMatch => {
  let status: JobMatch['status'] = row.match_status;
  if (row.match_status === 'pending') status = 'suggested';
  if (row.match_status === 'hired') status = 'shelter_approved';
  if (row.match_status === 'rejected') status = 'shelter_declined';

  return {
    id: row.id,
    jobId: row.job_id,
    residentId: row.homeless_profile_id,
    status,
    score: row.score,
    requestedAt: row.created_at,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toShelter = (row: any): Shelter => ({
  id: row.id,
  name: row.name,
  address: row.address,
  contactInfo: row.contact_info ?? '',
  phone: row.phone ?? undefined,
  emergencyPhone: row.emergency_phone ?? undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toEmployer = (row: any): Employer => ({
  id: row.id,
  businessName: row.business_name,
  industry: row.industry ?? '',
  contactInfo: row.contact_info ?? '',
});

// ── Org: Shelter ─────────────────────────────────────────────────────────────

/** Fetch the shelter that belongs to a given auth user. */
export async function fetchShelterByUserId(userId: string): Promise<Shelter | null> {
  if (!isSupabaseConfigured) return mockShelters[0];

  const { data, error } = await supabase
    .from('shelters')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) console.error('[db] fetchShelterByUserId error:', error.message);
  return data ? toShelter(data) : null;
}

export async function getShelters(): Promise<Shelter[]> {
  if (!isSupabaseConfigured) return mockShelters;
  const { data, error } = await supabase.from('shelters').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toShelter);
}

/** Create a new shelter record linked to an auth user. */
export async function createShelter(
  userId: string,
  name: string,
  address: string,
  contactInfo: string,
): Promise<Shelter | null> {
  if (!isSupabaseConfigured) {
    return { id: `shelter-${crypto.randomUUID()}`, name, address, contactInfo };
  }

  const { data, error } = await supabase
    .from('shelters')
    .insert({ profile_id: userId, name, address, contact_info: contactInfo })
    .select()
    .single();

  if (error) { console.error('[db] createShelter:', error.message); return null; }
  return toShelter(data);
}

export async function updateShelterProfile(
  shelter: Shelter,
): Promise<Shelter> {
  if (!isSupabaseConfigured) return shelter;

  const payload: Record<string, unknown> = {
    name: shelter.name,
    address: shelter.address,
    contact_info: shelter.contactInfo,
  };
  if (shelter.phone !== undefined) payload.phone = shelter.phone;
  if (shelter.emergencyPhone !== undefined) payload.emergency_phone = shelter.emergencyPhone;

  let { data, error } = await supabase
    .from('shelters')
    .update(payload)
    .eq('id', shelter.id)
    .select()
    .single();

  if (error) {
    // Fallback if phone columns don't exist yet
    const res = await supabase
      .from('shelters')
      .update({ name: shelter.name, address: shelter.address, contact_info: shelter.contactInfo })
      .eq('id', shelter.id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) throw new Error(error.message);
  return toShelter(data);
}

// ── Org: Employer ────────────────────────────────────────────────────────────

/** Fetch the employer that belongs to a given auth user. */
export async function fetchEmployerByUserId(userId: string): Promise<Employer | null> {
  if (!isSupabaseConfigured) return mockEmployers[0];

  const { data, error } = await supabase
    .from('employers')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) console.error('[db] fetchEmployerByUserId error:', error.message);
  return data ? toEmployer(data) : null;
}

/** Create a new employer record linked to an auth user. */
export async function createEmployer(
  userId: string,
  businessName: string,
  industry: string,
  contactInfo: string,
): Promise<Employer | null> {
  if (!isSupabaseConfigured) {
    return { id: `employer-${crypto.randomUUID()}`, businessName, industry, contactInfo };
  }

  const { data, error } = await supabase
    .from('employers')
    .insert({ profile_id: userId, business_name: businessName, industry, contact_info: contactInfo })
    .select()
    .single();

  if (error) { console.error('[db] createEmployer:', error.message); return null; }
  return toEmployer(data);
}

export async function updateEmployerProfile(
  employer: Employer,
): Promise<Employer> {
  if (!isSupabaseConfigured) return employer;

  const { data, error } = await supabase
    .from('employers')
    .update({
      business_name: employer.businessName,
      industry: employer.industry,
      contact_info: employer.contactInfo,
    })
    .eq('id', employer.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toEmployer(data);
}

// ── Residents ────────────────────────────────────────────────────────────────

/** Get all residents belonging to a shelter. */
export async function getResidents(shelterId: string): Promise<Resident[]> {
  if (!shelterId) return [];

  if (!isSupabaseConfigured) {
    return mockResidents.filter((r) => r.shelterId === shelterId);
  }

  const { data, error } = await supabase
    .from('homeless_profiles')
    .select('*')
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toResident);
}

/** Get ALL residents across all shelters (used by employers for matching). */
export async function getAllResidents(): Promise<Resident[]> {
  if (!isSupabaseConfigured) return mockResidents;

  const { data, error } = await supabase
    .from('homeless_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toResident);
}

/** Create or update a resident profile. */
export async function upsertResident(
  resident: Omit<Resident, 'id'> & { id?: string },
): Promise<Resident> {
  if (!isSupabaseConfigured) {
    return { ...resident, id: resident.id ?? crypto.randomUUID() } as Resident;
  }

  // Attempt 1: Full payload with all extended schema columns
  const fullPayload: Record<string, unknown> = {
    shelter_id: resident.shelterId,
    name: resident.name,
    age: resident.age,
    gender: resident.gender ?? null,
    skills: resident.skills,
    photo_url: resident.photoUrl ?? null,
    availability: resident.availability,
    work_availability: resident.workAvailability,
    notes: resident.notes ?? null,
    has_id_card: resident.hasIdCard ?? null,
    id_card_status: resident.idCardStatus ?? null,
    available_days: resident.availableDays ?? [],
    available_from: resident.availableFrom || null,
    available_to: resident.availableTo || null,
  };
  if (resident.id) fullPayload.id = resident.id;

  const { data, error } = await supabase
    .from('homeless_profiles')
    .upsert(fullPayload)
    .select()
    .single();

  if (!error && data) return toResident(data);

  // Attempt 2: Fallback to core columns if database migration hasn't been run yet
  const corePayload: Record<string, unknown> = {
    shelter_id: resident.shelterId,
    name: resident.name,
    age: resident.age,
    skills: resident.skills,
    photo_url: resident.photoUrl ?? null,
    availability: resident.availability,
    work_availability: resident.workAvailability,
    notes: resident.notes ?? null,
  };
  if (resident.id) corePayload.id = resident.id;

  const { data: coreData, error: coreError } = await supabase
    .from('homeless_profiles')
    .upsert(corePayload)
    .select()
    .single();

  if (coreError) throw new Error(coreError.message);
  return toResident(coreData);
}

/** Permanently delete a resident profile. */
export async function deleteResident(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('homeless_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

/** Get all jobs posted by a specific employer (or all jobs if employerId is empty). */
export async function getJobs(employerId?: string): Promise<Job[]> {
  if (!isSupabaseConfigured) {
    return employerId ? mockJobs.filter((j) => j.employerId === employerId) : mockJobs;
  }

  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (employerId) {
    query = query.eq('employer_id', employerId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(toJob);
}

/** Insert a new job posting. */
export async function createJob(job: Omit<Job, 'id'>): Promise<Job> {
  if (!isSupabaseConfigured) {
    return { ...job, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: job.employerId,
      title: job.title,
      job_description: job.description,
      required_skills: job.requiredSkills,
      location: job.location,
      daily_wage: job.dailyWage,
      status: job.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toJob(data);
}

// ── Matches ──────────────────────────────────────────────────────────────────

/** Get all matches for residents belonging to a shelter. */
export async function getMatchesForShelter(shelterId: string): Promise<JobMatch[]> {
  if (!shelterId) return [];

  if (!isSupabaseConfigured) {
    const myResidentIds = new Set(
      mockResidents.filter((r) => r.shelterId === shelterId).map((r) => r.id),
    );
    return mockJobMatches.filter((m) => myResidentIds.has(m.residentId));
  }

  // Join through homeless_profiles to filter by shelter
  const { data, error } = await supabase
    .from('job_matches')
    .select('*, homeless_profiles!inner(shelter_id)')
    .eq('homeless_profiles.shelter_id', shelterId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toMatch);
}

/** Get all matches for jobs belonging to an employer. */
export async function getMatchesForEmployer(employerId: string): Promise<JobMatch[]> {
  if (!employerId) return [];

  if (!isSupabaseConfigured) {
    const myJobIds = new Set(
      mockJobs.filter((j) => j.employerId === employerId).map((j) => j.id),
    );
    return mockJobMatches.filter((m) => myJobIds.has(m.jobId));
  }

  const { data, error } = await supabase
    .from('job_matches')
    .select('*, jobs!inner(employer_id)')
    .eq('jobs.employer_id', employerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toMatch);
}

/** Insert or update a match record (upsert on job_id + homeless_profile_id). */
export async function upsertMatch(params: {
  jobId: string;
  residentId: string;
  score: number;
  status: JobMatch['status'];
}): Promise<JobMatch> {
  if (!isSupabaseConfigured) {
    return {
      id: crypto.randomUUID(),
      jobId: params.jobId,
      residentId: params.residentId,
      status: params.status,
      score: params.score,
      requestedAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('job_matches')
    .upsert(
      {
        job_id: params.jobId,
        homeless_profile_id: params.residentId,
        match_status: params.status,
        score: params.score,
      },
      { onConflict: 'job_id,homeless_profile_id' },
    )
    .select()
    .single();

  if (!error && data) return toMatch(data);

  // Fallback for legacy match_status
  const dbStatus =
    params.status === 'shelter_approved'
      ? 'hired'
      : params.status === 'worker_declined' || params.status === 'shelter_declined'
      ? 'rejected'
      : 'pending';

  const { data: legacyData, error: legacyError } = await supabase
    .from('job_matches')
    .upsert(
      {
        job_id: params.jobId,
        homeless_profile_id: params.residentId,
        match_status: dbStatus,
        score: params.score,
      },
      { onConflict: 'job_id,homeless_profile_id' },
    )
    .select()
    .single();

  if (legacyError) throw new Error(legacyError.message);
  return toMatch(legacyData);
}

/** Update the status of an existing match. */
export async function updateMatchStatus(id: string, status: JobMatch['status']): Promise<void> {
  if (!isSupabaseConfigured) return;

  const timestamps: Record<string, string> = {};
  if (status === 'worker_accepted' || status === 'worker_declined') {
    timestamps.worker_decided_at = new Date().toISOString();
  }
  if (status === 'shelter_approved' || status === 'shelter_declined') {
    timestamps.shelter_decided_at = new Date().toISOString();
  }

  // Attempt 1: Direct status & timestamp update
  const { error } = await supabase
    .from('job_matches')
    .update({ match_status: status, ...timestamps })
    .eq('id', id);

  if (!error) return;

  // Fallback to legacy status
  const dbStatus =
    status === 'shelter_approved'
      ? 'hired'
      : status === 'worker_declined' || status === 'shelter_declined'
      ? 'rejected'
      : 'pending';

  const { error: legacyErr } = await supabase
    .from('job_matches')
    .update({ match_status: dbStatus })
    .eq('id', id);

  if (legacyErr) throw new Error(legacyErr.message);
}
