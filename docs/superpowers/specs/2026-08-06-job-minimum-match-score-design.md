# Job Minimum Match Score

## Objective

Allow an employer to define the minimum compatibility score for each job. Recommended candidates remain sorted from highest score to lowest, and only candidates meeting the job's threshold appear in the recommended list.

## Score choices and defaults

- Allowed thresholds are `0`, `25`, `50`, and `75` percent.
- New jobs default to `50%` in the create-job form.
- Existing jobs receive `0%` during migration so no previously visible candidates disappear unexpectedly.
- The database validates that the value is one of the four allowed thresholds.

## Create-job form

- Add a required single-choice field labeled `คะแนนความสอดคล้องขั้นต่ำ` after required skills.
- Present four touch-friendly radio choices: `0%`, `25%`, `50%`, and `75%`.
- Select `50%` by default.
- Explain the behavior with the hint: `ระบบจะแสดงผู้สมัครแนะนำที่มีคะแนนถึงเกณฑ์นี้`.
- Save the selected value with the job record.

## Jobs index

- Each job card displays `เกณฑ์ขั้นต่ำ N%` near the required-skill tags.
- The `ผู้สมัคร` metric counts only available candidates whose score is greater than or equal to the threshold.
- The `สูงสุด` metric remains the highest score among all ranked available candidates, or `0%` if none exist.
- Offer counts remain based on saved job matches and are not removed when the threshold changes.

## Per-job candidate page

- The job summary displays `เกณฑ์ขั้นต่ำ N%`.
- The recommended tab filters candidates to `score >= minimumMatchScore` and preserves descending score order.
- The recommended count and search results use the filtered collection.
- If nobody meets the threshold, show an empty state explaining the current threshold and link back to all jobs.
- Sent and approved tabs continue to show their saved matches even if a candidate's score is below the current threshold. This prevents active workflows and historical decisions from disappearing.

## Data model and migration

- Add `minimum_match_score integer not null default 0` to `public.jobs` for backward compatibility.
- Add a check constraint allowing only `0`, `25`, `50`, or `75`.
- Add `minimumMatchScore: 0 | 25 | 50 | 75` to the `Job` TypeScript interface.
- Map the field in database reads and writes.
- Mock jobs explicitly include representative thresholds.
- No RLS changes are required because the field belongs to the existing jobs table and uses its existing policies.

## Error and compatibility behavior

- If an older API row omits the field, map it to `0`.
- Reject invalid thresholds in pure application validation before database insertion.
- Database validation remains the final guard.

## Verification

- Unit-test allowed threshold validation and candidate filtering at boundary values.
- Verify candidates at exactly the threshold remain visible.
- Verify filtering preserves descending order.
- Verify sent and approved matches remain visible below the threshold.
- Run TypeScript, full tests, production build, and browser checks at desktop and 390px mobile widths.
- Confirm the create form defaults to `50%`, job cards show the threshold, and the detail page filters recommended candidates correctly.

