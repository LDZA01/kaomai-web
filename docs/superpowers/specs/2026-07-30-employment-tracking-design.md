# Employment Tracking Design

## Purpose

Give shelter case managers a dedicated workflow for supporting participants after employment starts. The system schedules appropriate follow-ups, records check-ins, identifies support needs, and preserves a complete history when employment ends.

## Navigation and access

- Add `ติดตามการทำงาน` to the shelter sidebar.
- Route: `/shelter/work-tracking`.
- The first release is shelter-only.
- Employer progress submission and separate case-manager authentication are out of scope.

## Employment tracking records

Create one employment-tracking record when an approved match becomes active. Each record contains:

- Participant
- Job and employer
- Assigned case manager, when available
- Employment start date
- Current follow-up cadence
- Next follow-up date
- Status: active or ended
- Optional end date, end reason, final note, and return-to-matching flag

Existing approved matches remain valid. Shelter staff can start tracking them from the new page by confirming the employment start date.

## Follow-up cadence

### First week

- Schedule one follow-up for each calendar day from day 1 through day 7.
- Staff record only the days on which a follow-up actually occurs; missed dates remain visible as overdue.
- After the seventh day, the record transitions to the selected ongoing cadence.

### Ongoing follow-up

The case manager chooses:

- Every two weeks
- Every month

The system calculates the next due date from the completed check-in date. Staff may change the cadence at any time, and may override the next follow-up date when circumstances require closer support.

## Work-tracking dashboard

### Priority summary

- Follow-ups due today
- Overdue follow-ups
- Active employment records
- Participants needing support

### Follow-up queue

Order active records by urgency:

1. Urgent support
2. Overdue
3. Due today
4. Upcoming

Each row shows participant, job, employer, case manager, employment day/week, last check-in, next follow-up, and current support state.

### History

- Filters for active, ended, due, overdue, and case manager.
- Ended employment stays visible and is never deleted.
- A detail panel shows the complete chronological check-in history.

## Check-in form

Each check-in records:

- Check-in date
- Attendance: normal, absent, or late
- Work adjustment: good, needs support, or urgent issue
- Participant feedback
- Employer feedback
- Private case-manager note
- Next follow-up date

Participant and employer feedback are optional text. The private case-manager note remains shelter-only. Saving a check-in updates the employment record's support state and next due date.

## Ending employment

`ยุติการทำงาน` is a guarded workflow, not an immediate action.

The confirmation form requires:

- Last working date
- Reason:
  - Contract completed
  - Participant resigned
  - Employer ended employment
  - Health or personal reason
  - Lost contact
  - Other
- Final note
- Whether to return the participant to job matching
- Explicit confirmation

Saving changes the record to ended and preserves all check-ins. It does not delete the participant, job, match, or history.

## Data model

### `employment_trackings`

- `id`
- `match_id`, unique
- `resident_id`
- `job_id`
- `shelter_id`
- `case_manager_id`, nullable
- `started_at`
- `cadence`: fortnightly or monthly
- `next_follow_up_at`
- `support_state`: good, needs_support, or urgent
- `status`: active or ended
- `ended_at`, nullable
- `end_reason`, nullable
- `final_note`, nullable
- `return_to_matching`
- timestamps

### `employment_check_ins`

- `id`
- `employment_tracking_id`
- `check_in_date`
- `attendance`: normal, absent, or late
- `adjustment`: good, needs_support, or urgent
- `participant_feedback`, nullable
- `employer_feedback`, nullable
- `private_note`, nullable
- `next_follow_up_at`
- `created_by`
- timestamp

## Security

- Shelter users may access tracking records and check-ins only for their shelter.
- Case-manager notes are never selected by employer-facing queries.
- Cross-shelter participant, job, manager, and tracking references are rejected.
- Ending employment is an update, never a deletion.

## Compatibility and deployment

- Add a Supabase migration for both tables, constraints, indexes, triggers, and row-level security.
- Provide mock tracking records and check-ins when Supabase is not configured.
- If the migration is absent, the page displays an installation message without breaking the existing dashboard, participant, or matching pages.

## Accessibility and responsive behavior

- Use semantic sections, fieldsets, labelled filters, status text, and accessible dialogs.
- All controls meet the existing 44px target size.
- Desktop may use a two-column queue/detail layout.
- Mobile stacks summary, filters, records, and forms without horizontal scrolling.
- Dialogs scroll internally and retain visible cancel/save controls.
- Meet WCAG 2.2 AA contrast and keyboard requirements.

## Verification

- Unit-test first-week schedule generation, fortnightly/monthly next dates, urgency ordering, and employment-ending validation.
- Verify active, due, overdue, urgent, empty, ended, and migration-missing states.
- Verify check-in submission updates history and the next follow-up date.
- Verify ending employment requires confirmation and preserves history.
- Run TypeScript, the complete test suite, production build, and rendered desktop/mobile QA.
