```markdown
## Overview

Client management is the foundation of YogaFlow. An instructor's client list is their business -- every session, payment, and note ties back to a client record. This file covers creating, viewing, editing, archiving, and deleting clients. The client list is intentionally simple for v1: alphabetical with search, no filters or tags.

## Dependencies

- `02_Database_Schema.md` -- `clients` collection schema, `unpaidCount` denormalization
- `03_API_Endpoints.md` -- `deleteClient` callable function for cascading hard delete
- `04_UI_Design_System.md` -- Client card pattern, empty state, form patterns, action confirmations
- `11_Packages_Payments.md` -- Payment status displayed on client records
- `08_Group_Classes.md` -- Clients appear in group class rosters

## Client List Screen

Accessible from the "Clients" tab in the bottom navigation. This is the instructor's directory.

### Layout

- **Header**: "Clients" title, with an "Add Client" button (primary, small) in the top-right
- **Search bar**: Directly below the header, always visible. Text input with a search icon. Filters the list as the instructor types.
- **Client list**: Alphabetical by name, scrollable

### Search Behavior

- Filters on `name` field, case-insensitive
- Client-side filtering against the already-loaded list -- no server query per keystroke
- Show result count below the search bar when a query is active: "3 results"
- If no matches: show inline "No clients match '[query]'" with a "Clear search" link
- Search does not match against email, phone, or health notes -- name only for v1

### Client Cards

Each client renders as a list row (not a full card -- keep it compact for scanning long lists):

| Element | Position | Source |
|---------|----------|--------|
| Initials avatar | Left | First letter of first and last name, on `--secondary` background circle |
| Client name | Center, top | `name` field |
| Contact preview | Center, bottom | Phone or email, whichever exists. If both, show phone. Muted text. |
| Unpaid badge | Right | Red badge showing count if `unpaidCount > 0`. Hidden if zero. |

Tap a client row to navigate to the client detail screen.

### List Loading

- Initial load: query `clients` where `instructorId == uid` and `status == 'active'`, order by `name`
- Show skeleton rows while loading (5 rows)
- Firestore offline persistence means this list loads instantly on repeat visits

### Empty State

- Icon: Lucide `UserPlus` (48px, muted)
- Heading: "No clients yet"
- Description: "Add your first client to start organizing your sessions."
- CTA: "Add Client" button (primary)

## Client Detail Screen

Accessed by tapping a client row. Shows all client information and related data.

### Layout (top to bottom)

1. **Header**: Client name as page title, "Edit" button (secondary) in top-right
2. **Contact section**: Phone and email with tap-to-call / tap-to-email links. Show "No contact info" in muted text if both are empty.
3. **Health notes section**: Heading "Health Notes", then the free-text content. Show "No health notes" in muted text if empty. A small "Edit" link inline to jump to editing health notes.
4. **Payment summary**: Active package info (type, remaining credits) and unpaid session count. See `11_Packages_Payments.md` for detail. If no active package, show "No active package" with a "Create Package" link.
5. **Session history**: Last 3 sessions for this client (private and group), ordered by date descending. Each row shows date, type, status, and a truncated notes preview. "View all" link navigates to a full scrollable history.
6. **Actions section**: At the bottom, separated visually. "Archive Client" (secondary button) and "Delete Client" (destructive text link, intentionally understated).

### Session History Query

```
sessions
  .where('instructorId', '==', uid)
  .where('clientId', '==', clientId)
  .orderBy('date', 'desc')
  .limit(3)
```

For group session history, also query:
```
attendance
  .where('instructorId', '==', uid)
  .where('clientId', '==', clientId)
  .orderBy('createdAt', 'desc')
  .limit(3)
```

Merge and sort both result sets by date, take the top 3. This gives a unified view of the client's recent activity across private and group sessions.

## Create Client

Triggered from the "Add Client" button on the client list or the empty state CTA.

### Form

Opens as a new page (not a sheet -- the form may grow with health notes content).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text input | Yes | Only required field. Keep onboarding fast. |
| Phone | Tel input | No | Standard phone input type for mobile keyboard |
| Email | Email input | No | Standard email input type |
| Health Notes | Textarea | No | Free text. No character limit in the UI. Placeholder: "Injuries, conditions, preferences..." |

- Submit button: "Add Client" (primary, full-width, bottom of form)
- On success: navigate to the new client's detail screen
- On success toast: "Client added"
- Optimistic: not needed here -- wait for the write to confirm since it's a one-time action

### Data Written

Creates a document in `clients` with:
- `instructorId`: current user UID
- `name`, `email`, `phone`, `healthNotes`: from form (empty string for unfilled optional fields)
- `status`: `active`
- `unpaidCount`: `0`
- `createdAt`, `updatedAt`: server timestamps

## Edit Client

Accessed from the "Edit" button on the client detail screen.

- Same form layout as Create, pre-filled with current values
- Submit button text: "Save Changes"
- On success: return to client detail screen with updated data
- On success toast: "Client updated"
- Only writes changed fields plus `updatedAt`

The instructor can edit health notes from either the full edit form or the inline "Edit" link on the health notes section (which opens just the textarea in a sheet for quick updates).

## Archive Client

"Soft delete" -- hides the client from the active list but preserves all data.

### Flow

1. Instructor taps "Archive Client" on the client detail screen
2. `AlertDialog` confirmation: "Archive [Name]?" / "They'll be hidden from your client list. Sessions, notes, and payment history are preserved. You can restore them anytime."
3. Confirm button: "Archive" (secondary style, not destructive)
4. On confirm: set `clients/{clientId}.status` to `archived`, update `updatedAt`
5. Navigate back to client list
6. Toast: "[Name] archived"

### Viewing Archived Clients

- A toggle or link at the top of the client list: "Show archived" / "Hide archived"
- Archived clients render with muted styling (reduced opacity) and an "Archived" label
- Tapping an archived client opens their detail screen with a "Restore" button in place of "Archive"
- Restore sets `status` back to `active`

### Archived Client Behavior

- Archived clients do not appear in session creation client pickers
- Archived clients do not appear in group class roster pickers
- Archived clients remain in existing group class rosters -- their enrollment is not automatically removed (the instructor may want to restore them)
- Existing sessions with archived clients remain visible on the calendar and history

## Delete Client (Hard Delete)

Permanent, irreversible removal of the client and all associated data.

### Flow

1. Instructor taps "Delete Client" on the client detail screen
2. `AlertDialog` with destructive styling: "Delete [Name] permanently?" / "This will remove all their sessions, notes, attendance records, and payment history. This cannot be undone."
3. Confirm button: "Delete Permanently" (destructive style)
4. On confirm: call the `deleteClient` Cloud Function (see `03_API_Endpoints.md`)
5. Show a loading state on the dialog while the function executes
6. On success: navigate to client list, toast "[Name] deleted"
7. On error: dismiss dialog, show error toast "Could not delete client. Try again."

The Cloud Function handles cascading: deleting sessions, attendance records, packages, and removing the client from group class rosters.

## Client Data in Other Contexts

Clients appear throughout the app, not just on the client list:

| Context | What's Shown | Link to Client? |
|---------|-------------|-----------------|
| Session creation | Client picker (name search) | No |
| Session card (Today/Calendar) | Client name as title | Yes, tap navigates to detail |
| Session prep view | Health notes, history | Yes |
| Group class roster | Name + attendance checkbox | Yes |
| Package creation | Client picker | No |

When displaying a client's name anywhere in the app, it should be tappable and navigate to the client detail screen (except in picker/selection contexts where tapping selects rather than navigates).

## Gaps & Assumptions

1. **No duplicate detection.** If the instructor creates two clients named "Sarah Johnson," the app does not warn or merge. For a solo instructor managing 20-50 clients, duplicates are rare and easy to spot manually.

2. **No client import.** There's no CSV import or bulk add for v1. Instructors migrate clients one at a time. With a small client base (typical yoga instructor has 15-40 regular clients), this is manageable. Bulk import is deferred to `16_Future_Features.md`.

3. **No client-side validation beyond required name.** Phone and email fields use HTML input types for format hints but no strict validation. The instructor may store partial numbers or notes in the phone field.

4. **Health notes versioning.** Edits to health notes overwrite the previous value. There's no edit history or changelog. If the instructor wants to track how a client's conditions evolve over time, they should use session notes for that. Health notes are the current snapshot.

5. **Client count limits.** No enforced limit on number of clients. Firestore can handle thousands of documents per query. The alphabetical list with client-side search will degrade if an instructor has 500+ clients, but this is far outside the typical range.

6. **Contact info is display-only.** The app does not send emails or SMS. Phone and email are stored for the instructor's reference and rendered as tappable links that open the device's native dialer/mail client.
```  
