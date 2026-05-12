```markdown
## Overview

YogaFlow v1 tracks payments as session credits, not monetary amounts. An instructor sells a client a "10-session package" and the app counts down remaining sessions. Each session is marked paid or unpaid, and those flags roll up into a client-level summary. There is no payment processing, invoicing, or dollar tracking -- the instructor handles money collection externally and uses the app to track who owes what.

## Dependencies

- `02_Database_Schema.md` -- `packages` collection, `attendance.paymentStatus`, `sessions.paymentStatus`, `clients.unpaidCount`
- `03_API_Endpoints.md` -- `createPackage`, `deductCredit`, `cancelSession` (refund logic), `markSessionComplete` (auto-deduct), `onSessionPaymentUpdate` and `onAttendancePaymentUpdate` triggers
- `07_Private_Sessions.md` -- Private session payment badge and manual toggle
- `08_Group_Classes.md` -- Per-student payment tracking in attendance records
- `13_Cancellations_Rescheduling.md` -- Auto-refund on cancellation

## Package Model

A package is a bundle of session credits purchased by a client. Separate packages for private and group sessions.

| Field | Meaning |
|-------|---------|
| `type` | `private` or `group` -- determines which sessions consume credits |
| `totalCredits` | Original size of the package (e.g., 5, 10, 20) |
| `remainingCredits` | Current balance, decremented on use, incremented on refund |
| `status` | `active` (has credits) or `depleted` (zero remaining) |

**Constraint**: One active package per type per client. The instructor cannot create a second active private package for a client who already has one. The `createPackage` Cloud Function enforces this. If the existing package is depleted, creating a new one is allowed.

### Common Package Sizes

The creation form offers preset options but also allows custom values:

- Presets: 1, 5, 10, 20
- Custom: free-entry number field (minimum 1, no maximum enforced)

## Create Package

### Entry Points

- Client detail screen: "Create Package" link in the payment summary section
- When marking a session paid and no active package exists: a prompt offers "Create a package?" as a shortcut

### Form

Opens as a bottom sheet (simple form, not worth a full page):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Package type | Segmented toggle | Yes | "Private" or "Group" |
| Credits | Preset buttons + custom input | Yes | Tap a preset or type a number |

Client is implicit (the form is accessed from a client's detail screen).

**Validation**:
- If an active package of the selected type already exists: show inline error "Active [type] package exists ([N] credits remaining). Use those credits first or wait until depleted."
- Credits must be >= 1

**Submit**: Calls `createPackage` Cloud Function. On success, dismiss the sheet and update the payment summary on the client detail screen. Toast: "[N]-session [type] package created".

## Credit Lifecycle

### Deduction

Credits are deducted when a session is marked as complete (via `markSessionComplete` Cloud Function):

1. Session is marked complete
2. Function looks up active package matching the client and session type
3. If package exists with `remainingCredits > 0`:
   - Decrement `remainingCredits` by 1
   - If `remainingCredits` == 0, set `status` to `depleted`
   - Set payment status to `paid` on the session (private) or attendance record (group)
4. If no active package or zero credits: payment status stays `unpaid`

For group sessions, this runs once per attending student. Each student's credit is deducted from their own package independently.

### Manual Override

The instructor can manually toggle payment status on any session or attendance record:

**Marking unpaid as paid (without package):**
- Tap the "Unpaid" badge on session detail or attendance row
- Confirmation: "Mark as paid?"
- Sets `paymentStatus` to `paid` without touching any package
- Use case: client paid cash, Venmo, or has a special arrangement

**Marking unpaid as paid (with active package):**
- Tap the "Unpaid" badge
- If active package exists, confirmation includes: "Deduct 1 credit from [type] package? ([N] remaining)" with options "Use Credit" and "Mark Paid Without Credit"
- "Use Credit" calls `deductCredit`
- "Mark Paid Without Credit" sets payment status directly

**Marking paid as unpaid:**
- Tap the "Paid" badge
- Confirmation: "Mark as unpaid?"
- Sets `paymentStatus` to `unpaid`
- If the session was originally paid via package credit, the credit is refunded (increment `remainingCredits`, reactivate package if depleted)

### Refund on Cancellation

When a session is cancelled (see `13_Cancellations_Rescheduling.md`):

- If `paymentStatus` is `paid`, automatically refund one credit to the client's package
- Refund targets the most recent package of the matching type (active first, then most recently depleted)
- If the refunded package was `depleted`, set it back to `active`
- If `paymentStatus` is `unpaid`, no refund action needed

For group session cancellations, refund runs per attending student who was marked as paid.

## Payment Status Display

### Session Level

On the session detail view (see `07_Private_Sessions.md`):

| State | Badge |
|-------|-------|
| Unpaid | Red "Unpaid" badge |
| Paid (via package) | Green "Paid" badge with a small package icon |
| Paid (manual) | Green "Paid" badge without the package icon |

The package icon distinction helps the instructor remember whether a credit was consumed.

### Client Level

On the client detail screen (see `06_Client_Management.md`), the payment summary section shows:

**With active package:**
```
Private: 7 of 10 credits remaining
3 unpaid sessions
```

**Without active package:**
```
No active private package
5 unpaid sessions          [Create Package]
```

**With no unpaid sessions and no package:**
```
All sessions paid
```

The `unpaidCount` on the client document drives the "N unpaid sessions" display. This is denormalized and maintained by Firestore triggers (see `03_API_Endpoints.md`).

### Client List Level

On the client list (see `06_Client_Management.md`), each client row shows a red badge with the unpaid count if `unpaidCount > 0`. This gives the instructor a quick scan of who owes sessions.

## Denormalized `unpaidCount`

Firestore triggers keep `clients.unpaidCount` in sync:

**`onSessionPaymentUpdate`** (fires on `sessions` document update):
- `paymentStatus` changed `unpaid -> paid`: decrement client's `unpaidCount`
- `paymentStatus` changed `paid -> unpaid`: increment client's `unpaidCount`
- Only fires for private sessions (`type == 'private'`)

**`onAttendancePaymentUpdate`** (fires on `attendance` document update):
- Same logic for group session attendance records
- Uses `clientId` from the attendance record

**On session creation**: new sessions default to `unpaid`. Increment `unpaidCount` on the client document.

**On session deletion / cancellation**: if the session was `unpaid`, decrement `unpaidCount`.

All updates use `FieldValue.increment()` for atomic counter operations.

## Package History

There is no dedicated package history screen in v1. The client detail screen shows only the current active package (or a note that none exists). Depleted packages remain in Firestore and could be queried for historical data, but no UI surfaces this in v1.

If the instructor needs to see past packages, they can infer it from session history (sessions marked as "paid via package").

## Drop-in Payment for Group Classes

When a student is added as a per-session drop-in (see `08_Group_Classes.md`), the same payment logic applies:

- An attendance record is created with `paymentStatus: 'unpaid'`
- On session completion, credit deduction is attempted from their active group package
- If no package, they remain unpaid and the instructor handles it manually

Drop-ins are not treated differently from roster students for payment purposes.

## Gaps & Assumptions

1. **No dollar amounts.** The instructor tracks credits, not money. There's no price-per-session, package price, revenue total, or financial reporting. If the instructor charges $80/session and sells a 10-pack for $700, the app only knows "10 credits." Financial tracking is deferred to `16_Future_Features.md`.

2. **No package expiration.** Packages never expire. A client could buy a 10-pack and use the last credit a year later. Time-based expiration is a common real-world policy but adds complexity. Deferred.

3. **No partial credits.** Every session consumes exactly one credit regardless of duration or type. A 30-minute session and a 90-minute session both cost one credit. No half-credit or double-credit sessions.

4. **No transfer between package types.** Private credits cannot be used for group sessions and vice versa. The instructor told them to keep these separate (Step 4 decision).

5. **`unpaidCount` can drift.** If a Firestore trigger fails (rare but possible), the denormalized count may desync. A manual reconciliation function could be built but is unlikely to be needed at v1 scale. If the count looks wrong, the instructor can view individual sessions to verify.

6. **No bulk payment operations.** The instructor cannot select multiple unpaid sessions and mark them all as paid in one action. Each session is toggled individually. Bulk actions could be added if instructors frequently process payments in batches.
```  
