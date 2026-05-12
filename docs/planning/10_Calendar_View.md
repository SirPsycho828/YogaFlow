▸ Extended thinking (810 chars)  
```markdown
## Overview

The Calendar view provides schedule overview beyond the single-day focus of the Today dashboard. It is the second tab in the bottom navigation and serves two needs: scanning the week or month to spot gaps or overloaded days, and navigating to any date to view or create sessions. The calendar is read-heavy -- most creation and editing happens through the session detail screens it links to.

## Dependencies

- `02_Database_Schema.md` -- `sessions` collection, queried by `instructorId` + date range
- `04_UI_Design_System.md` -- Color tokens for session type indicators, typography scale
- `05_Dashboard_Today_View.md` -- Day detail view reuses the same session card pattern
- `07_Private_Sessions.md` -- Private session creation from calendar context
- `08_Group_Classes.md` -- Group session creation from calendar context
- `09_Recurring_Sessions.md` -- Recurring sessions appear as individual instances; generation window affects visible range

## Screen Layout

Top to bottom:

1. **Header bar**: "Calendar" title (left), view toggle (right)
2. **Month/week navigator**: Month name with left/right arrows, or week range display
3. **Calendar grid**: Month or week grid with session indicators
4. **Day detail panel**: Session list for the selected date, below the grid

## View Modes

Two modes, toggled via a segmented control in the header:

### Month View (Default)

A standard month grid showing all days. Each day cell shows:

- Day number
- Session count dots: small colored dots indicating sessions exist on that day
  - Sage green dot: private sessions
  - Calm blue dot: group sessions
  - Show up to 3 dots. If more than 3 sessions, show "3+" as a tiny label instead of dots.
- Today's date highlighted with a primary-color circle behind the day number
- Selected date highlighted with a primary-color outline (ring)
- Days outside the current month shown in muted text

**Navigation**: Left/right arrows or swipe gesture to move between months.

**Tap behavior**: Tapping a day selects it and loads the day detail panel below the grid.

### Week View

A 7-day horizontal strip showing more detail per day than the month grid:

- Each day is a column showing the day name (Mon, Tue...) and date number
- Below the header, a vertical timeline from the first session's start time to the last session's end time
- Session blocks rendered as colored bars on the timeline:
  - Private sessions: sage green bar
  - Group sessions: calm blue bar
  - Cancelled sessions: gray bar, reduced opacity
- Bar height proportional to session duration
- Bar label: first name of client (private) or class name (group), truncated if needed

**Navigation**: Left/right arrows or swipe to move between weeks.

**Tap behavior**: Tapping a session bar navigates directly to the session detail screen. Tapping empty space on a day selects that day and loads the day detail panel.

## Day Detail Panel

When a date is selected (in either view mode), a panel slides up below the calendar grid showing all sessions for that day. This is essentially the same session timeline from the Today dashboard (see `05_Dashboard_Today_View.md`) but without the Today-specific elements (no "Now" divider, no date picker).

**Contents:**
- Date header: "Tuesday, January 15" (or "Today" if it's today, with a link "Go to Today view")
- Session cards: same card component as the Today view, ordered by start time
- Empty state: "No sessions" with an "Add Session" button
- FAB: same floating action button as the Today view for quick session creation, pre-filling the selected date

**Panel height**: On mobile, the panel takes the remaining screen height below the calendar grid. The grid compresses when the panel has content. On month view, the grid can collapse to show only the selected week row, giving more room to the session list.

## Data Loading Strategy

### Month View Query

```
sessions
  .where('instructorId', '==', uid)
  .where('date', '>=', firstDayOfMonth)
  .where('date', '<=', lastDayOfMonth)
```

Load all sessions for the visible month in a single query. Group by date client-side to populate the dot indicators. This is typically 20-80 documents for an active instructor -- well within Firestore read efficiency.

### Week View Query

Same pattern but scoped to the 7-day range:

```
sessions
  .where('instructorId', '==', uid)
  .where('date', '>=', firstDayOfWeek)
  .where('date', '<=', lastDayOfWeek)
```

### Prefetching

When the instructor navigates to a new month/week, immediately query that range. While loading, keep the previous view visible with a subtle loading indicator (thin progress bar at the top of the grid, not skeleton states -- the grid structure doesn't change, only the content).

Consider prefetching adjacent months/weeks in the background: when viewing January, silently load February. This makes navigation feel instant. Firestore's offline cache makes repeat visits free.

### Recurring Session Visibility

Recurring sessions are only visible if instances have been generated for the viewed date range. The rolling window is 4 weeks ahead (see `09_Recurring_Sessions.md`). If the instructor navigates beyond the generation window:

- Month view: days beyond `generatedUntil` show no dots even if a recurring pattern exists
- No inline warning for this -- the instructor sees an apparently empty future
- The `extendRecurringSeries` scheduled function runs daily and keeps the window topped up, so in practice the instructor rarely sees beyond the window unless they navigate far ahead

## Navigation and Interaction

### From Calendar to Other Screens

| Action | Destination |
|--------|-------------|
| Tap session card in day panel | Session detail (private or group attendance) |
| Tap session bar in week view | Session detail |
| Tap "Add Session" or FAB | Session creation form, date pre-filled |
| Tap "Today" link | Today dashboard |

### Quick Actions

No swipe actions or long-press menus on calendar elements. All interactions are single taps leading to dedicated screens. This keeps the calendar simple and prevents accidental modifications.

### Today Shortcut

A small "Today" pill button floats above the calendar grid (anchored top-right of the grid area) when the instructor has scrolled away from the current date. Tapping it snaps the view back to the current month/week and selects today. Hidden when today is already visible.

## Week Start Day

Weeks start on Monday. Not configurable in v1. The month grid and week view both use Monday as the first column.

## Visual Design Details

### Month Grid Cell Sizing

- Cells are square on mobile, adapting to screen width
- Minimum tap target: 44x44px per cell (at 375px screen width, 7 columns = ~53px per cell, which exceeds the minimum)
- Day number: `text-sm`, positioned top-left of cell
- Dots: centered below the day number, 6px diameter, 4px gap between dots

### Week View Timeline

- Hour markers on the left edge: `text-xs`, muted color, every hour
- Session bars: 8px border-radius, padding 4px, text inside in white (`text-xs`)
- Current time indicator: thin red horizontal line (only on today's column)

### Color Coding

| Session Type | Color Token | Hex |
|-------------|------------|-----|
| Private | `--primary` | `#5B7F6E` (sage green) |
| Group | `--status-scheduled` | `#6B8EC4` (calm blue) |
| Cancelled | `--muted-foreground` | `#8A847D` (gray) |

These match the session type colors used throughout the app (see `04_UI_Design_System.md`).

### Selected Date Highlight

- Today: solid circle in `--primary` behind the day number, white text
- Selected (not today): outline ring in `--primary`, default text color
- Today + selected: solid circle (today styling wins)

## Offline Behavior

The calendar view works offline using Firestore's cached data:

- Previously loaded months/weeks render instantly from cache
- Navigating to a never-viewed month while offline shows an empty grid (no sessions load)
- Sessions created offline appear on the calendar immediately (written to local cache)
- The subtle "Offline" indicator from the Today view (see `05_Dashboard_Today_View.md`) also appears on the calendar header

## Gaps & Assumptions

1. **No drag-to-create.** The instructor cannot drag across a time range in week view to create a session. All creation goes through the FAB and form flow. Drag interactions are difficult on mobile and not worth the complexity for v1.

2. **No drag-to-reschedule.** Sessions cannot be moved by dragging them to a new time or date on the calendar. Rescheduling requires editing the session. See `13_Cancellations_Rescheduling.md`.

3. **No color customization.** Session types have fixed colors. The instructor cannot assign custom colors to specific clients or classes. Deferred to `16_Future_Features.md`.

4. **No multi-month view.** There is no quarter or year overview. Month and week are the two zoom levels.

5. **Week view performance.** Rendering session bars with proportional heights requires layout calculation. For days with many overlapping sessions (e.g., back-to-back group classes), bars may become very thin. Cap the minimum bar height at 24px and allow vertical overflow with scroll if sessions stack beyond the visible area.

6. **No calendar sync.** No Google Calendar, Apple Calendar, or iCal export/import in v1. The YogaFlow calendar is self-contained. External calendar sync is deferred to `16_Future_Features.md`.
```  
