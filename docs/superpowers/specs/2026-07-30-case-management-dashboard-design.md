# Case Management Dashboard Design

## Purpose

Give shelter staff one operational view for balancing case-manager workloads and following up with participants. The first release lives inside the shelter workspace and does not introduce a separate case-manager login.

## Navigation

- Add `การดูแลรายกรณี` to the shelter sidebar.
- Route: `/shelter/case-management`.
- Keep the existing shelter overview focused on matching and high-level activity.

## Dashboard hierarchy

### Header

- Title: `การดูแลรายกรณี`
- Supporting copy explains that the page is for workload, assignments, and participant follow-up.
- Primary action opens the existing participant-management page to add or edit participants and managers.

### Priority summary

Show four compact, actionable metrics:

- Participants currently in care
- Participants without an assigned case manager
- Active case managers
- Participants with matching activity requiring coordination

Metrics must be derived from live participant, manager, and matching data. Loading uses skeletons; data failures show an explicit retry-friendly message.

### Workload overview

- List every case manager with name, phone, assigned participant count, and relative workload.
- Use a restrained horizontal workload indicator with text; color is not the only signal.
- Highlight managers above a recommended five-person portfolio as `ภาระงานสูง`.
- Phone numbers use direct `tel:` links.
- Managers with no assigned participants remain visible.

### Unassigned queue

- Display unassigned participants as a dedicated priority list.
- Each row shows participant name, work preference, and skills.
- The action links to participant management where shelter staff can assign a manager.
- When everyone is assigned, show an instructional success state rather than an empty card.

### Participant portfolio

- Provide a case-manager filter plus `ทั้งหมด` and `ยังไม่ได้มอบหมาย`.
- Participant rows show name, assigned manager, work preference, skills, and current coordination status.
- Status is derived from the participant's latest match:
  - no match: `ยังไม่มีการจับคู่`
  - suggested: `รอประสานผู้เข้าร่วม`
  - worker accepted: `รอศูนย์อนุมัติ`
  - worker declined: `ผู้เข้าร่วมยังไม่พร้อม`
  - shelter approved: `พร้อมเริ่มงาน`
  - shelter declined: `ต้องทบทวนโอกาสใหม่`
- Quick actions open participant management and the existing matching workflow.

## Visual direction

- Follow Kao Mai's existing “Open Futures” product system: Noto Sans Thai, friendly blue for selected/actions, navy text, lightly blue-tinted page surface, teal for connection, and green only for confirmed positive states.
- Use one primary white work surface with dividers for the portfolio, not a grid of repeated cards.
- Reserve small bordered panels for discrete summaries and workload objects.
- Controls retain the existing 10–12px radius and minimum 44px touch targets.
- Avoid decorative gradients, oversized statistics, excessive shadows, and nested cards.
- Desktop uses a two-column operational band for workload and unassigned work. Mobile stacks all regions and converts dense rows into readable blocks without horizontal scrolling.

## Data and architecture

- Reuse `getResidents`, `getCaseManagers`, and `getMatchesForShelter`.
- Add pure case-management helpers for workload counts, latest-match selection, and Thai coordination labels.
- Do not add new database columns in this release.
- The page is compatible with mock mode and Supabase mode.
- If migration `015_case_manager_assignments.sql` has not been applied, participant data still loads and the page clearly reports that manager assignments are unavailable.

## Accessibility

- Use semantic headings, labelled regions, and a labelled case-manager filter.
- Every phone link names the manager.
- Status always includes text.
- Keyboard focus follows the existing global focus style.
- Loading, error, and empty states are announced appropriately.
- Meet WCAG 2.2 AA contrast and responsive reflow expectations.

## Verification

- Unit-test workload counting, over-capacity detection, latest-match selection, and status labels.
- Verify active sidebar state and route identity.
- Verify assigned, unassigned, empty, loading, and error states.
- Verify case-manager filtering and quick-action destinations.
- Run TypeScript checks, the complete unit suite, production build, and rendered desktop plus narrow-mobile QA.
