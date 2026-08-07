# Weighted Candidate Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace misleading skills-only 0% recommendations with transparent weighted skill, work-type, and readiness scoring.

**Architecture:** Keep scoring as a pure function in `src/lib/matching.ts`, extend `Job` with nullable legacy-compatible work-type data, and persist the new value through the existing database mapper. Candidate consumers continue receiving `{ resident, score, matchedSkills }`, so UI changes remain limited to job metadata and empty-state behavior.

**Tech Stack:** TypeScript, React, Next.js, Vitest, Supabase/Postgres.

## Global Constraints

- Skills contribute 70%, work type 20%, and readiness 10% when those components apply.
- Missing job-side data is excluded and remaining weights are normalized to 100.
- Only work-ready residents are ranked; no all-zero fallback is allowed.
- Recommended candidates remain subject to the per-job minimum threshold.
- Existing jobs without work type remain valid.

---

### Task 1: Weighted scoring and ranking

**Files:**
- Create: `src/lib/matching.test.ts`
- Modify: `src/lib/matching.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `calculateMatchScore(resident: Pick<Resident, 'skills' | 'preferredWorkType' | 'workAvailability'>, job: Pick<Job, 'requiredSkills' | 'workType'>): number`
- Produces: `rankResidentsForJob(job: Job, residents: Resident[]): RankedResident[]`

- [ ] Write failing Vitest cases with literal expected results for full matches, partial weighted matches, missing work type, unavailable residents, deterministic descending order, and all-zero removal.
- [ ] Run `npm test -- src/lib/matching.test.ts` and confirm failures reflect the old signature and fallback.
- [ ] Add `workType?: PreferredWorkType` to `Job` and implement weighted, normalized scoring plus deterministic ranking.
- [ ] Run `npm test -- src/lib/matching.test.ts` and confirm all matching tests pass.

### Task 2: Job creation and database persistence

**Files:**
- Modify: `src/components/platform/CreateJobForm.tsx`
- Modify: `src/lib/db.ts`
- Modify: `src/data/mockData.ts`
- Create: `supabase/migrations/018_job_work_type.sql`

**Interfaces:**
- Consumes: `Job.workType?: PreferredWorkType`
- Persists: `public.jobs.work_type text null check (work_type in ('full_time', 'part_time'))`

- [ ] Add a required full-time/part-time radio group to new-job creation and include the selected value in `createJob`.
- [ ] Map `work_type` in both database directions and assign representative values to mock jobs.
- [ ] Add the nullable, constrained migration so legacy rows remain valid.
- [ ] Run `npm run lint` and fix only errors caused by this task.

### Task 3: Employer display and regression verification

**Files:**
- Modify: `src/components/platform/EmployerJobsIndex.tsx`
- Modify: `src/components/platform/MatchesBoard.tsx`
- Modify: `src/lib/employer-job-browser.test.ts`

**Interfaces:**
- Consumes: weighted results from `rankResidentsForJob` and `Job.workType`.

- [ ] Update job fixtures for the new optional field and display Thai work-type labels on job index/detail surfaces.
- [ ] Ensure the recommended empty state communicates the minimum score and no fallback candidates are presented.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Inspect desktop and 390px mobile employer job pages in a browser and confirm percentages, order, labels, and overflow behavior.
