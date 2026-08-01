# Resident Intake Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private medical notes, work-type and payment preferences, and secure supporting-document uploads to participant create/edit flows.

**Architecture:** Extend the resident domain model and Supabase schema, isolate document validation in a pure utility, add private Storage and metadata data-access functions, then connect those APIs to the existing `ResidentsManager` modal. Existing rows remain valid through optional fields, and employer screens never render medical or document data.

**Tech Stack:** Next.js 16, React 18, TypeScript, Vitest, Supabase Postgres/Storage, Tailwind CSS.

## Global Constraints

- Preserve all existing uncommitted auth and responsive changes.
- Accept only PDF, JPEG, PNG, and WebP documents.
- Allow at most five documents and at most 5 MB per file.
- Do not collect bank-account numbers or banking credentials.
- Do not render chronic conditions or document metadata on employer screens.
- Keep the Storage bucket private and use signed URLs for downloads.

---

### Task 1: Intake domain and validation

**Files:**
- Create: `src/lib/resident-intake.ts`
- Create: `src/lib/resident-intake.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/data/mockData.ts`

**Interfaces:**
- Produces: `ResidentDocument`, `DocumentCategory`, `PreferredWorkType`, `PaymentPreference`.
- Produces: `validateResidentDocuments(files, existingCount)` and Thai label helpers.

- [ ] **Step 1: Write failing validation and label tests**

Cover accepted MIME types, 5 MB boundary, five-file boundary, sanitized names, and Thai labels for both enums.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/resident-intake.test.ts`

Expected: FAIL because `resident-intake.ts` does not exist.

- [ ] **Step 3: Implement the domain types and pure helpers**

Use:

```ts
export type PreferredWorkType = 'full_time' | 'part_time';
export type PaymentPreference = 'cash' | 'bank_transfer';
export type DocumentCategory = 'education' | 'training' | 'employment' | 'other';
```

Validation returns a Thai error string or `null`; it does not mutate files.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/lib/resident-intake.test.ts`

- [ ] **Step 5: Add optional fields to mock residents**

Populate representative work/payment values while keeping at least one legacy record without them.

### Task 2: Supabase schema, storage, and data access

**Files:**
- Create: `supabase/migrations/014_resident_intake_details.sql`
- Modify: `src/lib/db.ts`
- Create: `src/lib/resident-documents.ts`

**Interfaces:**
- Produces: `getResidentDocuments(residentId)`.
- Produces: `uploadResidentDocument(shelterId, residentId, file, category)`.
- Produces: `deleteResidentDocument(document)`.
- Produces: `createResidentDocumentDownloadUrl(storagePath)`.

- [ ] **Step 1: Add resident columns and constraints**

Add nullable `chronic_conditions`, `preferred_work_type`, and `payment_preference` columns with enum checks.

- [ ] **Step 2: Add document metadata table and private bucket**

Create `resident_documents`, indexes, RLS policies tied to the authenticated shelter owner, the private `resident-documents` bucket, and matching Storage object policies.

- [ ] **Step 3: Extend resident row mapping and upsert payload**

Map all new columns both directions. Keep the existing core-column fallback so older databases still save the original resident fields.

- [ ] **Step 4: Implement storage helpers**

Use UUID-prefixed sanitized file names, upload with the exact MIME type, insert metadata only after upload succeeds, remove the uploaded object if metadata insertion fails, and create 60-second signed download URLs.

- [ ] **Step 5: Run TypeScript**

Run: `npm run lint`

Expected: PASS.

### Task 3: Participant form and shelter display

**Files:**
- Modify: `src/components/platform/ResidentsManager.tsx`

**Interfaces:**
- Consumes the Task 1 domain helpers and Task 2 storage APIs.

- [ ] **Step 1: Add form state for staged/existing documents**

Track staged files with category, existing metadata, IDs marked for removal, and inline document/save errors. Reset state on create and hydrate it on edit.

- [ ] **Step 2: Add medical, work, and payment controls**

Add the optional chronic-condition textarea and required accessible radio groups for work type and payment preference.

- [ ] **Step 3: Add document staging UI**

Add a multiple file input, category selector per file, file name/size display, remove actions, existing document download/removal controls, and inline validation.

- [ ] **Step 4: Extend submit sequencing**

Validate locally, upsert resident, upload staged documents, delete confirmed removals, refresh metadata, preserve the open form on failure, and show success only when the whole operation completes.

- [ ] **Step 5: Add shelter card labels**

Show work type and payment preference with `ยังไม่ระบุ` fallbacks. Keep medical and document data out of the card and all employer components.

- [ ] **Step 6: Run TypeScript and tests**

Run: `npm run lint && npm test`

Expected: all checks pass.

### Task 4: Rendered QA and production verification

**Files:**
- No committed test artifacts.

- [ ] **Step 1: Start the local app**

Run: `npm run dev`

- [ ] **Step 2: Verify desktop and mobile modal layout**

Test 1440×900 and 320×568. Confirm no horizontal overflow, all required controls are reachable, and document rows wrap without clipping.

- [ ] **Step 3: Verify interaction paths**

Exercise create/edit field population, valid document staging/removal, invalid file rejection, work/payment selection, and employer-screen privacy.

- [ ] **Step 4: Run final checks**

Run: `npm run lint && npm test && npm run build && git diff --check`

Expected: TypeScript clean, all tests pass, production build succeeds, and no whitespace errors.
