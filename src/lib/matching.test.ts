import { describe, expect, it } from 'vitest';
import type { Job, Resident } from '@/types';
import { calculateMatchScore, rankResidentsForJob } from './matching';

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  employerId: 'employer-1',
  title: 'ผู้ช่วยครัว',
  description: '',
  requiredSkills: ['ทำอาหาร', 'ทำความสะอาด'],
  workType: 'full_time',
  location: 'กรุงเทพมหานคร',
  dailyWage: 500,
  minimumMatchScore: 0,
  status: 'open',
  ...overrides,
});

const makeResident = (overrides: Partial<Resident> = {}): Resident => ({
  id: 'resident-1',
  shelterId: 'shelter-1',
  name: 'กานต์',
  age: 30,
  skills: ['ทำอาหาร'],
  availability: 'เต็มเวลา',
  workAvailability: true,
  preferredWorkType: 'full_time',
  ...overrides,
});

describe('weighted candidate matching', () => {
  it('combines skill, work-type, and readiness weights', () => {
    expect(calculateMatchScore(makeResident(), makeJob())).toBe(65);
    expect(calculateMatchScore(makeResident({ skills: [] }), makeJob())).toBe(30);
  });

  it('re-normalizes the score when a legacy job has no work type', () => {
    const legacyJob = makeJob({ workType: undefined });

    expect(calculateMatchScore(makeResident(), legacyJob)).toBe(56);
    expect(calculateMatchScore(makeResident({ skills: [] }), legacyJob)).toBe(13);
  });

  it('gives an available candidate 100 when a job declares no compatibility constraints', () => {
    expect(calculateMatchScore(makeResident({ skills: [] }), makeJob({ requiredSkills: [], workType: undefined }))).toBe(100);
  });

  it('excludes unavailable residents and orders ties deterministically by name', () => {
    const residents = [
      makeResident({ id: 'b', name: 'บี', skills: [] }),
      makeResident({ id: 'unavailable', name: 'เอ', workAvailability: false }),
      makeResident({ id: 'a', name: 'กานต์', skills: [] }),
      makeResident({ id: 'top', name: 'ซี', skills: ['ทำอาหาร', 'ทำความสะอาด'] }),
    ];

    expect(rankResidentsForJob(makeJob(), residents).map(({ resident, score }) => [resident.id, score])).toEqual([
      ['top', 100],
      ['a', 30],
      ['b', 30],
    ]);
  });
});
