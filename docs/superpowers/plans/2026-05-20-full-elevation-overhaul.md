# Full Elevation Design Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate YogaFlow from 6.5/10 to 9/10 by addressing all P0+P1 design gaps while preserving the Golden Hour design system.

**Architecture:** Additive overhaul — no rearchitecting. Framer Motion added for page transitions and micro-interactions. Shared components extracted for consistency. Each task produces a working, committable increment. All changes stay within the existing React Router + Tailwind CSS v4 + shadcn/ui stack.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, shadcn/ui (new-york), React Router DOM v7, Framer Motion (new), Lucide React, date-fns

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/ui/badge-status.tsx` | Shared badge component replacing StatusBadge/PaymentBadge/inline badges |
| `src/components/ui/page-header.tsx` | Sticky frosted-glass page header with title + optional actions |
| `src/components/ui/skeleton-card.tsx` | Skeleton shimmer card for loading states |
| `src/components/layout/PageTransition.tsx` | Framer Motion AnimatePresence wrapper for route transitions |
| `src/components/today/GreetingHero.tsx` | Greeting card + daily stats for Today page |
| `src/components/today/DateScroller.tsx` | Horizontal swipeable date strip |
| `src/components/today/DurationBadge.tsx` | Session duration pill ("60 min") |
| `src/components/onboarding/StepExperience.tsx` | Onboarding step 2: experience level |
| `src/components/onboarding/StepClassTypes.tsx` | Onboarding step 3: class types |
| `src/components/landing/Testimonials.tsx` | Testimonial carousel section |
| `src/components/landing/FAQ.tsx` | FAQ accordion section |
| `src/components/landing/Footer.tsx` | Full footer with links + social icons |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add `framer-motion` dependency |
| `src/index.css` | Add skeleton shimmer keyframe, page-transition tokens |
| `src/lib/utils.ts` | Add `getSessionDuration()` and `getGreeting()` helpers |
| `src/components/shared/InitialsAvatar.tsx` | Add color rotation (5 warm variants), size prop |
| `src/components/shared/EmptyState.tsx` | Larger icon (h-8 w-8), consistent usage |
| `src/components/today/NowDivider.tsx` | Gradient-golden line instead of solid primary |
| `src/components/today/FAB.tsx` | Gradient background instead of solid primary |
| `src/components/sessions/SessionCard.tsx` | Add duration badge, level indicator, styled metaLine |
| `src/components/layout/AppLayout.tsx` | Wrap Outlet in PageTransition, add top safe area |
| `src/components/layout/BottomNav.tsx` | Icons 24px, labels 12px, animated active indicator |
| `src/pages/TodayPage.tsx` | GreetingHero + DateScroller, replace popover calendar |
| `src/pages/SettingsPage.tsx` | Full restructure with icon-led grouped sections |
| `src/pages/OnboardingPage.tsx` | 3-screen flow with step transitions |
| `src/pages/LoginPage.tsx` | Google button prominence, entrance animation |
| `src/pages/SignUpPage.tsx` | Google button prominence, password strength, field validation |
| `src/pages/LandingPage.tsx` | Add Testimonials, FAQ, Footer sections |
| `src/App.tsx` | Wrap routes with AnimatePresence |
| `src/types/index.ts` | Add `experienceLevel` and `classTypes` to Instructor |

---

## Task 1: Add Framer Motion + Utility Helpers

**Files:**
- Modify: `package.json`
- Modify: `src/lib/utils.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Install framer-motion**

```bash
npx pnpm add framer-motion
```

- [ ] **Step 2: Add utility helpers to `src/lib/utils.ts`**

Append after the existing `formatTime` function:

```typescript
export function getSessionDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const AVATAR_COLORS = [
  'from-[#B8664E] to-[#D4A95A]', // terracotta → gold (original)
  'from-[#C47A5A] to-[#E8B87A]', // warm peach → light gold
  'from-[#A0785C] to-[#C9A86C]', // warm brown → muted gold
  'from-[#9B6B5A] to-[#D49B6A]', // dusty rose → amber
  'from-[#8C7B6A] to-[#BFA878]', // taupe → sand
] as const

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
```

- [ ] **Step 3: Add skeleton shimmer keyframe to `src/index.css`**

Insert before the `/* Smooth scrolling */` comment (line 159):

```css
/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--secondary)) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius);
}
```

- [ ] **Step 4: Commit**

```bash
rtk git add . && rtk git commit -m "feat: add framer-motion, utility helpers, skeleton shimmer"
```

---

## Task 2: Shared Badge Component

**Files:**
- Create: `src/components/ui/badge-status.tsx`
- Modify: `src/components/sessions/StatusBadge.tsx` (re-export from new badge)

- [ ] **Step 1: Create `src/components/ui/badge-status.tsx`**

```tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'scheduled' | 'completed' | 'cancelled' | 'paid' | 'unpaid' | 'info' | 'duration' | 'level'

const variantConfig: Record<BadgeVariant, { className: string }> = {
  scheduled: { className: 'bg-[hsl(var(--status-scheduled))]/10 text-[hsl(var(--status-scheduled))]' },
  completed: { className: 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]' },
  cancelled: { className: 'bg-muted text-muted-foreground' },
  paid: { className: 'bg-[hsl(var(--status-paid))]/10 text-[hsl(var(--status-paid))]' },
  unpaid: { className: 'bg-[hsl(var(--status-unpaid))]/10 text-[hsl(var(--status-unpaid))]' },
  info: { className: 'bg-secondary text-secondary-foreground' },
  duration: { className: 'bg-primary/10 text-primary' },
  level: { className: 'bg-accent/15 text-accent-foreground' },
}

interface BadgeStatusProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function BadgeStatus({ variant, children, className }: BadgeStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        variantConfig[variant].className,
        className,
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Update StatusBadge to use BadgeStatus**

Replace entire content of `src/components/sessions/StatusBadge.tsx`:

```tsx
import { BadgeStatus } from '@/components/ui/badge-status'
import { cn } from '@/lib/utils'

type Status = 'scheduled' | 'completed' | 'cancelled'

const labelMap: Record<Status, string> = {
  scheduled: 'Upcoming',
  completed: 'Done',
  cancelled: 'Cancelled',
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <BadgeStatus variant={status} className={cn('uppercase', className)}>
      {labelMap[status]}
    </BadgeStatus>
  )
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: add shared BadgeStatus component, refactor StatusBadge"
```

---

## Task 3: InitialsAvatar with Color Rotation + Size Prop

**Files:**
- Modify: `src/components/shared/InitialsAvatar.tsx`

- [ ] **Step 1: Rewrite InitialsAvatar**

Replace entire content of `src/components/shared/InitialsAvatar.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { getAvatarColor } from '@/lib/utils'

interface InitialsAvatarProps {
  name: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const

export function InitialsAvatar({ name, size = 'default', className }: InitialsAvatarProps) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.[0] || '?'

  const colorClass = getAvatarColor(name)

  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
      colorClass,
      sizeClasses[size],
      className,
    )}>
      {initials.toUpperCase()}
    </div>
  )
}
```

- [ ] **Step 2: Update all `InitialsAvatar` usages that pass custom size classes**

Search for `InitialsAvatar` with `h-14 w-14 text-lg` in `SettingsPage.tsx` and `ClientDetailPage.tsx` — replace those with `size="lg"`. Remove the manual className overrides for sizing.

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: InitialsAvatar with color rotation and size prop"
```

---

## Task 4: EmptyState, NowDivider, FAB Polish

**Files:**
- Modify: `src/components/shared/EmptyState.tsx`
- Modify: `src/components/today/NowDivider.tsx`
- Modify: `src/components/today/FAB.tsx`

- [ ] **Step 1: Update EmptyState — larger icon**

Replace entire `src/components/shared/EmptyState.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, heading, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-foreground">{heading}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button
          className="mt-6 gradient-golden text-white font-semibold shadow-sm hover:opacity-90 border-0"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update NowDivider — gradient line**

Replace entire `src/components/today/NowDivider.tsx`:

```tsx
export function NowDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="h-px flex-grow gradient-golden opacity-50" />
      <span className="mx-3 shrink-0 text-xs font-semibold tracking-wide text-primary uppercase">Now</span>
      <div className="h-px flex-grow gradient-golden opacity-50" />
    </div>
  )
}
```

- [ ] **Step 3: Update FAB — gradient background**

In `src/components/today/FAB.tsx`, replace the button className (line 25):

Change `bg-primary text-primary-foreground` to `gradient-golden text-white`:

```tsx
className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+16px)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-golden text-white shadow-lg transition-transform active:scale-95 hover:opacity-90"
```

- [ ] **Step 4: Commit**

```bash
rtk git add . && rtk git commit -m "feat: polish EmptyState, NowDivider, FAB with gradient"
```

---

## Task 5: Page Header + Skeleton Card Components

**Files:**
- Create: `src/components/ui/page-header.tsx`
- Create: `src/components/ui/skeleton-card.tsx`

- [ ] **Step 1: Create PageHeader**

```tsx
// src/components/ui/page-header.tsx
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  backTo?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, backTo, actions, className }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={cn(
      'sticky top-0 z-30 -mx-4 mb-4 border-b border-border/60 bg-background/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-lg',
      className,
    )}>
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="flex-1 font-heading text-2xl text-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create SkeletonCard**

```tsx
// src/components/ui/skeleton-card.tsx
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  lines?: number
  className?: string
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-start gap-3">
        <div className="skeleton h-10 w-[72px] rounded-md" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn('skeleton h-3 rounded-full', i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-1/3')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: add PageHeader and SkeletonCard components"
```

---

## Task 6: Page Transitions + App Shell Upgrade

**Files:**
- Create: `src/components/layout/PageTransition.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Create PageTransition wrapper**

```tsx
// src/components/layout/PageTransition.tsx
import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Update AppLayout — add PageTransition + top safe area**

Replace entire `src/components/layout/AppLayout.tsx`:

```tsx
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { VerificationBanner } from './VerificationBanner'
import { PageTransition } from './PageTransition'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background pb-20 pt-[env(safe-area-inset-top)]">
      <main className="mx-auto max-w-lg px-4 pt-3">
        <VerificationBanner />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Polish BottomNav — 24px icons, 12px labels, animated indicator**

Replace entire `src/components/layout/BottomNav.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck, Calendar, Users, UsersRound, Settings } from 'lucide-react'

const tabs = [
  { to: '/today', icon: CalendarCheck, label: 'Today' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/classes', icon: UsersRound, label: 'Classes' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/today'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-3 py-2 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full gradient-golden"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Verify the app loads and nav animates**

Run: `npx pnpm dev`

Navigate between tabs. The active indicator bar should smoothly slide between tabs via `layoutId`. Pages should fade in/out with a subtle y-axis shift.

- [ ] **Step 5: Commit**

```bash
rtk git add . && rtk git commit -m "feat: page transitions, animated nav indicator, top safe area"
```

---

## Task 7: Today Page — Greeting Hero + Date Scroller

**Files:**
- Create: `src/components/today/GreetingHero.tsx`
- Create: `src/components/today/DateScroller.tsx`
- Create: `src/components/today/DurationBadge.tsx`
- Modify: `src/pages/TodayPage.tsx`

- [ ] **Step 1: Create GreetingHero**

```tsx
// src/components/today/GreetingHero.tsx
import { CalendarCheck, Clock } from 'lucide-react'
import { getGreeting } from '@/lib/utils'

interface GreetingHeroProps {
  displayName: string
  sessionCount: number
  totalMinutes: number
}

export function GreetingHero({ displayName, sessionCount, totalMinutes }: GreetingHeroProps) {
  const firstName = displayName.split(' ')[0]

  return (
    <div className="mb-5">
      <h1 className="font-heading text-2xl text-foreground">
        {getGreeting()}, {firstName}
      </h1>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        </div>
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5">
            <Clock className="h-4 w-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              {totalMinutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create DateScroller**

```tsx
// src/components/today/DateScroller.tsx
import { useRef, useEffect } from 'react'
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateScrollerProps {
  selectedDate: Date
  onSelect: (date: Date) => void
}

export function DateScroller({ selectedDate, onSelect }: DateScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLButtonElement>(null)

  // Generate 15 days before and after today
  const dates = Array.from({ length: 31 }, (_, i) => addDays(subDays(new Date(), 15), i))

  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="mb-4 -mx-4">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {dates.map((date) => {
          const selected = isSameDay(date, selectedDate)
          const today = isToday(date)

          return (
            <button
              key={date.toISOString()}
              ref={today ? todayRef : undefined}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                'flex shrink-0 flex-col items-center rounded-xl px-3 py-2 transition-all duration-150',
                selected
                  ? 'gradient-golden text-white shadow-md'
                  : 'bg-card hover:bg-secondary',
                today && !selected && 'ring-1 ring-primary/30',
              )}
            >
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wider',
                selected ? 'text-white/80' : 'text-muted-foreground',
              )}>
                {format(date, 'EEE')}
              </span>
              <span className={cn(
                'text-lg font-semibold leading-tight',
                selected ? 'text-white' : 'text-foreground',
              )}>
                {format(date, 'd')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create DurationBadge**

```tsx
// src/components/today/DurationBadge.tsx
import { BadgeStatus } from '@/components/ui/badge-status'
import { getSessionDuration } from '@/lib/utils'

interface DurationBadgeProps {
  startTime: string
  endTime: string
}

export function DurationBadge({ startTime, endTime }: DurationBadgeProps) {
  const mins = getSessionDuration(startTime, endTime)
  return <BadgeStatus variant="duration">{mins} min</BadgeStatus>
}
```

- [ ] **Step 4: Update TodayPage to use new components**

This is the largest change. In `src/pages/TodayPage.tsx`:

1. Replace the existing header block (the `<div>` containing the "Today" `<h1>`, date label, session count text, and popover calendar) with:
   - `<GreetingHero>` using instructor displayName and computed stats
   - `<DateScroller>` replacing the popover calendar

2. Add `<DurationBadge>` to each `<SessionCard>` by computing duration from `session.startTime` and `session.endTime`.

3. Replace the inline skeleton `<div>` blocks with `<SkeletonCard />` from Task 5.

4. Replace the inline custom empty state JSX (the `<div className="flex flex-col items-center justify-center py-16 text-center">` blocks) with the `<EmptyState>` component.

Key imports to add:
```tsx
import { GreetingHero } from '@/components/today/GreetingHero'
import { DateScroller } from '@/components/today/DateScroller'
import { DurationBadge } from '@/components/today/DurationBadge'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { getSessionDuration } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
```

Compute stats for GreetingHero:
```tsx
const { instructor } = useAuth()
const activeSessions = sessions.filter(s => s.status !== 'cancelled')
const totalMinutes = activeSessions.reduce(
  (sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0
)
```

Remove the old Popover/Calendar imports and the date picker popover JSX entirely. The DateScroller component handles date selection.

- [ ] **Step 5: Verify Today page renders greeting, date scroller, and sessions**

Run: `npx pnpm dev`, navigate to `/today`. Confirm:
- Greeting shows "Good morning/afternoon/evening, [FirstName]"
- Date scroller scrolls horizontally, today is centered, selected date is gradient
- Session count and total minutes pills visible
- Duration badges appear on session cards

- [ ] **Step 6: Commit**

```bash
rtk git add . && rtk git commit -m "feat: Today page hero redesign with greeting, date scroller, duration badges"
```

---

## Task 8: Session Card Enrichment

**Files:**
- Modify: `src/components/sessions/SessionCard.tsx`

- [ ] **Step 1: Add duration badge and styled metaLine to SessionCard**

Update `src/components/sessions/SessionCard.tsx` — add DurationBadge import and render it in the badges row. Change the plain `metaLine` text span to use `BadgeStatus` with variant `info`:

Add imports:
```tsx
import { DurationBadge } from '@/components/today/DurationBadge'
import { BadgeStatus } from '@/components/ui/badge-status'
```

In the badges row (the `<div className="mt-2 flex flex-wrap items-center gap-1.5">` on line 82), add DurationBadge after StatusBadge:

```tsx
<div className="mt-2 flex flex-wrap items-center gap-1.5">
  <StatusBadge status={session.status} />
  <DurationBadge startTime={session.startTime} endTime={session.endTime} />
  {metaLine && (
    <BadgeStatus variant="info">{metaLine}</BadgeStatus>
  )}
</div>
```

This replaces the old plain `<span className="text-xs text-muted-foreground">{metaLine}</span>`.

- [ ] **Step 2: Commit**

```bash
rtk git add . && rtk git commit -m "feat: session cards with duration badges and styled metadata"
```

---

## Task 9: Settings Page Restructure

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Full rewrite of SettingsPage with icon-led grouped sections**

Read the current `src/pages/SettingsPage.tsx` first, then replace its content with a restructured version that has:

**Account section** (User icon):
- Profile card (avatar + name + email)
- Sign Out item at bottom of account section

**Notifications section** (Bell icon):
- Session Reminders toggle (existing logic preserved)

**App section** (Smartphone icon):
- Version info
- Contact Support link (mailto)

Structure each section as:
```tsx
<section className="space-y-1">
  <h2 className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
    <Icon className="h-4 w-4" />
    Section Title
  </h2>
  <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
    {/* items */}
  </div>
</section>
```

Each item row:
```tsx
<div className="flex items-center gap-3 px-4 py-3.5">
  <Icon className="h-5 w-5 text-muted-foreground" />
  <span className="flex-1 text-sm font-medium text-foreground">Label</span>
  {/* right side: Switch, ChevronRight, or value */}
</div>
```

Preserve all existing state management and Firestore logic. Only restructure the JSX.

Add `PageHeader` at top:
```tsx
<PageHeader title="Settings" />
```

Icons to use from lucide-react: `User, Bell, Smartphone, LogOut, Mail, ChevronRight`

- [ ] **Step 2: Verify settings renders with grouped sections**

Run dev server, navigate to `/settings`. Confirm:
- Account section with profile, sign out
- Notifications section with toggle
- App section with version
- All icons leading each row

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: restructure settings with icon-led grouped sections"
```

---

## Task 10: Onboarding Expansion (3 Screens)

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/components/onboarding/StepExperience.tsx`
- Create: `src/components/onboarding/StepClassTypes.tsx`
- Modify: `src/pages/OnboardingPage.tsx`

- [ ] **Step 1: Add onboarding fields to Instructor type**

In `src/types/index.ts`, add to the `Instructor` interface after `notificationsEnabled?`:

```typescript
experienceLevel?: 'beginner' | 'intermediate' | 'experienced'
classTypes?: string[]
```

- [ ] **Step 2: Create StepExperience**

```tsx
// src/components/onboarding/StepExperience.tsx
import { cn } from '@/lib/utils'

const levels = [
  { value: 'beginner', label: 'Just starting out', description: 'Less than 1 year teaching' },
  { value: 'intermediate', label: 'Growing my practice', description: '1-3 years teaching' },
  { value: 'experienced', label: 'Seasoned instructor', description: '3+ years teaching' },
] as const

interface StepExperienceProps {
  value: string
  onChange: (value: string) => void
}

export function StepExperience({ value, onChange }: StepExperienceProps) {
  return (
    <div className="space-y-3">
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          className={cn(
            'w-full rounded-xl border p-4 text-left transition-all duration-150',
            value === level.value
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border bg-card hover:border-primary/30',
          )}
        >
          <p className="font-medium text-foreground">{level.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{level.description}</p>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create StepClassTypes**

```tsx
// src/components/onboarding/StepClassTypes.tsx
import { cn } from '@/lib/utils'

const classTypes = [
  'Vinyasa', 'Hatha', 'Yin', 'Restorative', 'Power', 'Ashtanga',
  'Prenatal', 'Hot Yoga', 'Meditation', 'Private Sessions', 'Other',
] as const

interface StepClassTypesProps {
  selected: string[]
  onChange: (types: string[]) => void
}

export function StepClassTypes({ selected, onChange }: StepClassTypesProps) {
  const toggle = (type: string) => {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {classTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => toggle(type)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150',
            selected.includes(type)
              ? 'gradient-golden text-white border-transparent shadow-sm'
              : 'border-border bg-card text-foreground hover:border-primary/30',
          )}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite OnboardingPage as 3-step flow**

Replace `src/pages/OnboardingPage.tsx` with a multi-step form:

- Step 1: Display name (existing)
- Step 2: Experience level (StepExperience)
- Step 3: Class types (StepClassTypes)

Use `useState` for `step` (1-3), animate transitions with `framer-motion` `AnimatePresence`. On final step submit, write all fields to Firestore `instructors` doc.

Step indicator: 3 bars replacing current 2 dots:
```tsx
<div className="flex gap-2">
  {[1, 2, 3].map((s) => (
    <div
      key={s}
      className={cn(
        'h-1.5 flex-1 rounded-full transition-all duration-300',
        s <= step ? 'gradient-golden' : 'bg-muted',
      )}
    />
  ))}
</div>
```

Preserve the existing Firestore update logic but expand to include `experienceLevel` and `classTypes`.

- [ ] **Step 5: Commit**

```bash
rtk git add . && rtk git commit -m "feat: expand onboarding to 3-step flow with experience and class types"
```

---

## Task 11: Auth Polish — Google Button + Entrance Animations

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/SignUpPage.tsx`

- [ ] **Step 1: Update LoginPage — Google button prominence + entrance animation**

In `src/pages/LoginPage.tsx`:

1. Change Google button from `variant="outline"` to a filled, prominent style:
```tsx
<Button
  type="button"
  onClick={handleGoogleSignIn}
  disabled={isSubmitting}
  className="w-full h-12 gap-3 bg-card border-2 border-primary/20 text-foreground font-semibold shadow-md hover:bg-secondary hover:border-primary/30 transition-all"
>
```

2. Wrap the form container with a framer-motion `motion.div` for entrance:
```tsx
import { motion } from 'framer-motion'

// Wrap the form div:
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
  className="..."
>
```

- [ ] **Step 2: Update SignUpPage — same Google button + password strength**

Apply the same Google button styling change.

Add a simple password strength indicator below the password field:

```tsx
{password && (
  <div className="flex gap-1">
    {[1, 2, 3].map((level) => (
      <div
        key={level}
        className={cn(
          'h-1 flex-1 rounded-full transition-all',
          password.length >= level * 4
            ? password.length >= 12 ? 'bg-[hsl(var(--status-completed))]'
              : password.length >= 8 ? 'bg-accent'
              : 'bg-[hsl(var(--status-unpaid))]'
            : 'bg-muted',
        )}
      />
    ))}
  </div>
)}
```

Add entrance animation wrapper same as LoginPage.

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: auth polish — prominent Google button, password strength, entrance animations"
```

---

## Task 12: Landing Page Trust — Testimonials, FAQ, Footer

**Files:**
- Create: `src/components/landing/Testimonials.tsx`
- Create: `src/components/landing/FAQ.tsx`
- Create: `src/components/landing/Footer.tsx`
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create Testimonials section**

```tsx
// src/components/landing/Testimonials.tsx
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Vinyasa Instructor, Austin',
    quote: 'YogaFlow replaced my spreadsheet, my calendar app, and my payment tracker. Everything I need is in one place.',
  },
  {
    name: 'David Chen',
    role: 'Studio Owner, Portland',
    quote: "The scheduling is intuitive and my clients love the organization. I can't imagine going back to pen and paper.",
  },
  {
    name: 'Priya Sharma',
    role: 'Private Yoga Teacher, NYC',
    quote: "Finally, a tool built for yoga instructors, not generic businesses. It understands how I actually work.",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl text-foreground">
          Loved by instructors
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
          Join yoga teachers who simplified their practice management
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="reveal rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <InitialsAvatar name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create FAQ section**

```tsx
// src/components/landing/FAQ.tsx
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  { q: 'Is YogaFlow really free?', a: 'Yes! YogaFlow is free to use for solo yoga instructors. We may introduce premium features in the future, but the core scheduling and client management tools will always be free.' },
  { q: 'Does it work offline?', a: 'Yes. YogaFlow works offline so you can manage sessions even without internet. Your data syncs automatically when you reconnect.' },
  { q: 'Can I use it for group classes?', a: 'Absolutely. Create group classes with rosters, track attendance, and manage capacity all in one place.' },
  { q: 'Is my data secure?', a: 'Your data is stored securely on Google Cloud infrastructure with encryption at rest and in transit. We never share your data with third parties.' },
  { q: 'Can I access it on my phone?', a: 'YogaFlow is a progressive web app — install it on your phone\'s home screen and it works just like a native app.' },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl text-foreground">
          Questions & answers
        </h2>
        <div className="mt-12 space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="reveal rounded-xl border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    open === i && 'rotate-180',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create Footer**

```tsx
// src/components/landing/Footer.tsx
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-heading text-xl text-foreground">YogaFlow</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice management for yoga instructors
            </p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Product</p>
              <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="block hover:text-foreground transition-colors">How It Works</a>
              <Link to="/signup" className="block hover:text-foreground transition-colors">Get Started</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Legal</p>
              <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} YogaFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Add new sections to LandingPage**

In `src/pages/LandingPage.tsx`:

1. Import the three new components
2. Insert `<Testimonials />` after the Features section
3. Insert `<FAQ />` after the How It Works section
4. Replace the existing bare `<footer>` with `<Footer />`

Wire the new sections into the existing IntersectionObserver by adding the `reveal` class to the new section children.

- [ ] **Step 5: Commit**

```bash
rtk git add . && rtk git commit -m "feat: landing page trust — testimonials, FAQ accordion, full footer"
```

---

## Task 13: Add PageHeader to Key Pages

**Files:**
- Modify: `src/pages/ClientsPage.tsx`
- Modify: `src/pages/ClassesPage.tsx`
- Modify: `src/pages/ClientDetailPage.tsx`
- Modify: `src/pages/SessionDetailPage.tsx`

- [ ] **Step 1: Add PageHeader to list pages**

In `ClientsPage.tsx` and `ClassesPage.tsx`, replace the existing `<h1>` headers with `<PageHeader title="Clients" />` (or "Classes"), moving any existing action buttons into the `actions` prop.

- [ ] **Step 2: Add PageHeader with back button to detail pages**

In `ClientDetailPage.tsx` and `SessionDetailPage.tsx`, replace the existing back button + title pattern with:
```tsx
<PageHeader title={title} backTo="/clients" actions={editButton} />
```

- [ ] **Step 3: Commit**

```bash
rtk git add . && rtk git commit -m "feat: sticky PageHeader with back navigation on all pages"
```

---

## Task 14: Final Polish + Visual Verification

**Files:**
- Various (minor tweaks discovered during review)

- [ ] **Step 1: Run the dev server and visually verify each page**

Use Playwright MCP to navigate to each page and take screenshots:
1. `/` — Landing page (testimonials, FAQ, footer)
2. `/login` — Google button prominent, entrance animation
3. `/signup` — Password strength indicator
4. `/onboarding` — 3-step flow
5. `/today` — Greeting hero, date scroller, duration badges
6. `/clients` — PageHeader, avatar color variation
7. `/settings` — Icon-led grouped sections
8. Navigate between tabs — animated nav indicator

- [ ] **Step 2: Fix any visual issues found**

Address spacing, color, or alignment issues discovered during verification.

- [ ] **Step 3: Build check**

```bash
rtk npx pnpm build
```

Fix any TypeScript or build errors.

- [ ] **Step 4: Final commit**

```bash
rtk git add . && rtk git commit -m "fix: visual polish and build verification"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Framer Motion + utilities | package.json, utils.ts, index.css |
| 2 | Shared BadgeStatus | badge-status.tsx, StatusBadge.tsx |
| 3 | InitialsAvatar with colors + sizes | InitialsAvatar.tsx |
| 4 | EmptyState, NowDivider, FAB polish | 3 component files |
| 5 | PageHeader + SkeletonCard | 2 new components |
| 6 | Page transitions + app shell | PageTransition.tsx, AppLayout, BottomNav |
| 7 | Today page hero redesign | GreetingHero, DateScroller, DurationBadge, TodayPage |
| 8 | Session card enrichment | SessionCard.tsx |
| 9 | Settings restructure | SettingsPage.tsx |
| 10 | Onboarding 3-step flow | OnboardingPage, 2 new step components, types |
| 11 | Auth polish | LoginPage, SignUpPage |
| 12 | Landing page trust | Testimonials, FAQ, Footer, LandingPage |
| 13 | PageHeader on all pages | 4 page files |
| 14 | Visual verification + build check | Various |
