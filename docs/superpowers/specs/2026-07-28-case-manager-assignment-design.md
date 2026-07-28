# Case Manager Assignment Design

## Purpose

Give every participant an optional assigned case manager who can be contacted by an employer. One case manager may support multiple participants.

## User experience

### Shelter participant management

- Shelter staff can create and maintain a shared list of case managers.
- A case manager has a required name and phone number.
- The participant create/edit form includes an optional case-manager selector.
- The selector lists case managers belonging to the participant's shelter.
- Existing participants remain valid and display `ยังไม่ได้มอบหมาย` until assigned.
- Participant cards in the shelter area show the assigned case manager when one exists.

### Employer applicant preview

- The existing shelter contact card remains available.
- A separate `ผู้จัดการรายกรณี` card displays the assigned case manager's name and phone number.
- The phone number is rendered as a direct `tel:` call action.
- If no case manager is assigned, the preview displays `ยังไม่ได้มอบหมายผู้จัดการรายกรณี` and does not render a call action.
- Employers receive only the assigned manager's name and phone number. Medical information and participant documents remain private.

## Data model

Create a `case_managers` table with:

- `id`: UUID primary key
- `shelter_id`: required foreign key to `shelters`
- `name`: required text
- `phone`: required text
- `created_at` and `updated_at`: timestamps

Add nullable `case_manager_id` to `residents`, referencing `case_managers.id` with `ON DELETE SET NULL`.

This creates a one-to-many relationship: one case manager can be assigned to many participants, while each participant has at most one assigned case manager.

## Access control

- Authenticated shelter users can create, read, update, and delete case managers belonging to their shelter.
- Employer-facing reads expose only the case manager assigned to a participant and only its name and phone number.
- Assignment writes must reject a case manager from a different shelter.
- Deleting a case manager leaves participant records intact and clears their assignment.

## Application boundaries

- Add a focused database/helper module for case-manager CRUD and lookup.
- Extend the participant domain type with an optional case-manager ID and optional resolved contact.
- Keep case-manager administration and participant assignment in the shelter participant workflow.
- Resolve assigned contact data for employer matching previews without exposing shelter-only participant fields.
- Preserve mock-data behavior when Supabase is not configured.

## Validation and errors

- Trim case-manager names and phone numbers before saving.
- Require both fields when creating or editing a case manager.
- Phone actions are displayed only for a non-empty phone number.
- Database and form errors remain visible without closing the participant dialog or losing entered values.

## Verification

- Unit-test assignment formatting and empty-state behavior.
- Verify one case manager can be assigned to several participants.
- Verify existing unassigned participants still load.
- Verify employer previews show only the assigned name and phone.
- Verify shelter assignment controls and employer contact cards at desktop and mobile widths.
- Run TypeScript checks, unit tests, and a production build.

## Deployment

The application change includes a Supabase migration. If the local environment is not authenticated to the remote Supabase project, the migration remains a checked-in SQL file for the project owner to apply through the Supabase SQL Editor or linked CLI.
