# Case Manager Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let shelters maintain reusable case-manager contacts, assign one to each participant, and show the assigned manager's name and phone to employers.

**Architecture:** Add a normalized `case_managers` table and nullable participant foreign key, then expose focused CRUD helpers through the existing data layer. Shelter participant management owns manager creation and assignment; employer matching receives only a resolved public contact object.

**Tech Stack:** Next.js 16, React 18, TypeScript, Supabase Postgres/RLS, Vitest, Tailwind CSS

## Global Constraints

- One case manager may be assigned to multiple participants.
- Each participant has at most one assigned case manager.
- Employers can see only the assigned case manager's name and phone.
- Existing unassigned participants must continue to work.
- Deleting a case manager must clear assignments rather than delete participants.
- Medical information and documents remain private.
- Mock mode must work without Supabase credentials.

---

### Task 1: Domain model and display behavior

**Files:**
- Create: `src/lib/case-managers.test.ts`
- Create: `src/lib/case-managers.ts`
- Modify: `src/types/index.ts`
- Modify: `src/data/mockData.ts`

**Interfaces:**
- Produces: `CaseManager`, `CaseManagerContact`, `formatCaseManagerAssignment(contact)`
- Extends: `Resident.caseManagerId?: string`, `Resident.caseManager?: CaseManagerContact`

- [ ] **Step 1: Write the failing tests**

Test that an assigned manager formats as `ชื่อ · เบอร์โทร`, an unassigned manager formats as `ยังไม่ได้มอบหมาย`, and whitespace-only fields are rejected by `validateCaseManager`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/case-managers.test.ts`
Expected: FAIL because `src/lib/case-managers.ts` does not exist.

- [ ] **Step 3: Implement the domain helpers and mock fixtures**

Add the manager/contact interfaces, validation and formatting helpers, two shelter-owned mock managers, and assign the same manager to multiple mock residents.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/lib/case-managers.test.ts`
Expected: all case-manager unit tests pass.

### Task 2: Supabase schema and data access

**Files:**
- Create: `supabase/migrations/015_case_manager_assignments.sql`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces: `getCaseManagers(shelterId)`, `upsertCaseManager(manager)`, `deleteCaseManager(id)`.
- Updates: `getResidents`, `getAllResidents`, and `upsertResident` to map `case_manager_id` and resolved contact.

- [ ] **Step 1: Add the migration**

Create `case_managers` with shelter ownership, timestamps, indexes, RLS CRUD policies, and a trigger/check that prevents cross-shelter assignment. Add nullable `homeless_profiles.case_manager_id` with `ON DELETE SET NULL`.

- [ ] **Step 2: Add mock and Supabase CRUD**

Map snake_case rows into `CaseManager`; return shelter-filtered mock managers when Supabase is unavailable; trim name and phone before writes.

- [ ] **Step 3: Resolve safe employer contact data**

Select the assigned relation as `case_manager:case_managers(name,phone)` in employer reads. Do not add medical or document fields to that select.

- [ ] **Step 4: Verify types**

Run: `npm run lint`
Expected: TypeScript exits successfully.

### Task 3: Shelter assignment and manager maintenance UI

**Files:**
- Modify: `src/components/platform/ResidentsManager.tsx`

**Interfaces:**
- Consumes: case-manager CRUD functions and `Resident.caseManagerId`.
- Produces: responsive manager list/editor and participant assignment selector.

- [ ] **Step 1: Load managers with participants**

Fetch the shelter's case managers, preserve explicit loading/error states, and resolve manager names on participant cards.

- [ ] **Step 2: Add compact manager maintenance**

Add a shelter-only section for creating, editing, and deleting managers with required name and phone fields. Confirm deletion and explain that affected participants become unassigned.

- [ ] **Step 3: Add participant assignment**

Add optional `caseManagerId` selection to the participant create/edit form and include it in `upsertResident`. Keep entered participant values when a save fails.

- [ ] **Step 4: Verify responsive semantics**

Ensure all actions have accessible labels, touch targets are at least 40px, and controls stack without horizontal overflow at 320px.

### Task 4: Employer contact card

**Files:**
- Modify: `src/components/platform/MatchesBoard.tsx`

**Interfaces:**
- Consumes: `expandedResident.caseManager`.
- Produces: employer-visible assigned-manager card with a `tel:` action.

- [ ] **Step 1: Add the assigned contact card**

Place `ผู้จัดการรายกรณี` near the shelter contact card. Display manager name and a call action when assigned.

- [ ] **Step 2: Add the unassigned state**

Render `ยังไม่ได้มอบหมายผู้จัดการรายกรณี` with no phone action when the relation is absent.

- [ ] **Step 3: Check privacy boundaries**

Confirm the employer query and modal do not expose `chronicConditions` or documents.

### Task 5: Integrated verification

**Files:**
- Modify as needed only for defects found during verification.

**Interfaces:**
- Verifies all earlier deliverables together.

- [ ] **Step 1: Run static and unit verification**

Run: `npm run lint && npm test && git diff --check`
Expected: TypeScript succeeds, all tests pass, and no whitespace errors are reported.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Next.js produces all routes successfully.

- [ ] **Step 3: Run browser QA**

In mock mode, verify one manager appears on multiple shelter participants, assignment can be changed, employer preview displays name and phone, the unassigned state has no call link, and desktop plus 320px mobile views have no horizontal overflow or console errors.

- [ ] **Step 4: Document deployment**

Report `supabase/migrations/015_case_manager_assignments.sql` as the SQL file to apply when the local environment cannot authenticate to the remote Supabase project.
