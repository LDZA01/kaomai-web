# Weighted candidate matching design

## Goal

Replace the skills-only score with a transparent weighted score that gives employers useful percentages, ranks candidates from highest to lowest, and never labels an all-zero list as recommended.

## Scoring model

The score has three components:

- Skill compatibility: 70 points. Each required job skill contributes an equal portion. Matching remains case-insensitive and supports exact or partial text matches.
- Preferred work type: 20 points. A candidate receives these points when their preferred work type matches the job's work type.
- Work readiness: 10 points. A candidate receives these points when they are currently available for work.

The final score is an integer from 0 to 100. Components whose job-side data is missing are excluded from the denominator and the remaining components are re-normalized to 100. This keeps legacy jobs valid without awarding points for unknown information. A job with no required skills and no work-type requirement scores available candidates at 100 because it declares no compatibility constraints.

## Job data and form

Add an optional `workType` field to jobs with `full_time` and `part_time` values. New job creation requires the employer to choose one. Existing database rows may remain null and continue to work through the re-normalization rule. Store the value in a nullable `work_type` column through a new migration.

## Candidate selection

Only residents whose `workAvailability` is true enter the recommended-candidate ranking. Results are sorted by score descending with resident name as a deterministic tie-breaker. The recommended tab applies the job's configured minimum score. If nobody earns a positive score or reaches the minimum, show the empty state; do not fall back to displaying every available resident as a recommendation.

Sent and approved proposal tabs continue to show their existing records independently of the recommendation threshold.

## Display

Job cards and the job detail header show the selected work type. Candidate cards continue to display the final percentage. The empty state explains that no available candidate currently reaches the configured minimum score.

## Compatibility and privacy

No resident medical, payment, document, or case-manager data contributes to matching. Existing jobs without `work_type` remain readable. Database mapping treats absent or null values as undefined.

## Verification

Automated tests cover weighted calculation, missing-data re-normalization, unavailable residents, descending order with deterministic ties, threshold filtering, and removal of the all-zero fallback. Lint, the complete test suite, production build, and desktop/mobile browser checks must pass.
