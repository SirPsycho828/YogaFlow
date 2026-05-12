```markdown
## Overview

Group classes are multi-student sessions where the instructor teaches several clients at once. A group class has a definition (name, capacity, default roster) and generates individual session instances that appear on the calendar and Today view alongside private sessions. Attendance is tracked per student per session via checkboxes. Enrollment uses a recurring roster with per-session flexibility for drop-ins and no-shows.

## Dependencies

- `02_Database_Schema.md` -- `groupClasses`, `sessions` (type: group), and `attendance` collections
- `03_API_Endpoints.md` -- `createRecurringSeries`, `markSessionComplete`, `cancelSession` callables
- `04_UI_Design_System.md` -- Card patterns, form patterns, checkbox components
- `06_Client_Management.md` -- Client picker for roster management
- `09_Recurring_Sessions.md` -- Recurrence for weekly/biweekly class schedules
- `11_Packages_Payments.md` -- Per-student payment tracking via attendance records

## Group Class Definition

A group class definition is the template -- "Tuesday Morning Vinyasa" -- separate from the individual session instances it generates.

### Create Group Class

**Entry point**: FAB menu on Today dashboard or Calendar: "Group Class"

**Form (full page)**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Class Name | Text input | Yes | e.g., "Morning Flow", "Gentle Yoga" |
| Max Capacity | Number input | Yes | Minimum 2. Enforced when adding students. |
| Default Roster | Client multi-select | No | Pick from active clients. Can be empty at creation. |
| Location | Text input | No | Free text |
| Date | Date picker | Yes | Date of first session |
| Start Time | Time picker | Yes | 15-minute increments |
| End Time | Time picker | Yes | Default: start + 60 min |
| Recurring | Toggle + config | No | Same options as private sessions: weekly, biweekly, monthly |

**Client multi-select for roster**: A searchable list of active clients with checkboxes. Shows selected count and the capacity limit: "4 / 8 students". Disables adding more when capacity is reached. Order alphabetically.

**Submit behavior**:
1. Create a `groupClasses` document with name, maxCapacity, defaultRoster, location
2. If non-recurring: create a single `sessions` document with `type: 'group'` and `groupClassId` reference
3. If recurring: call `createRecurringSeries` with `type: 'group'` and `linkedId` set to the new groupClassId
4. For each generated session, create `attendance` records for every client in the default roster (with `attended: false`, `paymentStatus: 'unpaid'`)
5. Navigate to the class detail screen
6. Toast: "Class created"

## Group Class Detail Screen

Accessed by tapping a group class from the Classes tab in bottom navigation, or by tapping a group session card on the Today/Calendar views.

### Classes List (Bottom Nav Tab)

The Classes tab shows all group class definitions:

- Each class renders as a card: class name, student count ("5 / 8 students"), location if set, next upcoming session date
- Sorted alphabetically by class name
- Tap to open class detail
- Empty state: Lucide `UsersRound` icon, "No classes yet", "Create your first group class to get started", CTA "Create Class"

### Class Detail Layout

1. **Header**: Class name as title. "Edit" button (right).
2. **Info section**: Max capacity, location (if set), recurrence summary (e.g., "Every Tuesday, 9:00 -- 10:00 AM"). If non-recurring, show "One-time class".
3. **Default roster**: List of enrolled students with initials avatar and name. Each row has a remove button (x icon). "Add Student" button at the bottom if under capacity.
4. **Upcoming sessions**: Next 3 session instances for this class, rendered as compact session cards. "View all" link to see the full schedule in calendar view filtered to this class.
5. **Actions**: "Cancel Class" (destructive text link) -- cancels all future sessions and deactivates the class definition.

## Edit Group Class

Accessed from the "Edit" button on the class detail screen.

Same form as creation, pre-filled. Key behaviors:

- **Changing roster**: Adding or removing students from the default roster updates future session attendance records. Existing (past) attendance records are untouched.
- **Changing capacity**: If the new capacity is less than the current roster count, block the save with an error: "Remove [N] students before reducing capacity."
- **Changing schedule**: If the class is recurring, show the standard "this session only" / "this and all future" prompt. See `09_Recurring_Sessions.md`.

## Roster Management

### Default Roster vs Per-Session Attendance

These are distinct concepts:

| Concept | Where It Lives | What It Controls |
|---------|---------------|------------------|
| Default roster | `groupClasses.defaultRoster` | Who is automatically enrolled in every new instance |
| Session attendance | `attendance` collection | Who actually showed up to a specific instance |

When a new session instance is generated (manually or via recurrence), an `attendance` record is created for each client in the default roster. The instructor can then adjust per-session.

### Adding a Student to the Roster

1. Tap "Add Student" on the class detail screen
2. Client picker opens (same searchable list as session creation, minus clients already on the roster)
3. If at capacity, the picker is disabled with a message: "Class is full (8/8)"
4. On selection: add `clientId` to `groupClasses.defaultRoster` array, create `attendance` records for all future scheduled sessions of this class

### Removing a Student from the Roster

1. Tap the remove (x) icon on a student row in the roster
2. Brief confirmation: "Remove [Name] from [Class Name]?"
3. On confirm: remove `clientId` from `defaultRoster` array, delete `attendance` records for future sessions only. Past attendance is preserved.

### Per-Session Drop-Ins

For a specific session instance, the instructor can add a student who is not on the default roster:

1. On the session attendance screen (see below), tap "Add Drop-in"
2. Client picker opens, excluding students already attending this session
3. Capacity is still enforced -- if the session is full, drop-ins are blocked
4. Creates an `attendance` record for this session only. Does not modify the default roster.

## Session Attendance Screen

Accessed by tapping a group session card on Today/Calendar, or from the class detail's upcoming sessions list.

### Layout

1. **Header**: Class name, date, time
2. **Attendance list**: All students for this session, each row containing:
   - Initials avatar + client name (tappable -- navigates to client detail)
   - Attendance checkbox (large, easy touch target)
   - Payment badge: "Paid" (green) or "Unpaid" (red), tappable to toggle
3. **Drop-in section**: "Add Drop-in" button below the attendance list (if under capacity)
4. **Summary bar**: Fixed at bottom: "4/6 attended -- 3 paid, 3 unpaid"
5. **Actions**: "Mark Complete" button (primary) if session is scheduled

### Attendance Checkbox Behavior

- Defaults to `false` (unchecked) for all students
- Checking marks `attendance.attended = true`
- Unchecking marks it back to `false`
- Write happens immediately on toggle (optimistic update with Firestore write)
- No "save" button for attendance -- each checkbox is an independent write

### Mark Complete (Group Session)

When the instructor taps "Mark Complete":

1. Calls `markSessionComplete` Cloud Function
2. The function sets the session to `completed` and attempts to deduct one group credit from each attending student's active group package
3. Students marked as not attended are not charged a credit
4. UI updates with per-student payment results
5. Toast: "Class completed -- [N] credits used"

Students without an active group package remain as "Unpaid" after completion. The instructor can manually toggle payment status per student.

## Group Sessions on Today/Calendar

Group sessions render as session cards with slightly different content than private sessions:

| Element | Display |
|---------|---------|
| Title | Class name (e.g., "Morning Flow") |
| Type indicator | "Group (5/8)" showing enrolled/capacity |
| Location | Same as private sessions |
| Status badge | Same as private sessions |
| Prep button | Shows roster with health notes summary instead of single-client prep |

## Group Session Prep

When the instructor taps "Prep" on a group session card (see `12_Session_Notes_Prep.md`):

- Shows the full roster for this session
- Each student has a one-line health notes preview (first ~40 characters of their `healthNotes`)
- Students with non-empty health notes are sorted to the top
- Tapping a student opens their full client detail
- No session history shown per student in group prep (too much information for a quick scan)

## Cancelling a Group Class

### Cancel Single Session

Uses the standard `cancelSession` flow (see `13_Cancellations_Rescheduling.md`). Refunds credits for all attending students who were marked as paid.

### Cancel All Future Sessions

From the class detail screen, "Cancel Class" triggers:

1. Confirmation dialog: "Cancel [Class Name]? This will cancel all future sessions. Past sessions and attendance are preserved."
2. On confirm: call `deleteRecurringSeries` with `deleteMode: 'future'`
3. The group class definition remains in the database but generates no new sessions
4. The class card in the Classes tab shows "Cancelled" status and moves to the bottom of the list

## Gaps & Assumptions

1. **No waitlist.** When a class hits capacity, additional students simply cannot be added. No waitlist or overflow notification. Deferred to `16_Future_Features.md`.

2. **No per-class pricing.** All group sessions use the same group credit type from packages. There's no way to have "premium" and "standard" group classes that consume different credit amounts.

3. **Attendance after completion.** Once a session is marked complete, the attendance list becomes read-only. If the instructor needs to correct attendance, they must contact support (or in practice, manually adjust payment status). A post-completion edit window is a candidate for future improvement.

4. **Class archival.** There's no explicit archive for group classes (unlike clients). Cancelled classes remain in the list with a "Cancelled" label. If the list grows long, a filter or archive feature would be needed.

5. **No co-teaching.** Each class has one instructor. Multi-instructor classes or substitutes are not supported in v1.

6. **Drop-in tracking.** Drop-ins are added per-session but there's no aggregate view of how often a client drops in without being on the roster. This could inform roster decisions but is not tracked in v1.
```  
