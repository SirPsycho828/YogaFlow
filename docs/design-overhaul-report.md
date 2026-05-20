# YogaFlow Design Overhaul Report

## Status

**Completed:** Golden Hour design overhaul (Phases 1-9) — shipped to production
**In Progress:** Second overhaul started — Phase 2 (direction choice) awaiting user decision

---

## Design Direction Chosen

**Golden Hour** — warm editorial luxury, evoking the golden light of a late-afternoon yoga session.

This direction was selected from three proposals in a prior session. It was chosen because:
- The warm terracotta + golden sand palette perfectly matches the yoga/wellness domain
- Serif + sans typography pairing (Gilda Display + Mulish) gives editorial sophistication without feeling clinical
- The warm-toned aesthetic differentiates YogaFlow from the cold blue/white SaaS defaults typical of scheduling tools
- It aligns with trends observed across top wellness apps (Calm, Headspace, Peloton) which all favor warm, earthy, or nature-inspired palettes

**Core philosophy:** A yoga instructor's tool should feel as intentional and calming as the practice itself. Warm tones, generous whitespace, serif elegance.

---

## What Was Implemented

### Design System (`docs/design-system.md`)

| Category | Details |
|----------|---------|
| **Typography** | Gilda Display (headings, 400 weight) + Mulish (body, 300-700 + italic). 8-level type scale from h1 (40px) to caption (12px). |
| **Colors** | Terracotta primary (#B8664E), Golden Sand accent (#D4A95A), Warm Linen background (#FBF7F2). Full semantic token set: 20+ CSS custom properties including status colors (paid, unpaid, scheduled, cancelled, completed). |
| **Spacing** | 4px base unit. 10-level scale from 4px to 96px. Generous — luxury aesthetic requires ample whitespace. |
| **Border Radius** | 5-level scale: sm (4px), md (8px), lg (12px), xl (16px), full (9999px). |
| **Shadows** | 4-level warm-tinted shadows using espresso brown `rgba(44,31,23,...)` instead of cold black. |
| **Animation** | 3 duration tokens (fast 150ms, normal 250ms, slow 400ms). 3 easing curves (default, spring, out). |
| **Gradient** | Signature `gradient-golden`: `linear-gradient(135deg, #B8664E, #D4A95A)` — used on active nav, buttons, dividers. |

### Pages Overhauled

| Page | Changes |
|------|---------|
| **Landing Page** (`/`) | Full marketing page: fixed nav with backdrop blur, hero with gradient text + Unsplash lifestyle image (yoga/Bali), bento grid feature cards with hover transitions, 3-step "How It Works" with gradient numbered circles, CTA section with gradient background + decorative circles, footer. Scroll-reveal animations via IntersectionObserver. |
| **Login** (`/login`) | Split-panel layout: left half is full-bleed Unsplash yoga studio image with warm overlay + brand text, right half has auth form with decorative gradient orbs, gradient signature bar, Google + email sign-in, gradient primary button. |
| **Sign Up** (`/signup`) | Same split-panel pattern as login with different Unsplash image (meditation overlooking trees). Confirm password field, same gradient/orb treatment. |
| **Reset Password** (`/reset-password`) | Centered form with decorative gradient orb background, gradient accent bar, success state with mail icon. |
| **Onboarding** (`/onboarding`) | Simple centered form using design system tokens (gradient bar, heading font, warm background). |
| **App Shell** | `AppLayout` with warm linen background, `max-w-lg` content width, bottom padding for nav. `BottomNav` with 5 tabs, active indicator = gradient-golden bar at top edge. `VerificationBanner` for unverified email accounts. |
| **Today** (`/today`) | Dashboard with date picker, session cards, "Now" divider, FAB for quick session creation. Uses design system tokens throughout. |
| **Calendar** (`/calendar`) | Month/week toggle views with session dot indicators, day detail panel. |
| **Clients** (`/clients`, `/new`, `/:id`, `/:id/edit`) | List with search + archive toggle, create/edit forms, detail view. Uses gradient primary buttons, warm card styling. |
| **Sessions** (`/sessions/new`, `/:id`, `/:id/edit`) | Session CRUD with notes/prep sheets. Gradient buttons, warm shadows. |
| **Classes** (`/classes`, `/new`, `/:id`) | Group class management, attendance tracking page. |
| **Settings** (`/settings`) | Profile card with initials avatar, notification toggle, sign out. Grouped card sections. |

### Assets Created

| Asset | Details |
|-------|---------|
| **SVG Favicon** | `public/favicon.svg` — terracotta-to-dark-terracotta gradient background (rounded rect), white serif "Y" letterform, golden gradient bar accent at bottom. |
| **PWA Icons** | `icons/icon-192.png`, `icon-512.png`, maskable variants, `apple-touch-icon-180.png` |
| **Unsplash Images** | 3 lifestyle images sourced: (1) Yoga instructor in warmly-lit studio for login, (2) Woman meditating overlooking trees for signup, (3) Yoga class in sunlit studio for landing features section, (4) Meditation with jungle canopy for landing hero |

### Animations & Transitions

| Animation | Implementation |
|-----------|---------------|
| **Scroll reveal** | `fadeInUp` keyframe animation triggered by IntersectionObserver (`.reveal` + `.visible` classes). 16px translateY with 400ms duration. |
| **Stagger children** | `.reveal-stagger` applies incremental 80ms delays to child `.reveal` elements (up to 6 children). |
| **Hero entrance** | `.hero-stagger` applies staggered entrance to hero content (100ms, 250ms, 400ms, 550ms, 650ms delays). |
| **Reduced motion** | Full `prefers-reduced-motion: reduce` support — all animations collapse to 0.01ms, transforms removed. |
| **Hover states** | Cards: `hover:shadow-md hover:border-primary/20`. Buttons: `hover:opacity-90 hover:shadow-lg`. Nav links: `transition-colors`. |
| **Smooth scrolling** | `scroll-behavior: smooth` on `html` element. |
| **Focus visible** | Custom `:focus-visible` ring using primary color with 2px offset. |
| **Toast overrides** | Sonner toast styled to match warm card aesthetic and body font. |

---

## Key Design Decisions

### Typography: Gilda Display + Mulish
Gilda Display was chosen over Playfair Display or Cormorant Garamond because its didone characteristics feel specifically spa/wellness-coded. Mulish was chosen for body because it's gentler than DM Sans or Outfit — important for an app that instructors interact with between sessions.

### Warm shadows over neutral black
All shadows use `rgba(44,31,23,...)` (espresso brown) instead of `rgba(0,0,0,...)`. This is a subtle but significant choice — warm shadows feel cohesive with the terracotta palette rather than creating cold contrast.

### Gradient as signature element
The terracotta-to-gold gradient is used sparingly and consistently: active nav indicator, primary buttons, section dividers, numbered step circles, CTA background. This creates a recognizable brand element without overuse.

### Split-panel auth (desktop) vs centered form (mobile)
Login/signup use a full-bleed Unsplash image on the left half at `lg:` breakpoints, hidden on mobile. Mobile shows centered form with decorative gradient orbs as a lightweight alternative. This avoids loading heavy images on mobile while maintaining premium feel.

### CSS-only animations (no Framer Motion)
Animations use pure CSS keyframes + IntersectionObserver rather than adding Framer Motion as a dependency. Trade-off: less sophisticated motion but zero bundle size impact and simpler maintenance.

### Favicon: "Y" letterform (monogram)
The favicon uses a "Y" on terracotta background — functional but noted as a compromise. The design-overhaul skill prefers iconic symbols over monograms. This is flagged for the next overhaul.

---

## Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Typography** | System fonts / shadcn defaults | Gilda Display (heading) + Mulish (body) — distinctive, wellness-coded |
| **Color palette** | Default shadcn neutral gray/white | Warm terracotta/gold/linen — unique brand identity |
| **Landing page** | None (direct to login) | Full marketing page: hero, features grid, how-it-works, CTA, footer |
| **Auth pages** | Basic centered forms | Split-panel layouts with lifestyle photography + decorative elements |
| **Navigation** | Default tab styling | Bottom nav with gradient-golden active indicator bar |
| **Shadows** | Default CSS shadows | Warm espresso-tinted shadow scale |
| **Animations** | None | Scroll reveals, staggered entrances, hover transitions, reduced-motion support |
| **Favicon** | Generic or missing | Custom SVG with brand colors |
| **PWA icons** | Placeholder or missing | Real branded icons at 192/512px + maskable |
| **Overall feel** | Generic scheduling tool | Boutique yoga studio management app |

---

## Full Design Audit (2026-05-20)

Benchmarked against: Calm, Headspace, Peloton, ClassPass, Time2book, Strava, lululemon.
Sources: Mobbin competitor research, 21st.dev component patterns, Context7 framework docs.

**Overall Score: 6.5/10** — Strong foundation, needs elevation to premium tier.

### Priority Gap Matrix

#### P0 — Critical (Blocks premium feel)

| # | Area | Gap | Reference |
|---|------|-----|-----------|
| 1 | **Today Page** | No greeting hero card ("Good morning, Sarah") + daily summary stats | Peloton, Apple Fitness+ |
| 2 | **Today Page** | No horizontal date scroller — uses modal popover calendar | ClassPass, Calm |
| 3 | **Session Cards** | Missing duration badge ("60 min") and level/intensity indicator | Peloton dot-difficulty |
| 4 | **Settings Page** | Flat list, no icon-led grouped sections (Account, Notifications, App) | Apple Health, Strava |
| 5 | **App Shell** | No page transition animations — routes swap instantly (website feel) | All native apps |
| 6 | **App Shell** | No sticky header with page title — no context about current page | Peloton, ClassPass |
| 7 | **Landing Page** | Zero social proof — no testimonials, user count, or trust badges | Calm, Headspace |

#### P1 — High (Noticeably missing)

| # | Area | Gap | Reference |
|---|------|-----|-----------|
| 8 | **Auth Pages** | Google sign-in button not visually dominant vs email form | Notion, Stripe |
| 9 | **Onboarding** | Step indicator shows 2 dots but only 1 screen — misleading | Headspace multi-step |
| 10 | **App Shell** | No skeleton/loading screens for async data pages | All modern apps |
| 11 | **Bottom Nav** | Icons too small (20px vs 24px standard), labels at 11px (below HIG) | iOS HIG |
| 12 | **Landing Page** | Bare footer — no legal links, social icons, newsletter signup | Any SaaS |
| 13 | **InitialsAvatar** | All avatars identical gradient — no color variation | Slack, Notion |
| 14 | **Cards** | Inconsistent styling — ClassCard (p-5), SessionCard (p-4), different borders | Internal |
| 15 | **Landing Page** | No FAQ, pricing, or objection-handling sections | SaaS standard |

#### P2 — Medium (Polish items)

| # | Area | Gap | Reference |
|---|------|-----|-----------|
| 16 | **Auth Pages** | No password strength indicator on signup | Stripe, Apple |
| 17 | **Auth Pages** | No real-time field validation (only on submit) | Modern forms |
| 18 | **FAB** | Solid primary color instead of signature gradient | Design system |
| 19 | **EmptyState** | Icon too small (24px in 56px circle), inconsistent usage across pages | — |
| 20 | **NowDivider** | Plain primary border instead of signature gradient line | Design system |
| 21 | **App Shell** | Top safe area not handled for notched phones | PWA best practice |
| 22 | **Auth Pages** | No page entrance animations — forms appear instantly | Premium UX |
| 23 | **Client Detail** | Session history section is placeholder — takes space but unusable | — |
| 24 | **Settings** | Sign Out as standalone button instead of grouped in "Account" section | iOS pattern |

#### P3 — Low (Nice to have)

| # | Area | Gap | Reference |
|---|------|-----|-----------|
| 25 | **Landing Page** | Feature icons generic Lucide defaults, not branded | — |
| 26 | **App Shell** | No pull-to-refresh gesture on list pages | Native apps |
| 27 | **Auth Pages** | Missing `role="alert"` on errors, no explicit focus rings | WCAG AAA |
| 28 | **Landing Page** | No hero image on mobile (hidden below lg breakpoint) | — |
| 29 | **CSS** | Stagger animations hardcoded to max 6 items (fragile) | — |
| 30 | **CSS** | No dark mode support defined | Tailwind v4 |
| 31 | **App Shell** | No back button/breadcrumbs on detail pages | Native nav |

### Area Scores

| Area | Score | Strengths | Top Gap |
|------|-------|-----------|---------|
| **Design System/CSS** | 8/10 | Complete token system, warm shadows, gradient utilities | No dark mode, hardcoded stagger limits |
| **Auth Pages** | 7.5/10 | Split-panel layout, lifestyle photos, "or" divider | Google button not dominant, no field validation |
| **Landing Page** | 6/10 | Clean layout, gradient text, benefit copy | No social proof, bare footer |
| **Session Cards** | 6/10 | Gradient divider, tabular time, status badges | No duration/level badges |
| **App Shell** | 5.5/10 | Gradient nav indicator, safe areas (bottom) | No transitions, no headers, small nav icons |
| **Today Page** | 5/10 | NowDivider, FAB dropdown, empty states | No greeting hero, no date scroller |
| **Onboarding** | 5/10 | Conversational tone, gradient badge | Misleading step indicator, no error UI |
| **Settings** | 4/10 | Profile card, notification toggle | Flat layout, no icons, no grouping |

### Component Consistency Issues

| Component | Issue |
|-----------|-------|
| Card padding | SessionCard p-4, ClassCard p-5, DetailPages p-5 |
| Avatar sizing | Default h-10, detail pages h-14 — no size prop |
| Badge styling | StatusBadge, PaymentBadge, ClientRow all repeat className |
| Empty states | TodayPage custom UI, other pages use EmptyState component |
| Section headings | text-sm in some pages, text-base in others |

### Recommended Overhaul Order

1. **Today Page hero redesign** — greeting + horizontal date scroller + summary stats
2. **App shell upgrade** — page transitions, sticky headers, skeleton screens, nav polish
3. **Session card enrichment** — duration badges, level indicators, styled metadata
4. **Settings restructure** — icon-led grouped sections
5. **Landing page trust** — testimonials, FAQ, pricing, proper footer
6. **Auth polish** — social button prominence, field validation, animations
7. **Onboarding expansion** — multi-step flow OR remove misleading step indicator
8. **Component standardization** — consistent cards, avatars, badges, empty states

---

*Audit completed: 2026-05-20*
*Branch: `design-overhaul`*
*Deployed production: https://yogaflow-app.web.app (Golden Hour design)*
