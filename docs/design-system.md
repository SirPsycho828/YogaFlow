# Design System — YogaFlow

> Single source of truth for all design decisions.

## Design Direction

**Direction:** Studio Luxe — dark warmth meets athletic premium
**Signature Element:** Frosted glassmorphic cards with warm blur-through

---

## Typography

### Fonts
- **Heading:** Cormorant Garamond (400, 500, 600, 700, italic 400)
- **Body:** Outfit (300, 400, 500, 600, 700)

### Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Scale
| Level | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| h1 | Heading | 3rem (48px) | 600 | 1.1 | -0.02em |
| h2 | Heading | 2.25rem (36px) | 600 | 1.2 | -0.01em |
| h3 | Heading | 1.5rem (24px) | 600 | 1.3 | 0 |
| h4 | Heading | 1.25rem (20px) | 600 | 1.4 | 0 |
| body | Body | 1rem (16px) | 400 | 1.6 | 0 |
| body-sm | Body | 0.875rem (14px) | 400 | 1.5 | 0 |
| caption | Body | 0.75rem (12px) | 500 | 1.4 | 0.02em |
| button | Body | 0.875rem (14px) | 600 | 1 | 0.03em |

---

## Color Palette

### Core
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| --primary | 24 33% 18% | #3D2B1F | Brand identity, primary buttons, headers |
| --primary-foreground | 30 33% 94% | #F5F0EB | Text on primary |
| --secondary | 25 18% 88% | #E8E0D8 | Secondary buttons, subtle backgrounds |
| --secondary-foreground | 20 25% 25% | #4D3A2E | Text on secondary |
| --accent | 29 42% 59% | #C4956A | Brass highlights, links, focus rings |
| --accent-foreground | 20 40% 10% | #241710 | Text on accent |

### Surfaces
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| --background | 30 33% 94% | #F5F0EB | Page background (warm stone) |
| --foreground | 12 24% 8% | #1A1210 | Primary text (espresso) |
| --card | 0 0% 100% | #FFFFFF | Card/panel backgrounds |
| --card-foreground | 12 24% 8% | #1A1210 | Text on cards |
| --muted | 25 15% 89% | #E6DFD8 | Disabled, secondary elements |
| --muted-foreground | 20 10% 45% | #7A6E63 | Secondary text, labels |

### Borders & Input
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| --border | 25 18% 84% | #D8CFC5 | Dividers, card borders |
| --input | 25 15% 80% | #D0C5B9 | Form input borders |
| --ring | 29 42% 59% | #C4956A | Focus ring (brass) |

### Semantic
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| --destructive | 4 62% 46% | #C0392B | Error, delete, danger |
| --destructive-foreground | 0 0% 100% | #FFFFFF | Text on destructive |
| --success | 152 25% 38% | #4F7B6B | Success, complete, paid |
| --warning | 40 62% 55% | #D4A04A | Caution, pending |

### Status
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| --status-paid | 152 25% 38% | #4F7B6B | Paid sessions |
| --status-unpaid | 4 62% 46% | #C0392B | Unpaid sessions |
| --status-cancelled | 20 10% 45% | #7A6E63 | Cancelled |
| --status-scheduled | 210 25% 50% | #5F7FA3 | Scheduled |
| --status-completed | 152 25% 38% | #4F7B6B | Completed |

---

## Spacing

Base unit: 4px (standard Tailwind scale)

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Small elements (badges, chips) |
| --radius-md | 8px | Buttons, inputs |
| --radius-lg | 12px | Cards, panels |
| --radius-xl | 16px | Modals, large containers |
| --radius-full | 9999px | Pills, avatars |

---

## Shadows

Warm walnut-tinted shadows.

| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 3px rgba(61, 43, 31, 0.06) | Cards at rest |
| --shadow-md | 0 4px 12px rgba(61, 43, 31, 0.08) | Hover states |
| --shadow-lg | 0 8px 24px rgba(61, 43, 31, 0.10) | Dropdowns, modals |
| --shadow-xl | 0 16px 48px rgba(61, 43, 31, 0.14) | Floating FAB |

---

## Animation

| Token | Value | Usage |
|-------|-------|-------|
| --duration-fast | 150ms | Micro-interactions (hover, focus) |
| --duration-normal | 250ms | State transitions |
| --duration-slow | 400ms | Page transitions, reveals |
| --easing-default | cubic-bezier(0.4, 0, 0.2, 1) | General motion |
| --easing-spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy entrances |
| --easing-out | cubic-bezier(0, 0, 0.2, 1) | Exit animations |

**Signature Animation:** Frosted glassmorphic cards — `backdrop-filter: blur(12px)` with warm-tinted `rgba(245, 240, 235, 0.7)` backgrounds. Cards appear to float with soft warm shadow beneath, rising slightly on hover with a smooth 250ms transition.

---

## CSS Custom Properties

```css
:root {
  /* Typography */
  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Outfit', system-ui, sans-serif;

  /* Colors */
  --background: 30 33% 94%;
  --foreground: 12 24% 8%;
  --card: 0 0% 100%;
  --card-foreground: 12 24% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 12 24% 8%;
  --primary: 24 33% 18%;
  --primary-foreground: 30 33% 94%;
  --secondary: 25 18% 88%;
  --secondary-foreground: 20 25% 25%;
  --accent: 29 42% 59%;
  --accent-foreground: 20 40% 10%;
  --muted: 25 15% 89%;
  --muted-foreground: 20 10% 45%;
  --destructive: 4 62% 46%;
  --destructive-foreground: 0 0% 100%;
  --border: 25 18% 84%;
  --input: 25 15% 80%;
  --ring: 29 42% 59%;
  --radius: 0.75rem;

  /* Status */
  --status-paid: 152 25% 38%;
  --status-unpaid: 4 62% 46%;
  --status-cancelled: 20 10% 45%;
  --status-scheduled: 210 25% 50%;
  --status-completed: 152 25% 38%;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(61, 43, 31, 0.06);
  --shadow-md: 0 4px 12px rgba(61, 43, 31, 0.08);
  --shadow-lg: 0 8px 24px rgba(61, 43, 31, 0.10);
  --shadow-xl: 0 16px 48px rgba(61, 43, 31, 0.14);

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

## Glassmorphic Card Utility

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(216, 207, 197, 0.5);
  box-shadow: 0 4px 12px rgba(61, 43, 31, 0.08);
  transition: transform var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(61, 43, 31, 0.10);
}
```

## Gradient Utility

```css
.gradient-studio {
  background: linear-gradient(135deg, hsl(24, 33%, 18%), hsl(29, 42%, 59%));
}

.gradient-studio-text {
  background: linear-gradient(135deg, hsl(24, 33%, 18%), hsl(29, 42%, 59%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```
