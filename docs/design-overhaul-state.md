# Design Overhaul State

## Current Phase: 11 (Deploy)
## Completed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

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
| Landing | / | LandingPage.tsx | done |
| Login | /login | LoginPage.tsx | done |
| Signup | /signup | SignUpPage.tsx | done |
| Reset Password | /reset-password | ResetPasswordPage.tsx | done |
| Onboarding | /onboarding | OnboardingPage.tsx | done |
| Today | /today | TodayPage.tsx | done |
| Calendar | /calendar | CalendarPage.tsx | done |
| Clients | /clients | ClientsPage.tsx | done |
| Client Create | /clients/new | ClientCreatePage.tsx | done |
| Client Detail | /clients/:id | ClientDetailPage.tsx | done |
| Client Edit | /clients/:id/edit | ClientEditPage.tsx | done |
| Session Create | /sessions/new | SessionCreatePage.tsx | done |
| Session Detail | /sessions/:id | SessionDetailPage.tsx | done |
| Session Edit | /sessions/:id/edit | SessionEditPage.tsx | done |
| Classes | /classes | ClassesPage.tsx | done |
| Class Create | /classes/new | ClassCreatePage.tsx | done |
| Class Detail | /classes/:id | ClassDetailPage.tsx | done |
| Group Session | /sessions/:id/attendance | GroupSessionPage.tsx | done |
| Settings | /settings | SettingsPage.tsx | done |

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
