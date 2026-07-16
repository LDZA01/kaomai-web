import type { Job, JobMatch, Resident } from '../types';

const normalize = (value: string) => value.trim().toLowerCase();

export const calculateMatchScore = (residentSkills: string[], requiredSkills: string[]) => {
  if (requiredSkills.length === 0) return 0;

  const residentSet = new Set(residentSkills.map(normalize));
  const hits = requiredSkills.filter((skill) => residentSet.has(normalize(skill))).length;

  return Math.round((hits / requiredSkills.length) * 100);
};

export const rankResidentsForJob = (job: Job, residents: Resident[]) =>
  residents
    .filter((resident) => resident.workAvailability)
    .map((resident) => ({
      resident,
      score: calculateMatchScore(resident.skills, job.requiredSkills),
      matchedSkills: resident.skills.filter((skill) =>
        job.requiredSkills.map(normalize).includes(normalize(skill)),
      ),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

export const getEnrichedMatches = (matches: JobMatch[], jobs: Job[], residents: Resident[]) =>
  matches
    .map((match) => ({
      ...match,
      job: jobs.find((job) => job.id === match.jobId),
      resident: residents.find((resident) => resident.id === match.residentId),
    }))
    .filter((match) => match.job && match.resident);
