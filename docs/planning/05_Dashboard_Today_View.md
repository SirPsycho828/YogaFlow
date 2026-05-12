▸ Extended thinking (997 chars)  
```markdown
## Overview

The Today dashboard is the home screen of YogaFlow -- the first thing an instructor sees when they open the app. It shows a timeline of the day's sessions as tappable cards, with a date picker to peek at other days. This is where the instructor's morning prep starts and where post-session notes are captured throughout the day.

The view optimizes for two workflows: a morning scan ("what's my day look like?") and between-session quick actions ("add notes to the session I just finished").

## Dependencies

- `02_Database_Schema.md` -- Sessions collection, queried by `instructorId` + `date`
- `04_UI_Design_System.md` -- Session card pattern, empty state pattern, bottom navigation
- `07_Private_Sessions.md` -- Private session creation flow (FAB action)
- `08_Group_Classes.md` -- Group session display and attendance
- `12_Session_Notes_Prep.md` -- "Add Notes" button behavior and session prep view
- `14_Offline_PWA.md` -- Dashboard must render from Firestore cache when offline

## Screen Layout

Top to bottom:

1. **Header bar**: "Today" title (left-aligned, page title style), date picker toggle (right-aligned)
2. **Date context**: Current date displayed as "Monday, January 15" below the header. When viewing a different date, show "Today" as a quick-return link.
3. **Session timeline**: Vertical list of session cards, ordered by start time
4. **FAB (Floating Action Button)**: Bottom-right, above the nav bar, for creating a new session

## Date Picker

- **Trigger**: Calendar icon button in the header bar
- **Component**: shadcn/ui `Calendar` (date picker) in a `Popover` on desktop or `Sheet` (bottom drawer) on mobile
- **Behavior**: Selecting a date loads that day's sessions into the timeline. The header subtitle updates to show the selected date.
- **Quick return**: When viewing a non-today date, a small "Back to Today" chip appears below the date subtitle. Tap to snap back.
- **No week/month view here**: This is a single-day viewer with peek capability. Full calendar views live in `10_Calendar_View.md`.

## Session Timeline

### Query

```
sessions
  .where('instructorId', '==', uid)
  .where('date', '==', selectedDateTimestamp)
  .orderBy('startTime', 'asc')
```

Returns all sessions (private and group, all statuses) for the selected date, sorted chronologically.

### Session Cards

Each session renders as a card following the pattern in `04_UI_Design_System.md`. Additional detail for the Today context:

**Card content:**

| Element | Source | Position |
|---------|--------|----------|
| Start time | `startTime` | Left column, prominent |
| End time | `endTime` | Left column, below start time, muted |
| Title | `title` (client name or class name) | Right column, top |
| Type indicator | `type` | Small label: "Private" or "Group (N)" where N is enrolled count |
| Location | `location` | Right column, caption text, only if set |
| Status badge | `status` | Right column, bottom-right |

**Card states by session status:**

| Status | Visual Treatment | Actions Available |
|--------|-----------------|-------------------|
| `scheduled` (future) | Default card style. Status badge: blue "Upcoming". | Tap to view/edit. "Prep" button visible. |
| `scheduled` (time has passed) | Default card style. Status badge: blue "Upcoming". | Same as above -- the instructor manually marks complete. |
| `completed` | Slightly muted card (`opacity-90`). Status badge: green "Done". | "Add Notes" button if `notes` is empty. Tap to view. |
| `cancelled` | Muted card (`opacity-60`). Status badge: gray "Cancelled". Strikethrough on title. | Tap to view. No actions. |

### "Prep" Button

Visible on all `scheduled` sessions. Positioned as a small secondary button on the card.

- Tap opens the session prep view (see `12_Session_Notes_Prep.md`)
- Prep view shows: client health notes, last 3 session notes for this client, payment status
- For group classes, prep shows the roster with health notes summary

### "Add Notes" Button

Visible on `completed` sessions where `notes` is empty. Uses primary color to draw attention.

- Tap opens a `Sheet` (bottom drawer) with a single text area and a "Save" button
- Auto-focuses the text area so the instructor can start typing immediately
- Save writes to `sessions/{sessionId}.notes` and dismisses the sheet
- After saving, the button is replaced with a truncated preview of the notes on the card
- This must be fast -- the instructor has under 2 minutes. No extra taps, no categories, no tags. Just text and save.

If notes already exist, the card shows a truncated preview (first ~60 characters) instead of the button. Tapping the preview opens the same sheet for editing.

### Timeline Dividers

Insert a visual divider between past and upcoming sessions:

- If the current time falls between two sessions, show a thin horizontal line with "Now" label at the current time position
- This helps the instructor instantly see what's done and what's next
- Only shown when viewing today, not when peeking at other dates

## Floating Action Button (FAB)

Position: bottom-right corner, 16px from edge, sitting above the bottom navigation bar.

- Primary color, circular, "+" icon
- Tap opens a small menu (shadcn/ui `DropdownMenu` anchored to the FAB):
  - "Private Session" -- navigates to private session creation (see `07_Private_Sessions.md`)
  - "Group Class" -- navigates to group class session creation (see `08_Group_Classes.md`)
- The new session is pre-filled with today's date (or the currently viewed date if peeking)

## Empty State

When the selected date has no sessions:

- Centered layout with a Lucide `CalendarOff` icon (48px, muted color)
- **Today with no sessions**: Heading "No sessions today". Description "Enjoy your day off, or add a session." CTA button "Add Session" (triggers the FAB menu).
- **Future date with no sessions**: Heading "Nothing scheduled". Description "Tap + to add a session for this day."
- **Past date with no sessions**: Heading "No sessions on this day". No CTA.

## Data Loading

### Initial Load

1. Auth state resolves (see `01_Auth.md`)
2. If `onboardingComplete` is false, redirect to onboarding
3. Query today's sessions
4. While loading, show 3 skeleton session cards
5. Render the timeline

### Date Change

When the instructor picks a new date:
- Show skeleton cards immediately (don't keep stale data from the previous date visible)
- Load the new date's sessions
- Render

### Offline Behavior

The Today view is the most critical screen for offline support. Firestore's offline persistence (see `14_Offline_PWA.md`) means:

- Previously viewed dates load instantly from cache
- Today's sessions are available if the app was opened recently while online
- New sessions created offline are written to the local cache and synced when connectivity returns
- Show a subtle "Offline" indicator in the header bar when the device has no connection. Use a small `WifiOff` icon next to the date, muted color. Non-intrusive but visible.

### Pull to Refresh

Standard pull-to-refresh gesture on the session list to force a server fetch. Only meaningful when online. When offline, the pull-to-refresh should complete immediately with no error -- don't show "failed to refresh" messages that would erode trust.

## Session Count Summary

Below the date subtitle, show a one-line summary of the day:

- "3 sessions -- 1 private, 2 group" (when sessions exist)
- Omit types with zero count: "2 sessions -- 2 private" (no group that day)
- Muted text, `text-xs`

## Navigation from Dashboard

| Action | Destination |
|--------|-------------|
| Tap session card | Session detail view (full session info, edit, cancel) |
| Tap "Prep" button | Session prep sheet (see `12_Session_Notes_Prep.md`) |
| Tap "Add Notes" button | Notes entry sheet (bottom drawer) |
| Tap FAB > Private Session | Private session creation form |
| Tap FAB > Group Class | Group class session creation form |
| Tap date picker | Date selection popover/sheet |
| Bottom nav | Other app sections |

## Gaps & Assumptions

1. **No multi-day overview.** The Today view shows exactly one day at a time. There's no "next 3 days" or agenda-style multi-day list. The date picker peek and the calendar view (`10_Calendar_View.md`) cover this need.

2. **No session reordering.** Sessions are always sorted by `startTime`. There's no drag-to-reorder or manual priority ordering.

3. **"Now" divider precision.** The current time marker is static -- it renders at the time the screen loads or refreshes. It does not animate in real time. A minute-level update would require a timer that's not worth the complexity for v1.

4. **Notification integration.** Push notifications that fire 5 minutes after a session's end time (see `15_Notifications.md`) deep-link to the notes entry sheet for that session. The Today dashboard must handle this incoming navigation by scrolling to the relevant card and opening the sheet.

5. **No drag-to-cancel or swipe actions.** All actions require explicit taps. Swipe gestures on cards are avoided for v1 to prevent accidental cancellations.

6. **Date picker range.** The date picker is not bounded. The instructor can peek at any past or future date. Practical limit: recurring sessions only generate 4 weeks ahead (see `09_Recurring_Sessions.md`), so dates beyond that range may appear empty even if recurring sessions will eventually exist there.
```  
