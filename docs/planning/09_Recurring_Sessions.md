```markdown
## Overview

Recurring sessions allow instructors to set up repeating schedules for both private clients and group classes. The system uses RRuleJS to define recurrence patterns and generates individual session documents in Firestore for each occurrence. This materialized-instance approach means every session is a real document that can be independently edited, cancelled, or have notes attached -- no runtime expansion of virtual events.

## Dependencies

- `02_Database_Schema.md` -- `series` and `sessions` collections, `generatedUntil` field
- `03_API_Endpoints.md` -- `createRecurringSeries`, `editRecurringSeries`, `deleteRecurringSeries` callables, `extendRecurringSeries` scheduled function
- `07_Private_Sessions.md` -- Recurrence toggle on private session creation
- `08_Group_Classes.md` -- Recurrence toggle on group class creation, attendance record generation
- `13_Cancellations_Rescheduling.md` -- Cancelling single vs future instances

## Recurrence Options

The creation form (both private and group) offers these options when the "Repeat" toggle is enabled:

| Option | RRULE Generated | Example |
|--------|----------------|---------|
| Every week | `FREQ=WEEKLY;INTERVAL=1` | Every Tuesday |
| Every 2 weeks | `FREQ=WEEKLY;INTERVAL=2` | Every other Tuesday |
| Every month | `FREQ=MONTHLY;INTERVAL=1;BYDAY=2TU` | Second Tuesday of each month |

**End condition options:**
- "No end date" -- RRULE has no `UNTIL` or `COUNT`. Series generates indefinitely (bounded by the rolling window).
- "Until [date]" -- RRULE includes `UNTIL=YYYYMMDD`. No instances generated past that date.

The RRULE is derived from the session's date and the selected frequency. For monthly recurrence, use `BYDAY` to repeat on the same weekday-of-month (e.g., "second Tuesday") rather than the same date number. This avoids edge cases with months of different lengths.

### RRULE Construction

Given a session on Tuesday, January 14, 2026, at 10:00 AM:

- Weekly: `FREQ=WEEKLY;INTERVAL=1;BYDAY=TU`
- Biweekly: `FREQ=WEEKLY;INTERVAL=2;BYDAY=TU`
- Monthly (2nd Tuesday): `FREQ=MONTHLY;INTERVAL=1;BYDAY=2TU`
- With end date: append `;UNTIL=20260630T000000Z`

The RRULE string is stored on the `series` document. RRuleJS parses it to generate occurrence dates.

## Instance Generation

### Rolling Window

Session instances are materialized 4 weeks ahead from the current date. This means:

- On series creation: generate instances from the start date through `now + 4 weeks`
- Daily scheduled function (`extendRecurringSeries`): top up any series where `generatedUntil < now + 4 weeks`
- On-demand: if the instructor navigates to a date beyond `generatedUntil` in the calendar, trigger an extension for that series

The 4-week window balances visibility (instructors can see upcoming sessions) with document economy (no hundreds of future documents sitting in Firestore).

### Generation Process

For each occurrence date produced by RRuleJS:

1. Check if a session already exists for this series + date (prevent duplicates on re-runs)
2. Create a `sessions` document:
   - Copy `sessionDefaults` from the `series` document (title, startTime, endTime, location)
   - Set `type`, `instructorId`, `clientId` or `groupClassId` from the series
   - Set `seriesId` to link back to the series
   - Set `date` to the occurrence date
   - Set `status: 'scheduled'`, `paymentStatus: 'unpaid'`, `notes: ''`, `isException: false`
3. For group sessions: create `attendance` records for each client in `groupClasses.defaultRoster`
4. Update `series.generatedUntil` to the latest generated date

### Batch Writes

Instance generation uses Firestore batched writes. Each batch can hold 500 operations. A weekly recurring session generates ~4 documents per window extension (4 weeks). Even with attendance records for a 20-person group class, this stays well under the batch limit per series.

## Editing Recurring Sessions

When the instructor taps "Edit" on a session that belongs to a series, a prompt appears before the edit form:

### "This session only"

1. Open the edit form pre-filled with this instance's current values
2. On save: update only this session document
3. Set `isException: true` on this session
4. Future generation skips dates that already have an exception document

The exception flag prevents the `extendRecurringSeries` function from overwriting manual edits if it ever re-processes a date range.

### "This and all future sessions"

1. Open the edit form pre-filled with this instance's current values
2. On save: call `editRecurringSeries` Cloud Function with `editMode: 'future'`
3. The function:
   - Updates `series.sessionDefaults` with the new values
   - Deletes all future sessions (date >= edited session's date) that are not exceptions and have `status: 'scheduled'`
   - Regenerates instances from the edited session's date through `generatedUntil` using the new defaults
   - For group sessions: recreates attendance records for regenerated sessions
4. Past sessions and exception sessions are untouched

### Editable Fields

| Field | "This only" | "This and future" |
|-------|-------------|-------------------|
| Start time | Yes | Yes (updates sessionDefaults) |
| End time | Yes | Yes |
| Location | Yes | Yes |
| Client (private) | Yes | No -- changing the client on all future sessions effectively creates a new series. Guide the instructor to cancel this series and create a new one. |
| Date | Yes (moves this instance) | No -- changing the day of the week requires a new RRULE. Same guidance as above. |

## Deleting Recurring Sessions

The `deleteRecurringSeries` Cloud Function handles three modes:

### Delete Single Instance

- Sets `status: 'cancelled'` on the single session (delegates to `cancelSession` logic)
- Does not affect the series or other instances
- Credit refund follows standard cancellation rules (see `13_Cancellations_Rescheduling.md`)

### Delete Future Instances

- Cancels all sessions in the series with `date >= today` and `status: 'scheduled'`
- Refunds credits for any future sessions that were already marked as paid
- Sets a flag on the series to stop future generation (or adds an `UNTIL` to the RRULE set to yesterday)
- Past sessions preserved

### Delete All Instances

- Cancels all sessions in the series regardless of date (past scheduled sessions become cancelled)
- Completed sessions are not affected -- they represent work that was done
- Deletes the series document itself
- Refunds credits only for non-completed sessions that were marked as paid

## Series Display in the UI

### Recurring Indicator

Sessions that belong to a series show a small repeat icon next to the title on:
- Session cards (Today view, Calendar)
- Session detail screen header

### Series Info on Session Detail

On the session detail screen for a recurring session, below the date/time section:

- "Repeats every week" or "Repeats every 2 weeks" or "Repeats monthly" (human-readable summary of the RRULE)
- If the series has an end date: "Until June 30, 2026"
- If this is an exception: "Modified from series" label

### Calendar View

Recurring sessions appear as individual events on the calendar -- the instructor does not see an "expanding" pattern. Each instance is a concrete session card. See `10_Calendar_View.md`.

## Scheduled Function: `extendRecurringSeries`

Runs daily at 2:00 AM UTC (see `03_API_Endpoints.md`).

**Logic:**
1. Query all `series` documents where `generatedUntil < now + 28 days`
2. For each series:
   - Parse the RRULE with RRuleJS
   - Generate occurrence dates between `generatedUntil` and `now + 28 days`
   - Skip dates that already have a session document (exception or otherwise)
   - Batch-create new session documents and attendance records
   - Update `generatedUntil`
3. Log the count of series processed and sessions created (for Sentry monitoring)

**Edge cases:**
- Series with `UNTIL` in the past: skip entirely, no new instances needed
- Series where `generatedUntil` is already ahead of `now + 28 days`: skip
- Empty result from RRuleJS (no occurrences in the window): update `generatedUntil` without creating documents

## Gaps & Assumptions

1. **No custom recurrence rules.** The UI offers three fixed patterns (weekly, biweekly, monthly). "Every 3 weeks", "twice a week", or "every Monday and Wednesday" are not supported in v1. The `series.rrule` field can store any valid RRULE, so the backend supports arbitrary patterns if the UI is extended later.

2. **No recurrence on existing sessions.** A standalone session cannot be converted to a recurring series after creation. The instructor must create a new recurring session. This avoids complex migration logic for a single existing document.

3. **Monthly recurrence edge case.** "Fifth Tuesday of the month" only occurs in some months. RRuleJS handles this correctly by simply not producing an occurrence for months without a fifth Tuesday. No special handling needed, but the instructor may be surprised by the gap.

4. **Timezone and DST.** RRuleJS generates dates in UTC. The conversion to local time must account for daylight saving transitions. A session at 10:00 AM local time should stay at 10:00 AM even when clocks change. Store the local time string separately from the RRULE date generation. The RRULE determines which dates, the `sessionDefaults.startTime` determines the clock time.

5. **Generation window is not user-configurable.** Fixed at 4 weeks. If an instructor wants to see their schedule 3 months ahead, they cannot. A calendar view beyond 4 weeks will show gaps for recurring sessions that haven't been materialized yet. This is noted in `10_Calendar_View.md`.

6. **Bulk deletion performance.** Deleting all instances of a long-running series could involve hundreds of documents. The Cloud Function should use recursive batched deletes and may take several seconds. The UI should show a loading state and not time out.
```  
