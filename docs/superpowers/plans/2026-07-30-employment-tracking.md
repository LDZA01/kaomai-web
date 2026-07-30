# Employment Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shelter-only employment-tracking workflow with scheduled follow-ups, check-in history, support states, and guarded employment ending.

**Architecture:** Keep cadence, urgency, and validation rules in a pure tested module. Add normalized Supabase tracking/check-in tables plus mock-mode helpers, then build one dedicated dashboard that orchestrates start tracking, check-ins, history, filtering, and ending employment.

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind CSS, Supabase Postgres/RLS, Vitest

## Global Constraints

- First-week follow-ups are due daily for employment days 1–7.
- After day 7, cadence is fortnightly or monthly and may be overridden.
- Ending employment preserves records and check-in history.
- Private case-manager notes remain shelter-only.
- Existing participant, matching, and dashboard pages continue working if the migration is absent.
- Mobile layouts reflow without horizontal scrolling and controls remain at least 44px.

---

### Task 1: Tested employment-tracking rules

**Files:**
- Create: `src/lib/employment-tracking.test.ts`
- Create: `src/lib/employment-tracking.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: tracking/check-in types, `getDefaultNextFollowUp`, `getTrackingUrgency`, `sortTrackingsByUrgency`, and `validateEmploymentEnd`.

- [ ] Write failing tests for daily first-week scheduling, day-8 fortnightly/monthly scheduling, overdue/today/upcoming urgency, urgent-first sorting, and required employment-ending fields.
- [ ] Run the focused tests and observe failure because the module is absent.
- [ ] Implement minimal pure functions and types.
- [ ] Re-run focused tests and confirm green.

### Task 2: Schema, mock fixtures, and data access

**Files:**
- Create: `supabase/migrations/016_employment_tracking.sql`
- Modify: `src/data/mockData.ts`
- Create: `src/lib/employment-tracking-db.ts`

**Interfaces:**
- Produces: `getEmploymentTrackings`, `getEmploymentCheckIns`, `startEmploymentTracking`, `addEmploymentCheckIn`, and `endEmploymentTracking`.

- [ ] Add tables, constraints, indexes, shelter-scoped RLS, cross-shelter validation, and update timestamps.
- [ ] Add representative active, urgent, overdue, and ended mock records with check-ins.
- [ ] Implement Supabase and mock-mode row mapping and writes.
- [ ] Ensure missing-table errors are surfaced for the tracking page only.

### Task 3: Work-tracking dashboard

**Files:**
- Create: `src/components/platform/WorkTrackingDashboard.tsx`
- Create: `src/app/(platform)/shelter/work-tracking/page.tsx`
- Modify: `src/components/platform/AppShell.tsx`

**Interfaces:**
- Consumes: Task 1 helpers, Task 2 data functions, residents, jobs, matches, and case managers.
- Produces: summary, urgency queue, active/ended filters, tracking history, start-tracking action, and sidebar route.

- [ ] Load independent datasets in parallel and preserve a migration-missing state.
- [ ] Render due, overdue, active, and support metrics.
- [ ] Render urgency-ordered records and an accessible selected-record history.
- [ ] Add active/ended/urgent/case-manager filters and responsive structural reflow.

### Task 4: Check-in and ending workflows

**Files:**
- Modify: `src/components/platform/WorkTrackingDashboard.tsx`

**Interfaces:**
- Produces: check-in dialog and guarded employment-ending dialog.

- [ ] Add attendance, adjustment, feedback, private note, cadence, and next-date fields.
- [ ] Save a check-in, refresh history, and update the next follow-up/support state.
- [ ] Require end date, reason, final note, return-to-matching decision, and explicit confirmation.
- [ ] Preserve all history and display ended records separately.

### Task 5: Verification

**Files:**
- Modify only files with defects discovered during verification.

**Interfaces:**
- Verifies the whole feature.

- [ ] Run `npm run lint && npm test && git diff --check`.
- [ ] Run `npm run build`.
- [ ] Verify route identity, urgency ordering, filters, check-in form, guarded end form, empty/missing-migration behavior, console health, and no framework overlay.
- [ ] Verify desktop and 390px mobile layouts with no horizontal overflow.
