```markdown
## Overview

YogaFlow uses Firebase Cloud Functions for server-side logic that cannot or should not run on the client. Most CRUD operations happen directly from the client via the Firestore SDK -- Cloud Functions handle operations that require atomicity, cascading writes, denormalization maintenance, or scheduled jobs.

This is not a traditional REST API. The client reads and writes Firestore directly for simple operations, with security rules (see `01_Auth.md`) as the access control layer. Cloud Functions supplement this for complex multi-document operations.

## Dependencies

- `01_Auth.md` -- All callable functions verify auth; security rules handle direct Firestore access
- `02_Database_Schema.md` -- Collection structures and field definitions
- `09_Recurring_Sessions.md` -- Recurrence generation logic
- `11_Packages_Payments.md` -- Credit deduction and refund rules
- `13_Cancellations_Rescheduling.md` -- Cancellation side effects

## Client-Side Direct Operations

These operations go straight to Firestore from the client. No Cloud Function needed -- standard single-document CRUD protected by security rules.

| Collection | Operations | Notes |
|-----------|-----------|-------|
| instructors | Read, update | Profile updates |
| clients | Create, read, update | Name, contact, health notes, status changes (archive) |
| sessions | Create, read, update | Single non-recurring session CRUD, marking complete, adding notes |
| groupClasses | Create, read, update | Class definition, roster management |
| attendance | Create, read, update | Marking attended/not attended |
| packages | Read | Client-side reads only; writes go through Cloud Functions |

**Queries the client runs directly:**

| Query | Collection | Filters | Used By |
|-------|-----------|---------|---------|
| Today's sessions | sessions | `instructorId` + `date` == today | Dashboard, see `05_Dashboard_Today_View.md` |
| Sessions by date range | sessions | `instructorId` + `date` range | Calendar, see `10_Calendar_View.md` |
| Active clients | clients | `instructorId` + `status` == active | Client list, see `06_Client_Management.md` |
| Client session history | sessions | `instructorId` + `clientId`, ordered by `date` desc, limit 3 | Session prep, see `12_Session_Notes_Prep.md` |
| Session attendance | attendance | `sessionId` | Group class view, see `08_Group_Classes.md` |
| Active package | packages | `instructorId` + `clientId` + `type` + `status` == active | Payment tracking, see `11_Packages_Payments.md` |

## Cloud Functions -- Callable

Callable functions are invoked from the client via the Firebase SDK. All require authenticated user. All validate that the requesting user owns the referenced documents.

---

### `deleteClient`

**Trigger**: Client-invoked callable

**Why not client-side**: Requires cascading deletes across multiple collections in a batch.

**Input**: `{ clientId: string }`

**Logic**:
1. Verify the client document belongs to the calling instructor
2. Batched write:
   - Delete the client document
   - Delete all sessions where `clientId` matches
   - Delete all attendance records where `clientId` matches
   - Delete all packages where `clientId` matches
   - Remove `clientId` from `defaultRoster` arrays in any groupClasses
3. Return `{ success: true, deletedCounts: { sessions, attendance, packages } }`

**Error cases**: Client not found, client belongs to another instructor, batch write failure (retry).

See `06_Client_Management.md` for the confirmation flow that gates this.

---

### `createPackage`

**Trigger**: Client-invoked callable

**Why not client-side**: Must enforce the one-active-package-per-type-per-client rule atomically.

**Input**: `{ clientId: string, type: 'private' | 'group', totalCredits: number }`

**Logic**:
1. Query for existing active package with same `clientId` + `type`
2. If one exists, reject with error: "Client already has an active [type] package"
3. Create package document with `remainingCredits` = `totalCredits`, `status` = `active`
4. Return the created package document

---

### `deductCredit`

**Trigger**: Client-invoked callable

**Why not client-side**: Must atomically deduct credit and update session/attendance payment status.

**Input**: `{ clientId: string, sessionId: string, type: 'private' | 'group' }`

**Logic**:
1. Find active package for `clientId` + `type`
2. If no active package, mark session/attendance as `unpaid` and return `{ paid: false, reason: 'no_active_package' }`
3. If `remainingCredits` > 0, transactional write:
   - Decrement `remainingCredits` by 1
   - If `remainingCredits` hits 0, set `status` to `depleted`
   - Set `paymentStatus` to `paid` on the session (private) or attendance record (group)
   - Decrement `unpaidCount` on client document
4. Return `{ paid: true, remainingCredits }`

See `11_Packages_Payments.md` for when this is called (manual trigger vs automatic).

---

### `cancelSession`

**Trigger**: Client-invoked callable

**Why not client-side**: Cancellation involves conditional credit refund, attendance cleanup, and status updates across documents.

**Input**: `{ sessionId: string }`

**Logic**:
1. Verify session belongs to calling instructor and is not already cancelled
2. Set `status` to `cancelled`, set `cancelledAt` to server timestamp
3. **Credit refund logic**:
   - For private sessions: if `paymentStatus` == `paid`, find the client's most recent depleted-or-active package of type `private`, increment `remainingCredits` by 1, set status back to `active` if it was `depleted`
   - For group sessions: for each attendance record on this session where `paymentStatus` == `paid`, refund one group credit per student using the same logic
4. Update `unpaidCount` on affected client documents
5. Return `{ success: true, creditsRefunded: number }`

See `13_Cancellations_Rescheduling.md` for full cancellation rules.

---

### `createRecurringSeries`

**Trigger**: Client-invoked callable

**Why not client-side**: Must create a series document and batch-generate initial session instances atomically.

**Input**:
```
{
  rrule: string,
  type: 'private' | 'group',
  linkedId: string,           // clientId or groupClassId
  sessionDefaults: {
    title: string,
    startTime: string,
    endTime: string,
    location?: string
  }
}
```

**Logic**:
1. Create `series` document with provided fields, `generatedUntil` = now
2. Parse `rrule` and generate session instances for the next 4 weeks
3. Batch-write all session documents with `seriesId` reference
4. For group sessions, pre-populate attendance records from `defaultRoster`
5. Update `series.generatedUntil` to the last generated date
6. Return `{ seriesId, sessionsCreated: number }`

See `09_Recurring_Sessions.md` for RRULE parsing and generation window details.

---

### `editRecurringSeries`

**Trigger**: Client-invoked callable

**Input**:
```
{
  seriesId: string,
  editMode: 'single' | 'future',
  sessionId: string,          // the instance being edited
  updates: Partial<SessionDefaults>
}
```

**Logic**:
- **`single`**: Mark the session as `isException: true`, apply updates to that session only
- **`future`**: Update `series.sessionDefaults` with new values, delete all future non-exception sessions after the edited session's date, regenerate from the new defaults, update `generatedUntil`

---

### `deleteRecurringSeries`

**Trigger**: Client-invoked callable

**Input**: `{ seriesId: string, deleteMode: 'single' | 'future' | 'all' }`

**Logic**:
- **`single`**: Cancel the single session instance (delegates to `cancelSession` logic)
- **`future`**: Cancel all sessions in the series with `date` >= today, deactivate the series
- **`all`**: Cancel all sessions in the series regardless of date, delete the series document

---

### `markSessionComplete`

**Trigger**: Client-invoked callable

**Why not client-side**: Completing a session can trigger automatic credit deduction if a package exists.

**Input**: `{ sessionId: string }`

**Logic**:
1. Set session `status` to `completed`
2. If private session and `paymentStatus` is `unpaid`, attempt `deductCredit` internally
3. If group session, attempt `deductCredit` for each attending student
4. Return `{ status: 'completed', paymentsProcessed: number }`

## Cloud Functions -- Scheduled

### `extendRecurringSeries`

**Trigger**: Scheduled -- runs daily at 2:00 AM UTC

**Purpose**: Keeps the rolling generation window for recurring sessions topped up.

**Logic**:
1. Query all `series` documents where `generatedUntil` < now + 4 weeks
2. For each, generate new session instances from `generatedUntil` to now + 4 weeks
3. Batch-write new sessions, update `generatedUntil`

This ensures the instructor always sees at least 4 weeks of upcoming sessions without manual intervention. See `09_Recurring_Sessions.md`.

## Cloud Functions -- Firestore Triggers

### `onSessionPaymentUpdate`

**Trigger**: Firestore `onUpdate` on `sessions/{sessionId}` when `paymentStatus` changes

**Purpose**: Keep the denormalized `unpaidCount` on client documents in sync.

**Logic**:
- If `paymentStatus` changed from `unpaid` to `paid`: decrement `clients/{clientId}.unpaidCount`
- If `paymentStatus` changed from `paid` to `unpaid`: increment `clients/{clientId}.unpaidCount`

### `onAttendancePaymentUpdate`

**Trigger**: Firestore `onUpdate` on `attendance/{attendanceId}` when `paymentStatus` changes

**Purpose**: Same denormalization sync for group session payments.

**Logic**: Same increment/decrement logic as above, using the `clientId` from the attendance record.

## Gaps & Assumptions

1. **No REST API.** There are no HTTP endpoints. All interaction is either direct Firestore access or callable Cloud Functions. If external integrations are ever needed (e.g., a booking widget), a REST layer would need to be added.

2. **Batch write limits.** Firestore batches max at 500 operations. Deleting a client with hundreds of sessions may require chunked batches. The `deleteClient` function should handle this with recursive batching.

3. **Cold start latency.** Firebase Cloud Functions (Gen 2) have cold starts of 1-3 seconds. For the `markSessionComplete` and `deductCredit` flows, consider keeping these warm or setting minimum instances to 1 if latency is noticeable.

4. **Concurrency on credit deduction.** Two simultaneous deductions on the same package could over-deduct. All credit operations use Firestore transactions to prevent this.

5. **No rate limiting beyond Firebase defaults.** Callable functions inherit Firebase's built-in rate limiting. No custom throttling is implemented for v1.

6. **Generation window of 4 weeks is assumed.** The PRD does not specify how far ahead recurring sessions should be visible. 4 weeks is a reasonable default -- long enough to plan, short enough to avoid document bloat. Adjustable in the scheduled function's configuration.
```  
