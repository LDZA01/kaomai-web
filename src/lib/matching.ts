import type { Job, JobMatch, Resident } from '../types';

const normalize = (value: string) => value.trim().toLowerCase();

const calculateSkillRatio = (residentSkills: string[], requiredSkills: string[]) => {
  if (requiredSkills.length === 0) return 0;
  const normalizedResidentSkills = residentSkills.map(normalize).filter(Boolean);
  const hits = requiredSkills.reduce((total, req) => {
    const normReq = normalize(req);
    const hasMatch = normalizedResidentSkills.some(
      (resSkill) => resSkill.includes(normReq) || normReq.includes(resSkill),
    );
    return total + (hasMatch ? 1 : 0);
  }, 0);

  return hits / requiredSkills.length;
};

/** Calculates a transparent skills/work-type/readiness compatibility score. */
export const calculateMatchScore = (
  resident: Pick<Resident, 'skills' | 'preferredWorkType' | 'workAvailability'>,
  job: Pick<Job, 'requiredSkills' | 'workType'>,
) => {
  const components: Array<{ weight: number; ratio: number }> = [];

  if (job.requiredSkills.length > 0) {
    components.push({ weight: 70, ratio: calculateSkillRatio(resident.skills, job.requiredSkills) });
  }
  if (job.workType) {
    components.push({ weight: 20, ratio: resident.preferredWorkType === job.workType ? 1 : 0 });
  }
  components.push({ weight: 10, ratio: resident.workAvailability ? 1 : 0 });

  const availableWeight = components.reduce((total, component) => total + component.weight, 0);
  const earnedWeight = components.reduce(
    (total, component) => total + component.weight * component.ratio,
    0,
  );

  return Math.round((earnedWeight / availableWeight) * 100);
};

export const rankResidentsForJob = (job: Job, residents: Resident[]) => {
  const candidateMatches = residents
    .filter((resident) => resident.workAvailability)
    .map((resident) => {
      const score = calculateMatchScore(resident, job);
      const matchedSkills = resident.skills.filter((skill) => {
        const normSkill = normalize(skill);
        return job.requiredSkills.some(
          (req) => normalize(req).includes(normSkill) || normSkill.includes(normalize(req)),
        );
      });
      return { resident, score, matchedSkills };
    })
    .sort((a, b) => b.score - a.score || a.resident.name.localeCompare(b.resident.name, 'th'));

  return candidateMatches;
};

export const getEnrichedMatches = (matches: JobMatch[], jobs: Job[], residents: Resident[]) =>
  matches
    .map((match) => ({
      ...match,
      job: jobs.find((job) => job.id === match.jobId),
      resident: residents.find((resident) => resident.id === match.residentId),
    }))
    .filter((match) => match.job && match.resident);
