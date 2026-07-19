import type { Job, JobMatch, Resident } from '../types';

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Calculates match score between candidate skills and required job skills.
 * Supports exact match as well as partial substring matches.
 */
export const calculateMatchScore = (residentSkills: string[], requiredSkills: string[]) => {
  if (requiredSkills.length === 0) return 100;

  const normalizedResidentSkills = residentSkills.map(normalize);

  let hits = 0;
  for (const req of requiredSkills) {
    const normReq = normalize(req);
    const hasMatch = normalizedResidentSkills.some(
      (resSkill) => resSkill.includes(normReq) || normReq.includes(resSkill),
    );
    if (hasMatch) hits++;
  }

  return Math.round((hits / requiredSkills.length) * 100);
};

export const rankResidentsForJob = (job: Job, residents: Resident[]) => {
  const candidateMatches = residents
    .filter((resident) => resident.workAvailability)
    .map((resident) => {
      const score = calculateMatchScore(resident.skills, job.requiredSkills);
      const matchedSkills = resident.skills.filter((skill) => {
        const normSkill = normalize(skill);
        return job.requiredSkills.some(
          (req) => normalize(req).includes(normSkill) || normSkill.includes(normalize(req)),
        );
      });
      return { resident, score, matchedSkills };
    })
    .sort((a, b) => b.score - a.score);

  // If matches with score > 0 exist, return them; otherwise return all available candidates so employer can still view them
  const positiveMatches = candidateMatches.filter((m) => m.score > 0);
  return positiveMatches.length > 0 ? positiveMatches : candidateMatches;
};

export const getEnrichedMatches = (matches: JobMatch[], jobs: Job[], residents: Resident[]) =>
  matches
    .map((match) => ({
      ...match,
      job: jobs.find((job) => job.id === match.jobId),
      resident: residents.find((resident) => resident.id === match.residentId),
    }))
    .filter((match) => match.job && match.resident);
