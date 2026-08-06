# Employer Job and Candidate Browser

## Objective

Replace the employer navigation label and candidate-first matching screen with a job-first workflow. An employer first chooses one of their job postings, then reviews candidates ranked for that specific job from highest compatibility percentage to lowest.

The shelter matching experience remains unchanged.

## Navigation and route

- Keep the existing route `/employer/matches` so current links and bookmarks continue to work.
- Rename the employer sidebar item from `ผู้สมัคร` to `งานและผู้สมัคร`.
- Change the page title to `งานและผู้สมัคร` and explain that employers select a job before reviewing ranked candidates.
- Keep the `ประกาศงานใหม่` action visible in the page header.

## Job selection

- Show all jobs owned by the signed-in employer as selectable job cards.
- Each card shows the job title, location, daily wage, posting status, required skills, candidate count, highest compatibility score, and the number of offers already sent for that job.
- Sort job cards with open jobs first, followed by draft and filled jobs, while preserving the API order within each status.
- Select the first open job by default. If no open job exists, select the first available job.
- A selected card uses a clear brand-colored border and selection indicator. The whole card is a keyboard-accessible button with `aria-pressed`.
- Desktop uses a responsive two- or three-column card grid. Mobile uses one column without horizontal scrolling.
- When no jobs exist, show an instructional empty state with a `ประกาศงานใหม่` action instead of candidate tabs.

## Candidate results

- Candidate ranking is always calculated from the currently selected job using `rankResidentsForJob`.
- Results are ordered by compatibility score descending. Equal scores retain the ranking helper's stable source order.
- The section heading names the selected job so the relationship remains clear while scrolling.
- Keep the existing three workflow tabs, but scope every count and result to the selected job:
  - `ผู้สมัครแนะนำ`
  - `ยื่นเสนอแล้ว/รอตอบ`
  - `อนุมัติแล้ว/พร้อมเริ่มงาน`
- Search filters candidates by name or skill within the selected job only.
- Each recommended candidate continues to show compatibility percentage, matched skills, availability, shelter, distance, identity-card status, profile preview, and offer action.
- Existing offer and approved records are matched by both `jobId` and `residentId`. A match for another job must not disable the offer button on the selected job.
- Sending an offer always uses the selected job and refreshes only the relevant job counts and candidate status.

## Responsive behavior

- On phones, job cards stack in one column and appear before tabs and results.
- Tabs may wrap onto multiple rows; they must not require horizontal scrolling.
- Candidate actions become full-width when needed while retaining at least 44px touch targets.
- All headings, job titles, and skill labels wrap without clipping.

## Loading, empty, and error behavior

- Preserve the existing skeleton loading state.
- If a selected job has no candidates, explain that no available participant currently matches and allow the employer to choose another job.
- If a tab has no records for the selected job, show the existing contextual empty state with copy naming the selected job when useful.
- Existing database errors continue through the current data-access behavior; this feature introduces no schema migration.

## Data and privacy

- Reuse the existing jobs, residents, shelters, and job-match queries.
- No database schema or RLS changes are required.
- Candidate profile visibility and contact-details rules remain unchanged.
- Shelter users retain their current proposal-review screen and behavior.

## Verification

- Unit-test job selection helpers and per-job filtering, including descending score order and isolation from matches belonging to other jobs.
- Verify employer and shelter TypeScript paths compile.
- Run the full test suite and production build.
- In a real browser, verify job selection changes rankings and tab counts, an offer targets the selected job, keyboard selection works, mobile has no horizontal overflow, and the console has no errors.

