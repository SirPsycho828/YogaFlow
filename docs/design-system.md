# Design System — YogaFlow

> Single source of truth for all design decisions.

## Design Direction

**Direction:** Golden Hour — warm editorial luxury, the golden light of a late-afternoon yoga session
**Signature Element:** Warm terracotta-to-gold gradient accent bars on dividers, active nav, and primary buttons

---

## Typography

### Fonts
- **Heading:** Gilda Display (400)
- **Body:** Mulish (300–700, italic)

### Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Mulish:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

### Scale
| Level | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| h1 | Gilda Display | 2.5rem (40px) | 400 | 1.15 | -0.01em |
| h2 | Gilda Display | 1.875rem (30px) | 400 | 1.2 | 0 |
| h3 | Gilda Display | 1.375rem (22px) | 400 | 1.3 | 0 |
| h4 | Mulish | 1.125rem (18px) | 700 | 1.4 | 0 |
| body | Mulish | 1rem (16px) | 400 | 1.6 | 0 |
| body-sm | Mulish | 0.875rem (14px) | 400 | 1.5 | 0.01em |
| caption | Mulish | 0.75rem (12px) | 500 | 1.4 | 0.02em |
| button | Mulish | 0.875rem (14px) | 600 | 1 | 0.04em |

---

## Color Palette

### Core
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| --primary | #B8664E | 15 43% 51% | Brand identity, primary buttons |
| --primary-foreground | #FFFFFF | 0 0% 100% | Text on primary |
| --secondary | #F0E8DD | 30 30% 91% | Secondary buttons, subtle backgrounds |
| --secondary-foreground | #5C4535 | 20 25% 28% | Text on secondary |
| --accent | #D4A95A | 40 60% 59% | Highlights, links, focus rings |
| --accent-foreground | #362013 | 25 40% 14% | Text on accent |

### Surfaces
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| --background | #FBF7F2 | 35 53% 97% | Page background |
| --foreground | #2C1F17 | 23 33% 13% | Primary text |
| --card | #FFFDF9 | 40 100% 99% | Card/panel backgrounds |
| --card-foreground | #2C1F17 | 23 33% 13% | Text on cards |
| --popover | #FFFDF9 | 40 100% 99% | Popover backgrounds |
| --popover-foreground | #2C1F17 | 23 33% 13% | Text on popovers |
| --muted | #EDE8E2 | 30 20% 91% | Disabled, secondary elements |
| --muted-foreground | #8A7768 | 20 14% 47% | Secondary text, labels |

### Borders & Input
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| --border | #E3D9CC | 30 25% 87% | Dividers, card borders |
| --input | #DFD5C8 | 30 20% 83% | Form input borders |
| --ring | #B8664E | 15 43% 51% | Focus ring color |

### Semantic
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| --destructive | #C43D3D | 0 54% 50% | Error, delete, danger |
| --destructive-foreground | #FFFFFF | 0 0% 100% | Text on destructive |
| --success | #468C6C | 152 35% 41% | Success, complete, active |
| --warning | #D4A030 | 42 67% 51% | Caution, pending, attention |

### Status (App-Specific)
| Token | Hex | Usage |
|-------|-----|-------|
| --status-paid | #468C6C | Paid/completed sessions |
| --status-unpaid | #C43D3D | Unpaid sessions |
| --status-scheduled | #6B8DB5 | Scheduled sessions |
| --status-cancelled | #8A7768 | Cancelled sessions |
| --status-completed | #468C6C | Completed sessions |

---

## Spacing

Base unit: 4px (generous — luxury aesthetic uses ample whitespace)

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 0.25rem (4px) | Tight gaps |
| --space-2 | 0.5rem (8px) | Component internal padding |
| --space-3 | 0.75rem (12px) | Between related elements |
| --space-4 | 1rem (16px) | Standard gap |
| --space-6 | 1.5rem (24px) | Section padding |
| --space-8 | 2rem (32px) | Section margins |
| --space-12 | 3rem (48px) | Large section gaps |
| --space-16 | 4rem (64px) | Page section separation |
| --space-24 | 6rem (96px) | Hero/major section gaps |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Badges, chips |
| --radius-md | 8px | Buttons, inputs |
| --radius-lg | 12px | Cards, panels |
| --radius-xl | 16px | Modals, sheets |
| --radius-full | 9999px | Avatars, pills |

---

## Shadows

Warm-tinted shadows using espresso brown.

| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 3px rgba(44,31,23,0.06) | Cards at rest |
| --shadow-md | 0 4px 12px rgba(44,31,23,0.08) | Hover states |
| --shadow-lg | 0 8px 24px rgba(44,31,23,0.10) | Dropdowns, popovers |
| --shadow-xl | 0 16px 48px rgba(44,31,23,0.12) | FAB, modals |

---

## Animation

| Token | Value | Usage |
|-------|-------|-------|
| --duration-fast | 150ms | Hover, focus |
| --duration-normal | 250ms | State transitions |
| --duration-slow | 400ms | Sheet reveals, page transitions |
| --easing-default | cubic-bezier(0.4, 0, 0.2, 1) | General motion |
| --easing-spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy entrances |
| --easing-out | cubic-bezier(0, 0, 0.2, 1) | Exit animations |

**Signature Animation:** Warm gradient accent bars — horizontal dividers and highlights that transition from terracotta (#B8664E) to golden sand (#D4A95A). Applied to active bottom nav indicator, primary button backgrounds on hover, section dividers, and the "now" divider on the Today timeline. CSS: `linear-gradient(135deg, #B8664E, #D4A95A)`.

---

## CSS Custom Properties

```css
:root {
  /* Typography */
  --font-heading: 'Gilda Display', Georgia, serif;
  --font-body: 'Mulish', system-ui, sans-serif;

  /* Colors */
  --background: 35 53% 97%;
  --foreground: 23 33% 13%;
  --card: 40 100% 99%;
  --card-foreground: 23 33% 13%;
  --popover: 40 100% 99%;
  --popover-foreground: 23 33% 13%;
  --primary: 15 43% 51%;
  --primary-foreground: 0 0% 100%;
  --secondary: 30 30% 91%;
  --secondary-foreground: 20 25% 28%;
  --accent: 40 60% 59%;
  --accent-foreground: 25 40% 14%;
  --muted: 30 20% 91%;
  --muted-foreground: 20 14% 47%;
  --destructive: 0 54% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 30 25% 87%;
  --input: 30 20% 83%;
  --ring: 15 43% 51%;
  --radius: 0.75rem;

  /* Status */
  --status-paid: 152 35% 41%;
  --status-unpaid: 0 54% 50%;
  --status-scheduled: 210 30% 56%;
  --status-completed: 152 35% 41%;
  --status-cancelled: 20 14% 47%;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(44,31,23,0.06);
  --shadow-md: 0 4px 12px rgba(44,31,23,0.08);
  --shadow-lg: 0 8px 24px rgba(44,31,23,0.10);
  --shadow-xl: 0 16px 48px rgba(44,31,23,0.12);
}
```
