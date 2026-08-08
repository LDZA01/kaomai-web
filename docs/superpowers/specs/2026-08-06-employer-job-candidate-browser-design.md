# Employer Job and Candidate Browser

## Objective

Replace the employer candidate-first matching screen with a two-page, job-first workflow. The employer sees a jobs-only index first, then opens a dedicated candidate page for one job where candidates are ranked from highest compatibility percentage to lowest.

The shelter matching experience remains unchanged.

## Navigation and route

- Use `/employer/matches` as the jobs-only index so current links and bookmarks continue to work.
- Add `/employer/matches/job?jobId=<id>` as the dedicated candidate page for one job. The query parameter is required because this application uses Next.js static export and database job IDs are not known at build time.
- Rename the employer sidebar item from `ผู้สมัคร` to `งานและผู้สมัคร`.
- Change the index title to `งานและผู้สมัคร` and explain that employers open a job to review ranked candidates.
- Keep the `ประกาศงานใหม่` action visible in the page header.

## Job selection

- Show all jobs owned by the signed-in employer as linked job cards on the index page.
- Each card shows the job title, location, daily wage, posting status, required skills, candidate count, highest compatibility score, and the number of offers already sent for that job.
- Sort job cards with open jobs first, followed by draft and filled jobs, while preserving the API order within each status.
- Do not select a job automatically and do not render candidate results below the cards.
- The whole card is a keyboard-accessible link to `/employer/matches/job?jobId=<id>` with a clear `ดูผู้สมัคร` affordance.
- Desktop uses a responsive two- or three-column card grid. Mobile uses one column without horizontal scrolling.
- When no jobs exist, show an instructional empty state with a `ประกาศงานใหม่` action.

## Candidate results

- The candidate page loads the `jobId` route parameter and confirms that the job belongs to the signed-in employer.
- If the job is missing or belongs to another employer, render a not-found state without candidate data and provide a link back to `/employer/matches`.
- Provide a visible `กลับไปงานทั้งหมด` link above the job summary.
- Candidate ranking is calculated from the route's owned job using `rankResidentsForJob`.
- Results are ordered by compatibility score descending. Equal scores retain the ranking helper's stable source order.
- Show a compact job summary above the results with title, location, wage, status, and required skills.
- Keep the existing three workflow tabs, but scope every count and result to the route's job:
  - `ผู้สมัครแนะนำ`
  - `ยื่นเสนอแล้ว/รอตอบ`
  - `อนุมัติแล้ว/พร้อมเริ่มงาน`
- Search filters candidates by name or skill within the route's job only.
- Each recommended candidate continues to show compatibility percentage, matched skills, availability, shelter, distance, identity-card status, profile preview, and offer action.
- Existing offer and approved records are matched by both `jobId` and `residentId`. A match for another job must not disable the offer button on the route's job.
- Sending an offer always uses the route's job and refreshes only that job's counts and candidate status.

## Responsive behavior

- On phones, index job cards stack in one column.
- The candidate page keeps its back link and job summary above tabs and results.
- Tabs may wrap onto multiple rows; they must not require horizontal scrolling.
- Candidate actions become full-width when needed while retaining at least 44px touch targets.
- All headings, job titles, and skill labels wrap without clipping.

## Loading, empty, and error behavior

- Preserve the existing skeleton loading state.
- If the route's job has no candidates, explain that no available participant currently matches and link back to all jobs.
- If a tab has no records for the route's job, show the existing contextual empty state with copy naming the job when useful.
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
- In a real browser, verify a job card navigates to `/employer/matches/job?jobId=<id>`, direct URLs enforce ownership, rankings and tab counts belong to that job, an offer targets the route's job, browser back navigation works, mobile has no horizontal overflow, and the console has no errors.
