# Design Overhaul State

## Current Phase: 4 (Foundation)
## Completed: [1, 2, 3]

## Project
- **Name:** YogaFlow
- **Domain:** Health/wellness — yoga practice management
- **Target Users:** Solo yoga instructors
- **Framework:** React 19 + React Router DOM v7
- **CSS:** Tailwind CSS v4
- **Component Library:** shadcn/ui (Radix UI)
- **Build Tool:** Vite 6
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Package Manager:** pnpm
- **PWA:** Yes (vite-plugin-pwa)

## Page Inventory
| Page | Route | File | Status |
|------|-------|------|--------|
| Landing | / | LandingPage.tsx | pending |
| Login | /login | LoginPage.tsx | pending |
| Signup | /signup | SignUpPage.tsx | pending |
| Reset Password | /reset-password | ResetPasswordPage.tsx | pending |
| Onboarding | /onboarding | OnboardingPage.tsx | pending |
| Today | /today | TodayPage.tsx | pending |
| Calendar | /calendar | CalendarPage.tsx | pending |
| Clients | /clients | ClientsPage.tsx | pending |
| Client Create | /clients/new | ClientCreatePage.tsx | pending |
| Client Detail | /clients/:id | ClientDetailPage.tsx | pending |
| Client Edit | /clients/:id/edit | ClientEditPage.tsx | pending |
| Session Create | /sessions/new | SessionCreatePage.tsx | pending |
| Session Detail | /sessions/:id | SessionDetailPage.tsx | pending |
| Session Edit | /sessions/:id/edit | SessionEditPage.tsx | pending |
| Classes | /classes | ClassesPage.tsx | pending |
| Class Create | /classes/new | ClassCreatePage.tsx | pending |
| Class Detail | /classes/:id | ClassDetailPage.tsx | pending |
| Group Session | /sessions/:id/attendance | GroupSessionPage.tsx | pending |
| Settings | /settings | SettingsPage.tsx | pending |

## Audit Findings
- Favicon: letter "Y" monogram — needs iconic shape/symbol
- Signup page: overflow scrollbar CSS bug
- Fonts: Gilda Display + Mulish (good, keeping)
- Colors: Golden Hour palette (terracotta + golden sand + warm linen)
- Animations: Framer Motion + CSS keyframes present
- No dark mode

## Mobbin Research
- **Competitors identified:** Headspace, Calm, Open (mindfulness), lululemon, Equinox+, Centr
- **Headspace:** Playful illustrations, warm orange tones, rounded shapes, card-based navigation
- **Calm:** Nature photography, deep navy/teal palette, serif typography, immersive full-bleed imagery
- **Open:** Clean minimal, generous whitespace, modern sans-serif, studio-quality photography
- **Equinox+:** Premium luxury, dark backgrounds, high-contrast editorial, photography-forward
- **Key insight:** YogaFlow is a B2B tool for instructors, not a consumer meditation app — needs warmth (yoga domain) balanced with professionalism (business tool)
- **Dominant patterns:** Card-based layouts for sessions/clients, bottom tab navigation, calendar/scheduling central, mobile-first

## 21st.dev Research
- **MinimalistHero:** Clean centered layout with Framer Motion staggered reveals — good landing page pattern
- **PulseFit Hero:** Fitness-themed with program card carousel + social proof avatars — relevant for landing
- **Modern Mobile Menu:** Animated bottom tab with line-width tracking — upgrade for current BottomNav
- **Bottom Menu:** Floating pill-style dock with tooltip labels — alternative nav pattern
- **Calendar Scheduler:** Clean card-based date/time picker using react-day-picker — relevant for session scheduling

## Design Direction
**Chosen:** Studio Luxe — dark warmth meets athletic premium
**Typography:** Cormorant Garamond (heading) + Outfit (body)
**Primary:** #3D2B1F (dark walnut)
**Accent:** #C4956A (warm brass)
**Background:** #F5F0EB (warm stone)
**Surface:** #FFFFFF (white)
**Foreground:** #1A1210 (near-black espresso)
**Distinguishing:** #8E6B4A (aged leather)
**Signature:** Frosted glassmorphic cards with warm blur-through
**Mood:** Equinox+ premium polish meets Calm's depth

## Design System
docs/design-system.md (exists from prior work, needs update)
