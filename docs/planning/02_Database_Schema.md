▸ Extended thinking (4523 chars)  
```markdown
## Overview

Firestore schema for YogaFlow. All collections follow a single-tenant model -- every document includes an `instructorId` field that maps to the authenticated user's UID. There are no shared documents or cross-instructor queries. Security rules enforce ownership on every operation (see `01_Auth.md`).

Region: **us-central1** (locked in during Step 11).

## Dependencies

- `01_Auth.md` -- Auth UID is the `instructorId` on every document
- `03_API_Endpoints.md` -- Cloud Functions that read/write these collections
- `09_Recurring_Sessions.md` -- Recurrence logic that generates session instances

## Collections

### `instructors`

**Purpose**: Instructor profile, created on first sign-in.

**Document ID**: Firebase Auth UID

| Field | Type | Notes |
|-------|------|-------|
| uid | string | Matches Auth UID and document ID |
| email | string | From auth profile |
| displayName | string | Required during onboarding |
| onboardingComplete | boolean | Gates redirect to onboarding screen |
| createdAt | Timestamp | Server timestamp |
| updatedAt | Timestamp | Server timestamp |

---

### `clients`

**Purpose**: Client records managed by the instructor.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner |
| name | string | Required -- only required field at creation |
| email | string | Optional |
| phone | string | Optional |
| healthNotes | string | Free-text field for injuries, conditions, preferences |
| status | string | `active` or `archived` |
| unpaidCount | number | Denormalized count of unpaid sessions. See note below. |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

**Denormalized `unpaidCount`**: Payment status lives on individual sessions/attendance records, but the client list needs to surface payment status without reading all sessions. Increment on session creation (default unpaid), decrement when marked paid. A Cloud Function keeps this consistent. See `11_Packages_Payments.md`.

**Archive vs delete**: Setting `status` to `archived` hides the client from active lists but preserves all session history, notes, and payment data. Hard delete removes the client document and all associated sessions, attendance records, and packages. Hard delete is available via a confirmation flow in settings. See `06_Client_Management.md`.

**Indexes**:
- `instructorId` + `status` -- Active client list query
- `instructorId` + `name` -- Alphabetical sorting

---

### `sessions`

**Purpose**: Individual session instances for both private and group sessions. Each occurrence of a recurring session is its own document.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner |
| type | string | `private` or `group` |
| clientId | string \| null | Set for private sessions, null for group |
| groupClassId | string \| null | Set for group sessions, null for private |
| title | string | Client name (private) or class name (group) |
| date | Timestamp | Date of this specific instance |
| startTime | string | HH:mm format, local time |
| endTime | string | HH:mm format, local time |
| location | string | Optional -- studio name, address, or "online" |
| status | string | `scheduled`, `completed`, or `cancelled` |
| paymentStatus | string | `paid` or `unpaid`. For private sessions only. Group payment is tracked per-student in `attendance`. |
| notes | string | Post-session notes, free text |
| seriesId | string \| null | Links to `series` document if recurring |
| isException | boolean | True if this instance was individually edited away from its series defaults |
| cancelledAt | Timestamp \| null | When cancelled, for record keeping |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

**Time storage**: `date` is a Timestamp at midnight UTC for the session date. `startTime` and `endTime` are stored as HH:mm strings in the instructor's local time. This avoids timezone math for display while keeping date queries simple. See Gaps section for timezone discussion.

**Indexes**:
- `instructorId` + `date` -- Today view and calendar queries
- `instructorId` + `clientId` + `date` (descending) -- Session history for prep view (last 3)
- `instructorId` + `status` + `date` -- Filtered views (e.g., cancelled sessions)
- `instructorId` + `seriesId` -- Bulk updates to recurring series

---

### `groupClasses`

**Purpose**: Group class definitions. Separate from session instances -- a group class is the "template" that generates recurring session instances.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner |
| name | string | e.g., "Tuesday Morning Vinyasa" |
| maxCapacity | number | Enrollment cap. Enforced on add. |
| defaultRoster | string[] | Array of clientIds -- the regular attendees |
| location | string | Optional |
| seriesId | string \| null | Links to `series` if recurring |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

**Roster vs attendance**: `defaultRoster` is the standing enrollment list. Per-session attendance is tracked in the `attendance` collection. When a session instance is generated, the default roster pre-populates attendance records, but the instructor can add drop-ins or remove no-shows per session. See `08_Group_Classes.md`.

---

### `attendance`

**Purpose**: Per-student, per-session attendance and payment tracking for group classes.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner (denormalized for security rules) |
| sessionId | string | References `sessions` document |
| clientId | string | References `clients` document |
| attended | boolean | Checkbox -- did they show up? |
| paymentStatus | string | `paid` or `unpaid` |
| createdAt | Timestamp | |

**Why a separate collection?** Group sessions have N students per session. Embedding attendance as a subcollection of sessions or as an array field both create querying problems. A top-level collection allows efficient queries in both directions: "who attended this session?" and "what sessions did this client attend?"

**Indexes**:
- `sessionId` -- All attendance for a session
- `instructorId` + `clientId` + `createdAt` (descending) -- Client's group session history

---

### `series`

**Purpose**: Recurrence rules for recurring sessions. One series document per recurring pattern.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner |
| rrule | string | RRuleJS-compatible RRULE string |
| type | string | `private` or `group` |
| linkedId | string | clientId (private) or groupClassId (group) |
| sessionDefaults | map | Template fields: title, startTime, endTime, location |
| generatedUntil | Timestamp | How far ahead instances have been generated |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

**`generatedUntil`**: Session instances are generated in batches (e.g., 4 weeks ahead). A scheduled Cloud Function or on-demand check extends the horizon. This avoids creating hundreds of future documents upfront. See `09_Recurring_Sessions.md` for generation logic.

**`sessionDefaults`**: When generating a new session instance, these fields are copied onto the session document. If the instructor edits "this and all future sessions," update `sessionDefaults` and regenerate future instances.

---

### `packages`

**Purpose**: Session credit bundles. Separate package types for private and group sessions.

**Document ID**: Auto-generated

| Field | Type | Notes |
|-------|------|-------|
| instructorId | string | Owner |
| clientId | string | References `clients` |
| type | string | `private` or `group` |
| totalCredits | number | Original bundle size (e.g., 5, 10) |
| remainingCredits | number | Current balance. Decremented on session completion, incremented on cancellation refund. |
| status | string | `active` or `depleted` |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

**Credit lifecycle**: See `11_Packages_Payments.md` for the full flow. Key rule: cancelling a session auto-refunds one credit to the active package. A package moves to `depleted` when `remainingCredits` hits 0.

**One active package per type per client.** An instructor should not create a new private package for a client who already has an active private package. Enforce in the UI and validate in Cloud Functions.

**Indexes**:
- `instructorId` + `clientId` + `type` + `status` -- Find active package for a client

## Data Relationships

```
instructors (1)
  └── clients (N)
       └── packages (N, typically 0-2 active)
  └── groupClasses (N)
       └── defaultRoster → clients
  └── series (N)
       └── sessions (N instances per series)
            └── attendance (N per group session)
  └── sessions (N, standalone non-recurring)
```

All relationships are by ID reference, not subcollections. This keeps queries flat and avoids Firestore subcollection limitations with offline persistence.

## Deletion Cascading

When hard-deleting a client, a Cloud Function must clean up:
- All `sessions` where `clientId` matches
- All `attendance` where `clientId` matches
- All `packages` where `clientId` matches
- Remove `clientId` from any `groupClasses.defaultRoster` arrays

This should be a batched write in a Cloud Function, not client-side. See `06_Client_Management.md`.

## Gaps & Assumptions

1. **Timezone handling.** Times are stored as local HH:mm strings. If an instructor changes timezones (e.g., travel), existing sessions display correctly for when they were created but new sessions use the new local time. No timezone field is stored per session -- assumed the instructor operates in a single timezone. Flag for v2 if multi-timezone support is needed.

2. **Document size limits.** Firestore documents max at 1 MiB. `healthNotes` and `notes` are free text with no specified max length. Assumed these will be short paragraphs, well under limits. No truncation enforced.

3. **`unpaidCount` consistency.** The denormalized counter on clients can drift if a write fails mid-transaction. The Cloud Function that manages this should use Firestore transactions. An occasional reconciliation job could correct drift, but likely unnecessary at v1 scale.

4. **No soft-delete on sessions.** Cancelled sessions are kept with `status: cancelled`. There is no archive/restore pattern for sessions -- only clients have archive behavior.

5. **Package expiration.** Packages have no expiration date in v1. A `depleted` package remains in the database as history. Time-based expiration (e.g., "use within 3 months") is deferred to `16_Future_Features.md`.

6. **Group class without recurrence.** A `groupClasses` document can exist without a `seriesId` for one-off group sessions. The instructor creates the class, adds a roster, and manually creates individual session instances.
```  
