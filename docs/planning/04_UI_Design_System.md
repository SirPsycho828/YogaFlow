▸ Extended thinking (1281 chars)  
```markdown
## Overview

YogaFlow's design system is warm, calm, and mobile-first. It uses shadcn/ui components customized with a yoga-appropriate color palette, Inter typeface, and gently rounded shapes. Every feature file references this document for visual consistency.

The design targets instructors using the app one-handed between sessions, often outdoors or in dimly lit studios. Readability, touch target size, and speed of interaction take priority over visual density.

## Dependencies

- `00_README.md` -- Tech stack confirms Tailwind CSS 4 + shadcn/ui
- `14_Offline_PWA.md` -- PWA manifest references theme colors defined here

## Colors

Built on shadcn/ui's CSS variable system. Override the default shadcn theme with these values in `globals.css`.

### Light Mode (Primary)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAFAF7` | Page background -- warm off-white, not stark |
| `--foreground` | `#2D2A26` | Primary text -- dark warm brown, not pure black |
| `--card` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `#2D2A26` | Card text |
| `--primary` | `#5B7F6E` | Primary actions -- muted sage green |
| `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `--secondary` | `#F0EDE8` | Secondary surfaces -- warm light gray |
| `--secondary-foreground` | `#5B5651` | Secondary text |
| `--muted` | `#F0EDE8` | Muted backgrounds, disabled states |
| `--muted-foreground` | `#8A847D` | Placeholder text, subtle labels |
| `--accent` | `#E8D5C0` | Accent highlights -- warm sand |
| `--accent-foreground` | `#5B5651` | Text on accent |
| `--destructive` | `#C4554D` | Cancel, delete -- warm red, not aggressive |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |
| `--border` | `#E5E0DA` | Borders, dividers -- warm gray |
| `--ring` | `#5B7F6E` | Focus ring -- matches primary |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--status-paid` | `#5B7F6E` | Paid indicator -- reuses primary green |
| `--status-unpaid` | `#C4554D` | Unpaid indicator -- reuses destructive |
| `--status-cancelled` | `#8A847D` | Cancelled sessions -- muted |
| `--status-scheduled` | `#6B8EC4` | Upcoming sessions -- calm blue |
| `--status-completed` | `#5B7F6E` | Completed sessions -- green |

### Dark Mode

Defer dark mode to post-MVP. The color palette above is designed to be easy on the eyes in low-light studio environments without a separate dark theme. See `16_Future_Features.md`.

## Typography

**Font family**: Inter, loaded via Google Fonts. Single font for everything -- no secondary typeface.

**Tailwind config**:
```
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif']
}
```

### Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Page title | text-xl (20px) | semibold (600) | Screen headers: "Today", "Clients" |
| Section header | text-lg (18px) | medium (500) | Card group labels, section dividers |
| Card title | text-base (16px) | medium (500) | Client name, class name on cards |
| Body | text-sm (14px) | normal (400) | General text, form labels, notes |
| Caption | text-xs (12px) | normal (400) | Timestamps, secondary metadata |

Keep the scale tight. Mobile screens don't have room for dramatic size contrasts. The difference between levels is subtle and intentional.

## Spacing & Layout

**Base unit**: 4px (Tailwind default). Use multiples: 8, 12, 16, 24, 32.

**Page padding**: `px-4` (16px) on mobile. No wider than `max-w-lg` (512px) centered on larger screens. The app is designed for phone-width viewports -- don't stretch to fill a desktop monitor.

**Card padding**: `p-4` (16px) internal padding.

**Stack gap**: `space-y-3` (12px) between cards in a list. `space-y-2` (8px) between elements inside a card.

**Touch targets**: Minimum 44x44px for all interactive elements. This is non-negotiable -- instructors tap with thumbs while holding a phone in one hand.

## Shape & Elevation

**Border radius**: `rounded-lg` (8px) on cards, buttons, inputs. Gently rounded -- warm but structured. Do not use pill shapes (`rounded-full`) except for avatars and small status badges.

**Shadows**: Subtle only. Cards use `shadow-sm` -- barely visible, just enough to lift the card off the warm background. No medium or large shadows anywhere in the app. The visual hierarchy comes from color contrast and spacing, not depth.

**Borders**: Cards use a `1px` border in `--border` color in addition to the subtle shadow. This ensures separation is visible even on screens with poor contrast.

## Component Patterns

All components are shadcn/ui primitives, customized with the theme above. Only non-obvious customizations are documented here.

### Session Card

The primary UI element -- appears on the Today dashboard, calendar, and client history.

- **Layout**: Horizontal card with time on the left, details on the right
- **Left column**: Start time in `text-lg semibold`, end time in `text-xs muted` below it
- **Right column**: Title (client/class name), location (if set) in caption text, status badge
- **Status badge**: Small pill with background color matching the semantic status colors. Text is the status color darkened for contrast.
- **Tap target**: Entire card is tappable, navigates to session detail
- **Completed state**: After session time passes, show an "Add Notes" button (primary color, small) anchored to the bottom-right of the card. See `12_Session_Notes_Prep.md`.

### Client Card

Used in the client list.

- **Layout**: Single row with name, a secondary line for phone/email (if set), and an unpaid badge if `unpaidCount > 0`
- **No photos in v1**: Client photos are deferred. Use a circle with the client's initials in `--secondary` background as the avatar placeholder.
- **Unpaid badge**: Small destructive-colored badge showing the count, e.g., "3 unpaid"

### Empty States

Every list view (clients, sessions, classes) has a designed empty state. Not a blank page.

- Centered layout with a simple line illustration or icon (use Lucide icons from shadcn/ui)
- Short heading: e.g., "No clients yet"
- One-line description: e.g., "Add your first client to get started"
- Primary CTA button: e.g., "Add Client"

See `05_Dashboard_Today_View.md` for the Today-specific empty state.

### Bottom Navigation

Mobile-first navigation bar fixed to the bottom of the viewport.

| Tab | Icon | Destination |
|-----|------|-------------|
| Today | CalendarCheck | Today dashboard |
| Calendar | Calendar | Full calendar view |
| Clients | Users | Client list |
| Classes | UsersRound | Group classes list |
| Settings | Settings | Profile, sign-out, preferences |

- Active tab uses `--primary` color. Inactive tabs use `--muted-foreground`.
- Icon + label (text-xs) stacked vertically.
- Fixed height: 64px including safe area padding for notched phones.

### Forms

- Labels above inputs, not floating or inline
- Input height: 44px minimum (touch target)
- Single-column layout on mobile -- never side-by-side inputs
- Validation errors appear below the input in `--destructive` color, text-xs
- Submit button full-width at bottom of form, primary style
- Use shadcn/ui `Sheet` (bottom drawer) for quick-entry forms like session notes, rather than navigating to a new page

### Action Confirmations

Destructive actions (delete client, cancel session) use shadcn/ui `AlertDialog`:
- Title states the action clearly: "Delete [Client Name]?"
- Description states the consequence: "This will permanently remove all sessions, notes, and payment history."
- Cancel button (secondary) on the left, destructive button on the right
- Destructive button uses `--destructive` color

## Loading States

- **Initial app load**: Full-screen centered spinner with the app name below. Uses `--primary` color. Shown while auth state resolves. See `01_Auth.md`.
- **List loading**: Skeleton cards matching the card layout. 3 skeleton cards is sufficient.
- **Button loading**: Replace button text with a small spinner. Keep button width stable (don't shrink).
- **Optimistic updates**: For fast operations (toggle payment status, mark attendance), update the UI immediately and reconcile on write confirmation. Show a brief toast on failure.

## Toasts

Use shadcn/ui `Sonner` for toast notifications.

- Position: bottom-center, above the navigation bar
- Duration: 3 seconds for success, 5 seconds for errors
- Success toasts: minimal -- "Client saved", "Session cancelled"
- Error toasts: include a brief reason -- "Could not save. Check your connection."
- No toasts for routine actions (navigating, opening forms). Only for state changes.

## PWA Theming

These values feed into the PWA manifest and meta tags. See `14_Offline_PWA.md` for full manifest.

| Property | Value |
|----------|-------|
| `theme_color` | `#5B7F6E` (primary sage) |
| `background_color` | `#FAFAF7` (page background) |
| App icon background | `#5B7F6E` |
| App icon foreground | White logomark |

## Gaps & Assumptions

1. **No logo or brand mark designed.** The PRD does not include a logo. For v1, use the app name "YogaFlow" in Inter semibold as a text logo. A proper logomark is needed before any public launch.

2. **No illustration style defined.** Empty states reference "simple line illustrations" but no illustration library is specified. Use Lucide icons at 48px as placeholders. Custom illustrations are a post-MVP polish item.

3. **No animation specifications.** Page transitions, card interactions, and microanimations are not defined. For v1, use Tailwind's `transition-colors duration-150` on interactive elements and no page transitions. Keep it snappy over flashy.

4. **Exact color values are suggested defaults.** The PRD specified "warm" and "calming" but no exact hex values. The palette above is a starting point. Adjust after seeing it applied to real screens.

5. **No landscape or tablet layout.** The layout assumes portrait phone viewport. On tablets or landscape, the max-width constraint keeps it centered but no responsive columns or sidebar navigation are planned for v1.
```  
