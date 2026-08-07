import type { Job, JobMatch, MinimumMatchScore } from '@/types';

const MINIMUM_MATCH_SCORES = new Set<MinimumMatchScore>([0, 25, 50, 75]);

const JOB_STATUS_ORDER: Record<Job['status'], number> = {
  open: 0,
  draft: 1,
  filled: 2,
};

export function sortEmployerJobs(jobs: Job[]): Job[] {
  return jobs
    .map((job, index) => ({ job, index }))
    .sort(
      (a, b) =>
        JOB_STATUS_ORDER[a.job.status] - JOB_STATUS_ORDER[b.job.status] ||
        a.index - b.index,
    )
    .map(({ job }) => job);
}

export function getDefaultEmployerJobId(jobs: Job[]): string {
  return jobs.find((job) => job.status === 'open')?.id ?? jobs[0]?.id ?? '';
}

export function getMatchesForJob(matches: JobMatch[], jobId: string): JobMatch[] {
  if (!jobId) return [];
  return matches.filter((match) => match.jobId === jobId);
}

export function findEmployerJobById(jobs: Job[], jobId: string): Job | undefined {
  if (!jobId) return undefined;
  return jobs.find((job) => job.id === jobId);
}

export function parseMinimumMatchScore(value: unknown): MinimumMatchScore {
  const score = Number(value);
  if (!MINIMUM_MATCH_SCORES.has(score as MinimumMatchScore)) {
    throw new Error('คะแนนความสอดคล้องขั้นต่ำไม่ถูกต้อง');
  }
  return score as MinimumMatchScore;
}

export function parseStoredMinimumMatchScore(value: unknown): MinimumMatchScore {
  return value == null || Number(value) === 0 ? 50 : parseMinimumMatchScore(value);
}

export function filterCandidatesByMinimumScore<T extends { score: number }>(
  candidates: T[],
  minimumMatchScore: MinimumMatchScore,
): T[] {
  return candidates.filter((candidate) => candidate.score >= minimumMatchScore);
}

export function partitionCandidatesByMinimumScore<T extends { score: number }>(
  candidates: T[],
  minimumMatchScore: MinimumMatchScore,
): { qualified: T[]; belowThreshold: T[] } {
  return candidates.reduce<{ qualified: T[]; belowThreshold: T[] }>(
    (groups, candidate) => {
      groups[candidate.score >= minimumMatchScore ? 'qualified' : 'belowThreshold'].push(candidate);
      return groups;
    },
    { qualified: [], belowThreshold: [] },
  );
}
