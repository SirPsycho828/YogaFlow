▸ Extended thinking (1039 chars)  
```markdown
## Overview

Private sessions are one-on-one meetings between the instructor and a single client. They are the most common session type for yoga instructors who do home visits, studio rentals, or online private classes. This file covers creating, viewing, editing, and completing private sessions. Recurring logic is handled in `09_Recurring_Sessions.md`, cancellation in `13_Cancellations_Rescheduling.md`, and post-session notes in `12_Session_Notes_Prep.md`.

## Dependencies

- `02_Database_Schema.md` -- `sessions` collection with `type: 'private'`
- `03_API_Endpoints.md` -- `markSessionComplete` callable, `createRecurringSeries` callable
- `04_UI_Design_System.md` -- Session card pattern, form patterns, sheet component
- `05_Dashboard_Today_View.md` -- Private sessions render on the Today timeline
- `06_Client_Management.md` -- Client picker draws from the active client list
- `09_Recurring_Sessions.md` -- Recurrence toggle and series creation
- `11_Packages_Payments.md` -- Payment status on session detail
- `10_Calendar_View.md` -- Private sessions appear on the calendar

## Create Private Session

### Entry Points

- FAB menu on the Today dashboard: "Private Session" (pre-fills date to the viewed date)
- FAB or "+" button on the Calendar view (pre-fills date to the selected date)
- From a client's detail screen (pre-fills the client)

### Form

Opens as a full page. Single-column layout, mobile-first.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Client | Client picker | Yes | Empty (or pre-filled if entered from client detail) | Search-select from active clients |
| Date | Date picker | Yes | Today (or pre-filled from calendar context) | |
| Start Time | Time picker | Yes | None | 15-minute increments |
| End Time | Time picker | Yes | Start time + 60 min | Auto-calculated, editable. 15-minute increments. |
| Location | Text input | No | Empty | Free text: studio name, address, or "Online" |
| Recurring | Toggle + config | No | Off | See below |

**Client picker**: A searchable dropdown that queries the local client list (already loaded from Firestore cache). Shows client name and initials avatar. Only active clients appear -- archived clients are excluded. If no clients exist, show "No clients yet -- add one first" with a link to client creation.

**Time picker**: Use a scrollable time selector or native time input, set to 15-minute intervals (9:00, 9:15, 9:30...). The instructor should be able to pick a time in 2-3 taps maximum.

**End time auto-calculation**: When start time changes, if the instructor hasn't manually edited end time, auto-set it to start + 60 minutes. Once manually edited, stop auto-calculating.

### Recurring Toggle

A "Repeat" toggle switch below the location field. When enabled, shows:

- **Frequency**: Dropdown with options: "Every week", "Every 2 weeks", "Every month"
- **End condition**: "No end date" (default), or "Until [date]" with a date picker

When the instructor saves a session with recurrence enabled, the app calls `createRecurringSeries` (see `03_API_Endpoints.md`) instead of creating a single session document. The full recurrence logic, including RRULE generation and instance management, is in `09_Recurring_Sessions.md`.

### Submit

- Button text: "Create Session"
- **Non-recurring**: Create a single document in `sessions` with `type: 'private'`, `seriesId: null`, `status: 'scheduled'`, `paymentStatus: 'unpaid'`, `notes: ''`
- **Recurring**: Call `createRecurringSeries` Cloud Function
- On success: navigate to the Today dashboard (if the session is today) or the Calendar view (if future)
- Toast: "Session created" or "Recurring sessions created"

### Overlap Detection

No overlap detection in v1. The instructor can book two sessions at the same time. This is intentional -- instructors know their own schedules, and edge cases (travel time, flexible end times) make automated conflict detection more annoying than helpful. Deferred to `16_Future_Features.md`.

## Session Detail View

Accessed by tapping a session card on the Today dashboard, Calendar, or client session history.

### Layout (top to bottom)

1. **Header**: Client name as page title. Back button (left). "Edit" button (right, secondary). If part of a recurring series, show a small "Recurring" label with a repeat icon below the title.

2. **Date and time**: Full date ("Tuesday, January 15, 2026"), start -- end time ("10:00 AM -- 11:00 AM"). Single line if it fits, stacked if not.

3. **Location**: If set, shown with a map pin icon. Muted text. Tappable -- opens the device's maps app with the location text as a search query. If not set, omit entirely (don't show "No location").

4. **Status bar**: Current status badge (scheduled/completed/cancelled) and payment status badge (paid/unpaid). Side by side.

5. **Health notes preview**: Pulled from `clients/{clientId}.healthNotes`. Shown in a subtle card with a "Notes" icon. If empty, omit. This gives the instructor a quick reference without navigating to the full client record.

6. **Session notes**: If notes exist, display them in a card below health notes. If empty and session is completed, show the "Add Notes" button (same as the Today view behavior, see `05_Dashboard_Today_View.md`).

7. **Actions**: Context-dependent buttons at the bottom. See Actions table.

### Actions by Status

| Status | Primary Action | Secondary Actions |
|--------|---------------|-------------------|
| `scheduled` | "Mark Complete" (primary button) | "Cancel Session" (destructive text link) |
| `completed` | "Add Notes" or "Edit Notes" | None |
| `cancelled` | None | "Cancelled on [date]" (informational text only) |

## Mark Complete

Tapping "Mark Complete" on a scheduled session:

1. Calls the `markSessionComplete` Cloud Function (see `03_API_Endpoints.md`)
2. The function sets `status: 'completed'` and attempts to deduct a credit from the client's active private package
3. UI updates optimistically -- the status badge flips to "Done" and the payment badge updates based on the function response
4. If a credit was deducted: payment shows "Paid", toast "Session completed -- 1 credit used (X remaining)"
5. If no active package: payment shows "Unpaid", toast "Session completed"
6. The "Add Notes" button appears in the session notes area

The instructor can manually toggle payment status after completion. Tapping the unpaid badge opens a confirmation: "Mark as paid?" This is for cases where the client pays cash or outside the package system. The reverse (marking paid as unpaid) follows the same pattern.

## Edit Session

Accessed from the "Edit" button on the session detail view.

### Non-Recurring Session

Opens the same form as creation, pre-filled with current values. Submit button: "Save Changes". Writes updated fields plus `updatedAt` to the session document.

Editable fields: client, date, start time, end time, location. The recurring toggle is hidden for standalone sessions -- you cannot retroactively make a session recurring.

### Recurring Session

When editing a session that belongs to a series (`seriesId` is set), the app prompts before opening the form:

- "Edit this session only" -- opens the form, saves changes to this single instance, marks it as `isException: true`
- "Edit this and all future sessions" -- opens the form, saves via `editRecurringSeries` Cloud Function

Full details in `09_Recurring_Sessions.md`.

## Payment Status Display

On the session detail view, payment status is shown as a tappable badge:

| State | Badge | Tap Behavior |
|-------|-------|-------------|
| Unpaid, has active package | Red "Unpaid" badge | Confirm dialog to deduct 1 credit |
| Unpaid, no package | Red "Unpaid" badge | Confirm dialog to mark as paid (manual) |
| Paid via package | Green "Paid" badge with package icon | Confirm dialog to mark as unpaid (refunds credit) |
| Paid manually | Green "Paid" badge | Confirm dialog to mark as unpaid |

Credit deduction and refund mechanics are detailed in `11_Packages_Payments.md`.

## Session Title Generation

The `title` field on a private session is auto-generated from the client's name at creation time. If the client's name is later edited, existing session titles are not retroactively updated -- they reflect the name at the time of creation. This is acceptable for v1; the client name is always available via the `clientId` reference for the detail view.

## Private Sessions in Other Views

| View | How Private Sessions Appear |
|------|---------------------------|
| Today dashboard | Session card with client name, time, location, status. See `05_Dashboard_Today_View.md`. |
| Calendar | Event block with client name and time. See `10_Calendar_View.md`. |
| Client detail | In the session history list (last 3). See `06_Client_Management.md`. |
| Session prep | Health notes + last 3 session notes. See `12_Session_Notes_Prep.md`. |

## Gaps & Assumptions

1. **No session duration constraints.** The form allows any start/end time combination. An instructor could create a 5-minute session or a 5-hour session. No validation beyond end time being after start time.

2. **No recurring-to-standalone conversion.** A session that is part of a series cannot be detached from the series into a standalone session. The instructor can edit it as an exception, but the `seriesId` link remains. This is fine for v1.

3. **Session title is denormalized.** If a client is deleted, orphaned sessions still have the title (client name) baked in but a null `clientId`. The session card should handle this gracefully -- show the title but disable the "tap to view client" link.

4. **No session templates.** The instructor cannot save a session configuration (same client, same time, same location) as a reusable template beyond recurrence. If they see "Sarah, Tuesdays 10 AM, Studio B" as a recurring pattern, they should use the recurring feature.

5. **No buffer time between sessions.** The app does not account for travel time between locations. If the instructor has a session ending at 11:00 at Studio A and another starting at 11:00 at a client's home, no warning is shown. This is the instructor's responsibility.

6. **Location is free text.** No location autocomplete, no saved locations list, no structured address. The instructor types whatever is useful to them. A saved locations feature is a candidate for `16_Future_Features.md`.
```  
