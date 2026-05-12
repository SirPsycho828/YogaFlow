▸ Extended thinking (821 chars)  
```markdown
## Overview

YogaFlow treats cancellation and rescheduling as separate actions. Cancellation marks a session as cancelled, preserves the record, and auto-refunds any consumed credits. Rescheduling is not a dedicated flow -- the instructor cancels the old session and creates a new one. This keeps the data model simple and the audit trail clean: every scheduled time slot is either completed, cancelled, or still upcoming.

## Dependencies

- `02_Database_Schema.md` -- `sessions.status`, `sessions.cancelledAt`, `attendance.paymentStatus`
- `03_API_Endpoints.md` -- `cancelSession`, `deleteRecurringSeries` callables
- `07_Private_Sessions.md` -- Cancel action on private session detail
- `08_Group_Classes.md` -- Cancel action on group session detail, per-student refunds
- `09_Recurring_Sessions.md` -- Cancel single vs future instances of a series
- `11_Packages_Payments.md` -- Credit refund logic on cancellation

## Cancellation Flow -- Private Session

### Trigger

"Cancel Session" link on the session detail screen (see `07_Private_Sessions.md`). Only available when `status` is `scheduled`. Completed and already-cancelled sessions cannot be cancelled.

### Confirmation

`AlertDialog` with the following content:

- **Title**: "Cancel session with [Client Name]?"
- **Description**: "This session on [date] at [time] will be marked as cancelled." If the session was paid: "1 credit will be refunded to [Client Name]'s package."
- **Cancel button**: "Keep Session" (secondary)
- **Confirm button**: "Cancel Session" (destructive)

### Execution

On confirm, calls the `cancelSession` Cloud Function (see `03_API_Endpoints.md`):

1. Set `status` to `cancelled`
2. Set `cancelledAt` to server timestamp
3. If `paymentStatus == 'paid'`:
   - Find the client's most recent private package (active first, then most recently depleted)
   - Increment `remainingCredits` by 1
   - If the package was `depleted`, set `status` back to `active`
   - Set session `paymentStatus` back to `unpaid` (the credit has been returned)
4. Decrement `clients.unpaidCount` (cancelled sessions should not count as unpaid)

### Post-Cancellation UI

- Session detail screen updates: status badge shows "Cancelled" (gray), `cancelledAt` displayed as "Cancelled on [date]"
- All action buttons removed -- a cancelled session is read-only
- Session card on Today/Calendar shows muted styling with strikethrough title
- Toast: "Session cancelled" or "Session cancelled -- 1 credit refunded"

## Cancellation Flow -- Group Session

### Trigger

Same "Cancel Session" link on the group session attendance screen.

### Confirmation

- **Title**: "Cancel [Class Name]?"
- **Description**: "The session on [date] at [time] will be marked as cancelled." If any students were marked as paid: "[N] credits will be refunded."
- Same button pattern as private sessions

### Execution

`cancelSession` runs the same flow but iterates over attendance records:

1. Set session `status` to `cancelled`, set `cancelledAt`
2. For each attendance record on this session:
   - If `paymentStatus == 'paid'`: refund one group credit to that student's package
   - Set attendance `paymentStatus` to `unpaid`
3. Update `unpaidCount` on each affected client document

### Complexity Note

Group cancellation is the most write-heavy operation in the app. A class with 15 students where 10 have paid triggers: 1 session update + 10 package updates + 10 attendance updates + 10 client counter updates = 31 writes. This must run in a Cloud Function with transactional writes per student, not as a single atomic transaction (Firestore transactions have a 500 operation limit, but each student's refund touches different documents and should be independent).

If one student's refund fails (e.g., their package was deleted), log the error and continue with the remaining students. Surface partial failures in the response.

## Cancellation Flow -- Recurring Sessions

When cancelling a session that belongs to a recurring series, the instructor sees an additional prompt before the standard confirmation.

### Prompt

"This is a recurring session. What would you like to cancel?"

1. **"This session only"** -- Cancels the single instance. The series continues generating future sessions normally. This is the most common case (e.g., client is on vacation this week).

2. **"This and all future sessions"** -- Cancels all sessions in the series from this date forward. Past sessions (completed or scheduled before today) are unaffected. The series stops generating new instances.

### "This Session Only" Execution

Delegates to the standard `cancelSession` flow. The session is cancelled, credit is refunded if applicable. No changes to the series document. Future instances continue to be generated normally.

### "This and All Future" Execution

Calls `deleteRecurringSeries` with `deleteMode: 'future'`:

1. Query all sessions in the series where `date >= cancelled session's date` and `status == 'scheduled'`
2. For each: run the cancellation + refund logic
3. Update the series RRULE to add an `UNTIL` clause set to the day before the cancelled session
4. Update `series.generatedUntil` to match
5. The `extendRecurringSeries` scheduled function will skip this series going forward

This effectively "ends" the recurring pattern from the selected date onward.

## Rescheduling

There is no dedicated reschedule action. The instructor's workflow for rescheduling:

1. Cancel the original session (follows the cancellation flow above)
2. Create a new session for the new date/time (follows the creation flow in `07_Private_Sessions.md` or `08_Group_Classes.md`)

### Why No Dedicated Reschedule Flow

- A reschedule is conceptually two distinct events: "didn't happen then" and "will happen now." Keeping them as separate records maintains a clean history.
- Building a combined flow adds UI complexity (date picker + time picker + confirmation + refund + creation) with little benefit.
- The cancelled session record shows the instructor (and the session history) that a change occurred.

### Rescheduling a Recurring Session Instance

When a single instance needs to move to a different day or time:

1. Cancel the single instance ("this session only")
2. Create a new standalone session at the desired time
3. The recurring series continues unchanged -- the next regular instance generates as normal

The instructor does not need to edit the recurring series just because one session moved. The cancelled instance stays as a record, and the new standalone session stands on its own.

## Cancelled Session Display

### Today View

Cancelled sessions remain visible on the Today timeline for the day they were originally scheduled. They appear with:

- Muted card (60% opacity)
- Strikethrough on the title text
- Gray "Cancelled" status badge
- No action buttons (no prep, no notes, no complete)
- Positioned chronologically among active sessions

The instructor can hide cancelled sessions from the Today view with a toggle: "Show cancelled" / "Hide cancelled" at the top of the session list. Default: show cancelled. This preserves context about why the schedule has gaps.

### Calendar View

In month view: cancelled sessions do not contribute to the session count dots. A day with 2 scheduled and 1 cancelled shows 2 dots, not 3.

In week view: cancelled sessions show as a gray, dashed-outline bar at reduced opacity. Visually distinct from active sessions but still indicating that a time slot was blocked.

### Client Session History

Cancelled sessions appear in the client's session history (on client detail and in session prep) with the "Cancelled" badge. They count toward the "last 3 sessions" query only if fewer than 3 completed sessions exist -- the query filters for `status == 'completed'` first, falling back to including cancelled sessions if the history is sparse.

Actually, the prep view query in `12_Session_Notes_Prep.md` already filters for `status == 'completed'` only. Cancelled sessions do not appear in prep. They do appear in the full session history accessible from client detail via "View all."

## Cancellation Restrictions

| Scenario | Can Cancel? | Notes |
|----------|-------------|-------|
| Scheduled session (future) | Yes | Standard flow |
| Scheduled session (past, not yet marked complete) | Yes | Instructor may cancel a session they forgot to mark complete |
| Completed session | No | Once completed, the record is final |
| Already cancelled session | No | Cannot cancel twice |
| Session with notes | Yes | Notes are preserved on the cancelled record |

## Gaps & Assumptions

1. **No cancellation reason.** The app does not ask why a session was cancelled (client no-show, instructor illness, weather, etc.). A reason field could be useful for pattern analysis but adds friction to what should be a quick action.

2. **No cancellation policy enforcement.** There is no "24-hour cancellation policy" or late-cancel fee logic. The app always refunds credits on cancellation regardless of timing. Policy enforcement is the instructor's responsibility outside the app.

3. **No undo cancellation.** Once cancelled, a session cannot be "un-cancelled" or restored to scheduled status. The instructor must create a new session instead. This keeps the state machine simple: `scheduled -> completed` or `scheduled -> cancelled`, no reverse transitions.

4. **No client notification on cancellation.** Cancelling a session does not send any message to the client. The instructor contacts the client through their own channels (text, call, email). Client-facing notifications are out of scope for an instructor-only tool.

5. **Refund targets the most recent package.** If a client has had multiple packages over time (one depleted, one active), the refund goes to the most recent matching package. This is usually correct but could produce odd results if the instructor creates a new package immediately after a cancellation.

6. **Cancelled sessions count toward no metrics.** Cancelled sessions are excluded from any future summary views (session counts, payment totals). They exist only as historical records.
```  
