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
const toResident = (row: any): Resident => ({
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
  hasIdCard: row.has_id_card ?? null,
  idCardStatus: row.id_card_status ?? (row.has_id_card === true ? 'has_card' : row.has_id_card === false ? 'not_started' : undefined),
  availableDays: row.available_days ?? [],
  availableFrom: row.available_from?.slice?.(0, 5) ?? undefined,
  availableTo: row.available_to?.slice?.(0, 5) ?? undefined,
});

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
const toMatch = (row: any): JobMatch => ({
  id: row.id,
  jobId: row.job_id,
  residentId: row.homeless_profile_id,
  status: (row.match_status === 'pending' ? 'suggested' : row.match_status === 'hired' ? 'shelter_approved' : row.match_status === 'rejected' ? 'worker_declined' : row.match_status) as JobMatch['status'],
  score: row.score,
  requestedAt: row.created_at,
});

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

  const { data, error } = await supabase
    .from('shelters')
    .update({
      name: shelter.name,
      address: shelter.address,
      contact_info: shelter.contactInfo,
      phone: shelter.phone ?? null,
      emergency_phone: shelter.emergencyPhone ?? null,
    })
    .eq('id', shelter.id)
    .select()
    .single();

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

  const payload: Record<string, unknown> = {
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
  if (resident.id) payload.id = resident.id;

  const { data, error } = await supabase
    .from('homeless_profiles')
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toResident(data);
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

  if (error) throw new Error(error.message);
  return toMatch(data);
}

/** Update the status of an existing match. */
export async function updateMatchStatus(id: string, status: JobMatch['status']): Promise<void> {
  if (!isSupabaseConfigured) return;

  const timestamps: Record<string, string> = {};
  if (status === 'worker_accepted' || status === 'worker_declined') timestamps.worker_decided_at = new Date().toISOString();
  if (status === 'shelter_approved' || status === 'shelter_declined') timestamps.shelter_decided_at = new Date().toISOString();
  const { error } = await supabase
    .from('job_matches')
    .update({ match_status: status, ...timestamps })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
