# Job Minimum Match Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let employers set a per-job minimum compatibility score and filter recommended candidates while preserving descending score order and existing offer workflows.

**Architecture:** Add a constrained score type and pure validation/filter helpers, persist the field on `jobs`, and thread it through job creation and display. Filter only the recommended ranked candidates; sent and approved match collections remain independent.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL, Vitest.

## Global Constraints

- Allowed values are exactly `0`, `25`, `50`, and `75`.
- New jobs default to `50`; existing jobs default to `0`.
- Recommended candidates remain ordered highest to lowest.
- Sent and approved matches remain visible below the threshold.
- No RLS policy changes.

---

### Task 1: Score domain and filtering

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/employer-job-browser.ts`
- Modify: `src/lib/employer-job-browser.test.ts`

**Interfaces:**
- Produces `MinimumMatchScore`, `parseMinimumMatchScore(value): MinimumMatchScore`, and `filterCandidatesByMinimumScore(candidates, minimum): candidates`.

- [ ] Write failing tests for allowed values, invalid values, exact-boundary inclusion, and descending-order preservation.
- [ ] Run the focused test and verify RED.
- [ ] Implement the minimal type and pure helpers.
- [ ] Run focused and full tests and verify GREEN.

### Task 2: Database persistence

**Files:**
- Create: `supabase/migrations/017_job_minimum_match_score.sql`
- Modify: `src/lib/db.ts`
- Modify: `src/data/mockData.ts`

**Interfaces:**
- Adds `jobs.minimum_match_score integer not null default 0` with an allowed-values check constraint.
- Maps missing legacy rows to `0` and writes `minimum_match_score` on insert.

- [ ] Add the idempotent additive migration without changing RLS.
- [ ] Update database row mapping and create payload.
- [ ] Add representative values to every mock job.
- [ ] Run TypeScript and tests.

### Task 3: Create form and job cards

**Files:**
- Modify: `src/components/platform/CreateJobForm.tsx`
- Modify: `src/components/platform/EmployerJobsIndex.tsx`

- [ ] Add a required four-choice radio group after skills, defaulting to `50%`.
- [ ] Parse and submit the selected threshold.
- [ ] Show `เกณฑ์ขั้นต่ำ N%` on every job card.
- [ ] Count only candidates meeting the threshold while retaining the all-candidate highest score.
- [ ] Run TypeScript and tests.

### Task 4: Candidate-page filtering and verification

**Files:**
- Modify: `src/components/platform/MatchesBoard.tsx`

- [ ] Filter only the recommended ranked collection using the job threshold.
- [ ] Show the threshold in the job summary and threshold-aware empty copy.
- [ ] Keep sent and approved matches unchanged.
- [ ] Run full tests, lint, production build, desktop/mobile browser checks, and `git diff --check`.

