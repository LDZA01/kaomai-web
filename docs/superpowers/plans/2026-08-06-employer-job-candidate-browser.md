# Employer Jobs Index and Per-Job Candidates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/employer/matches` a jobs-only index and open each job's ranked candidates on `/employer/matches/job?jobId=<id>`.

**Architecture:** Add a focused `EmployerJobsIndex` client component for loading and rendering owned job cards. Keep the employer candidate workflow in `MatchesBoard`, but require a `jobId` for employer mode, resolve it only from jobs returned for the authenticated employer, and render a guarded not-found state when ownership fails.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, existing Supabase/mock data access.

## Global Constraints

- `/employer/matches` renders jobs only.
- `/employer/matches/job?jobId=<id>` renders candidates only for an owned job.
- Do not change the database schema or RLS policies.
- Preserve the shelter matching UI and behavior.
- Keep scores ordered from highest to lowest.
- Support 390px mobile layouts without horizontal overflow.

---

### Task 1: Owned-job route helper

**Files:**
- Modify: `src/lib/employer-job-browser.ts`
- Modify: `src/lib/employer-job-browser.test.ts`

**Interfaces:**
- Produces: `findEmployerJobById(jobs: Job[], jobId: string): Job | undefined`.

- [ ] Write a failing test proving a matching owned job is returned and an absent/empty ID returns `undefined`.
- [ ] Run `npm test -- src/lib/employer-job-browser.test.ts` and verify RED.
- [ ] Implement the minimal `find` helper.
- [ ] Re-run the focused test and verify GREEN.

### Task 2: Jobs-only index

**Files:**
- Create: `src/components/platform/EmployerJobsIndex.tsx`
- Modify: `src/app/(platform)/employer/matches/page.tsx`

**Interfaces:**
- Consumes: `getJobs`, `getAllResidents`, `getMatchesForEmployer`, `rankResidentsForJob`, `sortEmployerJobs`, and `getMatchesForJob`.
- Produces: linked job cards targeting `/employer/matches/job?jobId=${job.id}`.

- [ ] Move employer heading, create-job action, empty state, and job-card presentation into `EmployerJobsIndex`.
- [ ] Replace card buttons and selected styling with full-card `Link` elements and a visible `ดูผู้สมัคร` affordance.
- [ ] Remove all candidate tabs and candidate lists from the index route.
- [ ] Point the index page to `EmployerJobsIndex`.
- [ ] Run `npm run lint && npm test`.

### Task 3: Dedicated guarded candidate route

**Files:**
- Create: `src/app/(platform)/employer/matches/job/page.tsx`
- Create: `src/components/platform/EmployerJobCandidatesPage.tsx`
- Modify: `src/components/platform/MatchesBoard.tsx`

**Interfaces:**
- `MatchesBoard` accepts `{ role: 'shelter' | 'employer'; jobId?: string }`.
- Employer mode resolves `jobId` from employer-owned jobs and never falls back to another job.

- [ ] Read the static route's `jobId` query parameter inside a Suspense boundary and pass it to `<MatchesBoard role="employer" jobId={jobId} />`.
- [ ] Remove employer job-selection state and job-card UI from `MatchesBoard`.
- [ ] Add `กลับไปงานทั้งหมด` and a compact selected-job summary above candidate tabs.
- [ ] Render a guarded not-found state if `jobId` is missing or not in the authenticated employer's jobs.
- [ ] Keep match lookup and offer actions scoped by both route `jobId` and `residentId`.
- [ ] Run `npm run lint && npm test`.

### Task 4: Browser and production verification

**Files:**
- Modify only implementation files if verification finds a defect.

- [ ] Run `npm run build` and verify both `/employer/matches` and `/employer/matches/job` compile.
- [ ] In a browser, verify the index contains no candidate list and clicking a card changes the URL to the job route.
- [ ] Verify rankings, counts, offer actions, browser back navigation, and invalid/foreign job guards.
- [ ] Verify shelter matching is unchanged.
- [ ] Verify 390×844 has no horizontal overflow and console has no warnings/errors.
- [ ] Run final `npm run lint && npm test && npm run build && git diff --check`.
