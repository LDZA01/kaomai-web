# Case Management Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shelter dashboard for balancing case-manager workloads, assigning unowned participants, and coordinating participant matching activity.

**Architecture:** Keep derived case-management logic in a pure tested helper module. A dedicated client dashboard loads residents, case managers, and matches in parallel through the existing data layer; the route and shell only compose navigation and the new screen.

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind CSS, Supabase data helpers, Vitest

## Global Constraints

- Reuse existing participant, case-manager, and match data; add no database columns.
- Keep the dashboard inside the shelter workspace at `/shelter/case-management`.
- Use text with every status and workload signal.
- Preserve the existing Kao Mai design tokens, Noto Sans Thai, 10–12px controls, and 44px targets.
- Mobile layouts must reflow without horizontal scrolling.
- Mock mode and Supabase mode must both work.

---

### Task 1: Tested case-management derivation

**Files:**
- Create: `src/lib/case-management.test.ts`
- Create: `src/lib/case-management.ts`

**Interfaces:**
- Consumes: `CaseManager`, `Resident`, and `JobMatch`.
- Produces: `getCaseManagerWorkloads`, `getLatestMatchByResident`, `getCoordinationStatus`, and `CASE_MANAGER_CAPACITY`.

- [ ] Write tests proving one manager can own several participants, unassigned residents are excluded from manager counts, the latest match is selected by `requestedAt`, and every match state maps to the specified Thai coordination label.
- [ ] Run `npm test -- src/lib/case-management.test.ts` and observe failure because the helper module does not exist.
- [ ] Implement the smallest pure functions needed by the tests, with recommended capacity set to five participants.
- [ ] Re-run the focused test and confirm all assertions pass.

### Task 2: Dashboard surface and route

**Files:**
- Create: `src/components/platform/CaseManagementDashboard.tsx`
- Create: `src/app/(platform)/shelter/case-management/page.tsx`

**Interfaces:**
- Consumes: `getResidents(shelterId)`, `getCaseManagers(shelterId)`, `getMatchesForShelter(shelterId)`, and Task 1 helpers.
- Produces: responsive priority metrics, workload list, unassigned queue, manager filter, and participant portfolio.

- [ ] Load all three independent datasets in parallel and expose loading and error states.
- [ ] Build four compact priority metrics with useful links instead of decorative statistics.
- [ ] Build a two-column operational band: manager workload with `tel:` actions and unassigned participants with assignment links.
- [ ] Build a divided participant portfolio with manager filter, status labels, and links to participant management/matching.
- [ ] Ensure empty states teach the next action and every interactive target is at least 44px.

### Task 3: Shelter navigation

**Files:**
- Modify: `src/components/platform/AppShell.tsx`

**Interfaces:**
- Produces: shelter sidebar link `การดูแลรายกรณี` targeting `/shelter/case-management`.

- [ ] Add the navigation item with an existing Lucide icon and preserve active-state behavior on desktop and mobile.
- [ ] Run `npm run lint` and fix any TypeScript errors.

### Task 4: Verification

**Files:**
- Modify only files with defects discovered during verification.

**Interfaces:**
- Verifies the full dashboard flow.

- [ ] Run `npm run lint && npm test && git diff --check`.
- [ ] Run `npm run build`.
- [ ] In mock mode, verify route identity, workload counts, over-capacity/normal labels, unassigned queue, manager filtering, link destinations, console health, and no framework overlay.
- [ ] Verify desktop and 320–390px mobile reflow with no horizontal overflow.
