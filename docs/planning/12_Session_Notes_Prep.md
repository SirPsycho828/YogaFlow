```markdown
## Overview

Session notes and session prep are the two sides of the instructor's memory system. Notes capture what happened after a session ("worked on hip openers, left knee still bothering her"). Prep surfaces what the instructor needs to know before a session ("last 3 sessions focused on back pain, has a torn meniscus, 2 unpaid sessions"). Together they solve the core pain point: forgetting client details between sessions.

Notes entry is optimized for speed -- under 2 minutes, often under 30 seconds. Prep is optimized for scannability -- everything at a glance without tapping into multiple screens.

## Dependencies

- `02_Database_Schema.md` -- `sessions.notes` field, `clients.healthNotes`, `attendance` collection
- `04_UI_Design_System.md` -- Sheet (bottom drawer) component, card patterns
- `05_Dashboard_Today_View.md` -- "Add Notes" button on completed session cards, "Prep" button on scheduled cards
- `06_Client_Management.md` -- Client health notes displayed in prep view
- `07_Private_Sessions.md` -- Session detail view integrates notes display
- `08_Group_Classes.md` -- Group prep shows roster with health notes summary
- `11_Packages_Payments.md` -- Payment status shown in prep view
- `15_Notifications.md` -- Push notification links to notes entry

## Post-Session Notes

### Design Principle

The instructor just finished teaching. They might be packing up their mat, walking to their car, or greeting their next client. Notes entry must be near-instant: open, type, save. No categories, no tags, no templates, no structure. Just a text box.

### Entry Points

Three ways to reach the notes input:

1. **"Add Notes" button on the session card** -- Appears on completed sessions in the Today view where `notes` is empty. Primary-colored button, visible and inviting. See `05_Dashboard_Today_View.md`.

2. **Push notification** -- Fires 5 minutes after the session's end time. Tapping the notification deep-links directly to the notes sheet for that session. See `15_Notifications.md`.

3. **Session detail screen** -- Notes section at the bottom. If empty and session is completed, shows the same "Add Notes" button. If notes exist, shows the text with an "Edit" link.

All three entry points open the same notes sheet.

### Notes Sheet

A bottom drawer (`Sheet` component from shadcn/ui) that slides up from the bottom of the screen.

**Layout:**
- **Header**: Client name (private) or class name (group), session date. Muted text, single line. Gives context so the instructor confirms they're noting the right session.
- **Text area**: Auto-focused on open. Full width. Minimum height 120px, expands as the instructor types. No character limit. Placeholder: "How did it go?"
- **Save button**: Full-width primary button fixed at the bottom of the sheet: "Save Notes"
- **Keyboard handling**: The sheet must remain usable when the mobile keyboard is open. The text area and save button should stay visible above the keyboard. Test this carefully -- it's the most common source of mobile form frustration.

**Behavior:**
- On open: text area receives focus immediately, keyboard appears
- If notes already exist (editing): pre-populate the text area
- Save: write `notes` to `sessions/{sessionId}`, dismiss the sheet
- Optimistic update: the session card on the Today view updates immediately to show a notes preview
- Toast: "Notes saved"
- Dismiss without saving (swipe down or tap backdrop): if the text area has unsaved content, show a brief confirmation "Discard notes?" with "Discard" and "Keep Editing" options. If empty or unchanged, dismiss silently.

### Notes Display

Once notes exist on a session, they appear in two places:

**Session card (Today/Calendar):**
- Truncated preview, first ~60 characters, muted text below the session card content
- Replace the "Add Notes" button

**Session detail screen:**
- Full notes text in a card with a "Notes" heading
- "Edit" link (muted, inline) to reopen the notes sheet

### Notes for Group Sessions

Group session notes are written once for the entire class, not per student. The `sessions.notes` field holds a single text entry. If the instructor needs per-student notes, they should use each client's health notes field for ongoing conditions or reference individual clients by name in the session notes.

## Session Prep

### Purpose

Before walking into a session, the instructor taps "Prep" to see everything relevant in one view. This replaces flipping through notebooks or scrolling through past messages. The goal is confidence: "I know exactly what's going on with this client."

### Entry Point

"Prep" button on scheduled session cards in the Today view (see `05_Dashboard_Today_View.md`). The button is visible on all scheduled sessions regardless of type.

### Private Session Prep

Opens as a bottom sheet or half-screen panel (same `Sheet` component, but taller -- 75% screen height).

**Layout (top to bottom):**

1. **Client header**: Name, initials avatar. Tappable -- navigates to full client detail.

2. **Health notes card**: Full content of `clients.healthNotes`. Yellow-tinted background (`--accent` color at low opacity) to visually distinguish safety-relevant information. If empty: "No health notes on file" in muted text.

3. **Payment status**: Active package summary ("5 of 10 private credits remaining") or "No active package". If `unpaidCount > 0`: red text "3 unpaid sessions". Compact, single line.

4. **Recent sessions**: Last 3 sessions for this client, ordered by date descending.

Each session row:
| Element | Display |
|---------|---------|
| Date | "Jan 10, 2026" -- compact date format |
| Status | Small badge (completed/cancelled) |
| Notes preview | First ~80 characters of session notes. "No notes" in muted text if empty. |

Tapping a session row navigates to that session's detail view.

**Query:**
```
sessions
  .where('instructorId', '==', uid)
  .where('clientId', '==', clientId)
  .where('status', '==', 'completed')
  .orderBy('date', 'desc')
  .limit(3)
```

Only completed sessions appear in the history. Scheduled future sessions and cancelled sessions are excluded -- they don't contain useful prep information.

### Group Session Prep

Same sheet component, different content optimized for scanning a roster.

**Layout (top to bottom):**

1. **Class header**: Class name, enrolled count / capacity ("6 / 8 students").

2. **Roster with health notes**: Each student as a compact row:

| Element | Display |
|---------|---------|
| Initials avatar + name | Left-aligned, tappable to client detail |
| Health notes preview | First ~40 characters, muted text. If empty, show nothing. |

**Sorting**: Students with non-empty health notes sort to the top. Within each group (has notes / no notes), alphabetical by name. This ensures the instructor sees safety-relevant information first without hunting through the roster.

3. **Payment overview**: One-line summary: "4 paid, 2 unpaid" for enrolled students' current session attendance records.

**No session history per student in group prep.** Showing the last 3 sessions for each of 8 students would overwhelm the view. The instructor can tap a student's name to see their full client detail if they need history.

### Prep Data Loading

Prep data involves multiple queries (client record, sessions, package). Load in parallel:

- Client document (health notes) -- single document read, nearly instant from cache
- Recent sessions -- indexed query, fast
- Active package -- indexed query, fast

Show the sheet immediately with skeleton content for each section, then populate as data arrives. Health notes should appear first since they're the highest-priority information.

### Offline Prep

Prep works offline if the data has been previously cached. Since the instructor likely viewed the Today screen (which loaded session data) and previously viewed the client (which cached client data), prep data is almost always available offline. If a query returns empty from cache and the device is offline, show "Some data may be unavailable offline" in muted text at the bottom of the sheet.

## Gaps & Assumptions

1. **No structured note fields.** Notes are free text only. No mood rating, intensity level, pose checklist, or structured fields. The PRD explicitly chose free text for speed. Structured notes are a future consideration if instructors request them.

2. **No note search.** The instructor cannot search across all session notes for a keyword (e.g., "hip opener"). Notes are only visible on individual session records or in the prep view's recent history. Full-text search across notes is deferred to `16_Future_Features.md`.

3. **No note timestamps beyond session date.** The note is stored on the session document. There is no separate "noted at" timestamp. If the instructor adds notes 3 days after the session, the note still appears under the session's date.

4. **3-session history is fixed.** The prep view always shows the last 3 completed sessions. Not configurable. If the instructor wants to see more, they navigate to the client detail screen which shows a "View all" link to full history.

5. **No shared notes between instructors.** Notes are per-instructor, per-session. If multiple instructors teach the same client (not supported in v1 anyway), they cannot see each other's notes.

6. **Prep for non-client sessions.** If a private session's client has been deleted, the prep button should be hidden or show a graceful fallback ("Client record not available"). The session title still contains the original client name for reference.
```  
