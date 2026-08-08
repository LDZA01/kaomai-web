import { describe, expect, it } from 'vitest';
import type { Job, JobMatch } from '@/types';
import {
  filterCandidatesByMinimumScore,
  findEmployerJobById,
  getDefaultEmployerJobId,
  getMatchesForJob,
  parseStoredMinimumMatchScore,
  partitionCandidatesByMinimumScore,
  parseMinimumMatchScore,
  sortEmployerJobs,
} from './employer-job-browser';

const job = (id: string, status: Job['status']): Job => ({
  id,
  employerId: 'employer-1',
  title: id,
  description: '',
  requiredSkills: [],
  location: 'กรุงเทพมหานคร',
  dailyWage: 500,
  minimumMatchScore: 0,
  status,
});

const match = (id: string, jobId: string): JobMatch => ({
  id,
  jobId,
  residentId: `resident-${id}`,
  status: 'suggested',
  score: 80,
  requestedAt: '2026-08-06T00:00:00.000Z',
});

describe('employer job browser', () => {
  it('orders open jobs before draft and filled jobs without mutating input', () => {
    const jobs = [job('filled', 'filled'), job('open', 'open'), job('draft', 'draft')];

    expect(sortEmployerJobs(jobs).map((item) => item.id)).toEqual(['open', 'draft', 'filled']);
    expect(jobs.map((item) => item.id)).toEqual(['filled', 'open', 'draft']);
  });

  it('preserves source order for jobs with the same status', () => {
    const jobs = [job('open-a', 'open'), job('open-b', 'open')];

    expect(sortEmployerJobs(jobs).map((item) => item.id)).toEqual(['open-a', 'open-b']);
  });

  it('selects the first open job or first available job', () => {
    expect(getDefaultEmployerJobId([job('draft', 'draft'), job('open', 'open')])).toBe('open');
    expect(getDefaultEmployerJobId([job('draft', 'draft'), job('filled', 'filled')])).toBe('draft');
    expect(getDefaultEmployerJobId([])).toBe('');
  });

  it('returns only matches belonging to the selected job', () => {
    const matches = [match('a', 'job-a'), match('b', 'job-b')];

    expect(getMatchesForJob(matches, 'job-a').map((item) => item.id)).toEqual(['a']);
    expect(getMatchesForJob(matches, '')).toEqual([]);
  });

  it('resolves only a job present in the employer-owned job collection', () => {
    const jobs = [job('owned-job', 'open')];

    expect(findEmployerJobById(jobs, 'owned-job')?.id).toBe('owned-job');
    expect(findEmployerJobById(jobs, 'other-job')).toBeUndefined();
    expect(findEmployerJobById(jobs, '')).toBeUndefined();
  });

  it('accepts only supported minimum match score values', () => {
    expect(parseMinimumMatchScore('0')).toBe(0);
    expect(parseMinimumMatchScore('25')).toBe(25);
    expect(parseMinimumMatchScore('50')).toBe(50);
    expect(parseMinimumMatchScore('75')).toBe(75);
    expect(() => parseMinimumMatchScore('60')).toThrow('คะแนนความสอดคล้องขั้นต่ำไม่ถูกต้อง');
  });

  it('uses 50 percent only when legacy jobs do not have a stored threshold', () => {
    expect(parseStoredMinimumMatchScore(null)).toBe(50);
    expect(parseStoredMinimumMatchScore(undefined)).toBe(50);
    expect(parseStoredMinimumMatchScore(0)).toBe(0);
    expect(parseStoredMinimumMatchScore(75)).toBe(75);
  });

  it('keeps candidates at or above the threshold without changing score order', () => {
    const candidates = [{ id: 'a', score: 100 }, { id: 'b', score: 50 }, { id: 'c', score: 25 }];

    expect(filterCandidatesByMinimumScore(candidates, 50)).toEqual([
      { id: 'a', score: 100 },
      { id: 'b', score: 50 },
    ]);
  });

  it('keeps below-threshold candidates visible in a separate ordered group', () => {
    const candidates = [{ id: 'a', score: 80 }, { id: 'b', score: 49 }, { id: 'c', score: 13 }];

    expect(partitionCandidatesByMinimumScore(candidates, 50)).toEqual({
      qualified: [{ id: 'a', score: 80 }],
      belowThreshold: [{ id: 'b', score: 49 }, { id: 'c', score: 13 }],
    });
  });
});
