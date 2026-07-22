# Shelter-to-Work Distance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store shelter and workplace coordinates, capture them through accessible forms, and show privacy-safe approximate distance on matching cards.

**Architecture:** A pure distance module validates coordinates and calculates Haversine distance. A reusable client-side location component handles browser geolocation and manual coordinate entry. Existing Supabase mappers and forms persist coordinates, while matching views derive distance without exposing raw shelter coordinates.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript 5.7, Supabase, Tailwind CSS, Vitest.

## Global Constraints

- Label all MVP results as **ระยะทางโดยประมาณจากศูนย์พักพิง**.
- Do not change the skill-match percentage based on distance.
- Do not automatically capture browser location; require an explicit button press.
- Do not render the shelter address or raw coordinates to employers before shelter approval.
- Preserve records that have no coordinates and display a graceful unavailable state.
- Validate latitude within `-90..90` and longitude within `-180..180`.
- Keep the distance provider replaceable by Google Maps Routes without database changes.

---

### Task 1: Distance Calculation and Test Runner

**Files:**
- Modify: `package.json`
- Create: `src/lib/distance.ts`
- Test: `src/lib/distance.test.ts`

**Interfaces:**
- Produces: `Coordinates`, `isValidCoordinates`, `distanceKilometers`, `getApproximateDistance`, and `formatDistanceThai`.
- Consumes: no application state or browser APIs.

- [ ] **Step 1: Add Vitest and the test command**

Run:

```bash
npm install --save-dev vitest
```

Add to `package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing distance tests**

Create `src/lib/distance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  distanceKilometers,
  formatDistanceThai,
  getApproximateDistance,
  isValidCoordinates,
} from './distance';

describe('distance utilities', () => {
  it('calculates a known Bangkok distance', () => {
    const km = distanceKilometers(
      { latitude: 13.7563, longitude: 100.5018 },
      { latitude: 13.7367, longitude: 100.5231 },
    );
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(4);
  });

  it('returns zero for identical coordinates', () => {
    expect(distanceKilometers(
      { latitude: 13.7563, longitude: 100.5018 },
      { latitude: 13.7563, longitude: 100.5018 },
    )).toBe(0);
  });

  it('rejects coordinates outside valid ranges', () => {
    expect(isValidCoordinates({ latitude: 91, longitude: 100 })).toBe(false);
    expect(isValidCoordinates({ latitude: 13, longitude: 181 })).toBe(false);
  });

  it('returns null when either location is missing', () => {
    expect(getApproximateDistance(undefined, { latitude: 13, longitude: 100 })).toBeNull();
  });

  it('formats short and long distances in Thai', () => {
    expect(formatDistanceThai(0.45)).toBe('ประมาณ 450 เมตร');
    expect(formatDistanceThai(8.43)).toBe('ประมาณ 8.4 กม.');
  });
});
```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm test -- src/lib/distance.test.ts`

Expected: FAIL because `src/lib/distance.ts` does not exist.

- [ ] **Step 4: Implement the minimal distance module**

Create `src/lib/distance.ts`:

```ts
export type Coordinates = { latitude: number; longitude: number };

export function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && value.longitude >= -180
    && value.longitude <= 180;
}

const radians = (degrees: number) => degrees * Math.PI / 180;

export function distanceKilometers(origin: Coordinates, destination: Coordinates): number {
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    throw new RangeError('Invalid coordinates');
  }
  const radius = 6371;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude))
    * Math.cos(radians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getApproximateDistance(
  origin?: Coordinates,
  destination?: Coordinates,
): number | null {
  if (!origin || !destination || !isValidCoordinates(origin) || !isValidCoordinates(destination)) return null;
  return distanceKilometers(origin, destination);
}

export function formatDistanceThai(kilometers: number): string {
  return kilometers < 1
    ? `ประมาณ ${Math.round(kilometers * 1000)} เมตร`
    : `ประมาณ ${kilometers.toFixed(1)} กม.`;
}
```

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- src/lib/distance.test.ts`

Expected: 5 tests PASS.

```bash
git add package.json package-lock.json src/lib/distance.ts src/lib/distance.test.ts
git commit -m "feat: add approximate distance calculator"
```

---

### Task 2: Coordinate Persistence

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/data/mockData.ts`
- Create: `supabase/migrations/011_shelter_job_coordinates.sql`

**Interfaces:**
- Consumes: `Coordinates` numeric ranges from Task 1.
- Produces: optional `latitude` and `longitude` on `Shelter` and `Job`; database mappers persist both.

- [ ] **Step 1: Extend model tests before production edits**

Add to `src/lib/distance.test.ts`:

```ts
it('accepts Bangkok coordinate boundaries used by persisted models', () => {
  expect(isValidCoordinates({ latitude: 13.7563, longitude: 100.5018 })).toBe(true);
});
```

Run: `npm test -- src/lib/distance.test.ts` and confirm PASS; this locks the coordinate contract before mapper changes.

- [ ] **Step 2: Add optional fields to domain types**

Add to both `Shelter` and `Job` in `src/types/index.ts`:

```ts
latitude?: number;
longitude?: number;
```

- [ ] **Step 3: Add the database migration**

Create `supabase/migrations/011_shelter_job_coordinates.sql`:

```sql
alter table public.shelters
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.jobs
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.shelters
  add constraint shelters_latitude_check check (latitude is null or latitude between -90 and 90),
  add constraint shelters_longitude_check check (longitude is null or longitude between -180 and 180);

alter table public.jobs
  add constraint jobs_latitude_check check (latitude is null or latitude between -90 and 90),
  add constraint jobs_longitude_check check (longitude is null or longitude between -180 and 180);
```

- [ ] **Step 4: Map and persist coordinates**

Update `toShelter` and `toJob` in `src/lib/db.ts`:

```ts
latitude: row.latitude == null ? undefined : Number(row.latitude),
longitude: row.longitude == null ? undefined : Number(row.longitude),
```

Include nullable coordinates in `createJob`, `updateShelterProfile`, and the fallback-safe payloads:

```ts
latitude: value.latitude ?? null,
longitude: value.longitude ?? null,
```

- [ ] **Step 5: Seed mock coordinates and verify**

Add Bangkok-area coordinates to the mock shelter and every mock job. Run:

```bash
npm test
npm run lint
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/db.ts src/data/mockData.ts supabase/migrations/011_shelter_job_coordinates.sql
git commit -m "feat: persist shelter and workplace coordinates"
```

---

### Task 3: Reusable Location Fields

**Files:**
- Create: `src/components/ui/LocationFields.tsx`
- Test: `src/lib/location-validation.test.ts`
- Create: `src/lib/location-validation.ts`

**Interfaces:**
- Consumes: `isValidCoordinates` from Task 1.
- Produces: `LocationFields({ addressName, addressLabel, defaultAddress, defaultLatitude, defaultLongitude })` and `parseOptionalCoordinates`.

- [ ] **Step 1: Write failing validation tests**

Create `src/lib/location-validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseOptionalCoordinates } from './location-validation';

describe('parseOptionalCoordinates', () => {
  it('returns undefined when both fields are blank', () => {
    expect(parseOptionalCoordinates('', '')).toBeUndefined();
  });

  it('returns numeric coordinates for a valid pair', () => {
    expect(parseOptionalCoordinates('13.7563', '100.5018')).toEqual({ latitude: 13.7563, longitude: 100.5018 });
  });

  it('throws when only one coordinate is supplied', () => {
    expect(() => parseOptionalCoordinates('13.7', '')).toThrow('กรุณากรอกพิกัดให้ครบทั้งสองช่อง');
  });
});
```

- [ ] **Step 2: Verify RED, implement, and verify GREEN**

Run: `npm test -- src/lib/location-validation.test.ts`

Expected: FAIL because module is missing.

Create `src/lib/location-validation.ts` using `isValidCoordinates`; return `undefined` for two blanks and throw Thai validation messages for incomplete or invalid pairs. Re-run and expect 3 tests PASS.

- [ ] **Step 3: Build the accessible location control**

Create `LocationFields.tsx` as a client component. Render address, latitude, and longitude fields plus a button:

```tsx
<button type="button" onClick={captureLocation} disabled={locating}>
  <MapPin size={18}/>
  {locating ? 'กำลังค้นหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'}
</button>
```

`captureLocation` must call `navigator.geolocation.getCurrentPosition` only after the click, fill controlled coordinate values to six decimals, preserve values on failure, and announce success/error through `role="status"` or `role="alert"`.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm test
npm run lint
```

Expected: all tests PASS and TypeScript exits 0.

```bash
git add src/components/ui/LocationFields.tsx src/lib/location-validation.ts src/lib/location-validation.test.ts
git commit -m "feat: add reusable location fields"
```

---

### Task 4: Shelter and Job Location Forms

**Files:**
- Modify: `src/components/platform/AccountPage.tsx`
- Modify: `src/components/providers/AuthProvider.tsx`
- Modify: `src/hooks/useAuth.ts`
- Modify: `src/components/platform/CreateJobForm.tsx`

**Interfaces:**
- Consumes: `LocationFields` and `parseOptionalCoordinates` from Task 3; model fields from Task 2.
- Produces: persisted shelter and workplace locations.

- [ ] **Step 1: Add location values to profile update contract**

Extend `updateProfile` in the provider and hook:

```ts
address: string;
latitude?: number;
longitude?: number;
```

For shelter accounts, pass these values to `updateShelterProfile`. Employer profile coordinates are not required because each job owns its workplace location.

- [ ] **Step 2: Integrate shelter location UI**

In `AccountPage`, render `LocationFields` only for the shelter role. Parse coordinates in `handleSubmit`; surface thrown validation text in the existing error alert and do not submit invalid data.

- [ ] **Step 3: Integrate workplace location UI**

Replace the current plain `location` field in `CreateJobForm` with `LocationFields`. Parse coordinates before `createJob` and include them in the job object.

- [ ] **Step 4: Verify form contracts**

Run:

```bash
npm test
npm run lint
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/platform/AccountPage.tsx src/components/providers/AuthProvider.tsx src/hooks/useAuth.ts src/components/platform/CreateJobForm.tsx
git commit -m "feat: capture shelter and workplace locations"
```

---

### Task 5: Privacy-Safe Distance in Matching

**Files:**
- Modify: `src/components/platform/MatchesBoard.tsx`

**Interfaces:**
- Consumes: shelter/job coordinates, `getApproximateDistance`, and `formatDistanceThai`.
- Produces: an informational distance label on employer and shelter match cards.

- [ ] **Step 1: Compute distance without changing ranking**

For each card, find the resident's shelter from `state.shelters` and calculate:

```ts
const kilometers = getApproximateDistance(
  shelter?.latitude != null && shelter.longitude != null
    ? { latitude: shelter.latitude, longitude: shelter.longitude }
    : undefined,
  job.latitude != null && job.longitude != null
    ? { latitude: job.latitude, longitude: job.longitude }
    : undefined,
);
```

Do not pass distance into `rankResidentsForJob` or alter `score`.

- [ ] **Step 2: Render the privacy-safe label**

Add a compact card item with a route icon:

```tsx
<span>
  ระยะทางโดยประมาณจากศูนย์พักพิง: {kilometers == null ? 'ยังไม่มีข้อมูล' : formatDistanceThai(kilometers)}
</span>
```

Do not render shelter address or coordinate values in pre-approval cards.

- [ ] **Step 3: Verify all quality gates**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests PASS, TypeScript exits 0, and all Next.js routes build successfully.

- [ ] **Step 4: Commit**

```bash
git add src/components/platform/MatchesBoard.tsx
git commit -m "feat: show approximate shelter to work distance"
```

---

### Task 6: Final Workflow Verification

**Files:**
- Verify only; modify files only if a failing test identifies a defect.

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified MVP distance workflow.

- [ ] **Step 1: Verify shelter setup**

Confirm a shelter user can enter an address, capture or manually enter coordinates, save, reload, and see the same values.

- [ ] **Step 2: Verify job setup**

Confirm an employer can create a job with workplace address and coordinates, and invalid coordinate pairs are rejected with Thai guidance.

- [ ] **Step 3: Verify matching and privacy**

Confirm both roles see approximate distance when data exists, missing data shows the fallback, skill score is unchanged, and employer cards do not reveal shelter address or raw coordinates before approval.

- [ ] **Step 4: Run final automation**

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0 without warnings or errors.
