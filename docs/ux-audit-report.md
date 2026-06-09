# UX Intuitiveness Audit

## App Context
- **Name:** YogaFlow
- **Domain:** Health/Wellness — yoga practice management
- **Target Users:** Solo yoga instructors (non-technical, mobile-first)
- **Tech Stack:** React 19 + Tailwind CSS v4 + shadcn/ui (new-york)
- **Pages:** 19
- **Routes:** 17 (plus catch-all)

## Workflow Map

### WF1: First-Time User Setup — Bumpy
Path: Landing -> Sign Up -> Onboarding (3 steps) -> Today
Gaps:
- [WF-001] Unclear sequence at Today — no guidance on what to do first after onboarding
- [WF-002] Hidden prerequisite at Today -> Session Create — "Add Session" requires a client first

### WF2: Manage Clients (CRUD) — Bumpy
Path: Clients -> Add Client -> Client Detail -> Edit Client
Gaps:
- [WF-003] Dead end at Client Detail — no "Schedule a session" CTA
- [WF-004] Dead end at Client Detail — Session History is a stub

### WF3: Schedule a Private Session — Bumpy
Path: Today/Calendar -> FAB -> Session Create -> Today
Gaps:
- [WF-005] Hidden prerequisite at Session Create — empty ClientPicker with no guidance
- [WF-006] Missing handoff at Session Create -> Today — new session not highlighted

### WF4: Complete a Private Session — Bumpy
Path: Today -> SessionCard -> Session Detail -> Mark Complete -> Add Notes
Gaps:
- [WF-007] Dead end at Session Detail after completion — no next-step nudge
- [WF-008] Dead end at Session Detail after cancel — no reschedule option

### WF5: Create and Manage a Group Class — Broken
Path: Classes -> Create Class -> Class Detail -> Manage Roster
Gaps:
- [WF-009] Dead end at Class Detail — Edit is a stub
- [WF-010] Dead end at Class Detail — Cancel Class is a stub
- [WF-011] Hidden prerequisite at Class Create — empty roster with no client-creation link
- [WF-012] Missing handoff at Class Detail — no next-step guidance after creation

### WF6: Run a Group Session — Bumpy
Path: Today -> SessionCard (group) -> Group Attendance -> Mark Complete
Gaps:
- [WF-013] Missing handoff — Session Detail doesn't link to Group Attendance
- [WF-014] Dead end at Group Attendance after completion

### WF7: Manage Packages & Payments — Bumpy
Path: Client Detail -> Create Package -> (auto-deduction)
Gaps:
- [WF-015] Missing handoff — no explanation of what packages are
- [WF-016] Missing handoff — no link from Session Detail to client's package info
- [WF-017] Unclear sequence — no cross-client payment overview

### WF8: Navigate Calendar — Smooth
Path: Calendar -> Month/Week -> tap date -> tap session -> Detail
Gaps:
- [WF-018] Minor missing handoff — empty day has no CTA text

## Page Scorecard

| Page | Orient. | Actions | Progress | Guidance | Metrics | Empty | Next | Feedback | Intent | Score |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Landing | P | P | - | - | - | - | P | - | P | 4/4 |
| Login | P | P | - | / | - | - | P | P | P | 4.5/5 |
| Sign Up | P | P | - | / | - | - | P | P | P | 4.5/5 |
| Reset Password | P | P | - | M | - | - | / | / | P | 3/5 |
| Onboarding | P | P | P | P | - | - | P | / | P | 5.5/6 |
| Today | P | P | / | M | / | P | M | P | P | 5.5/9 |
| Calendar | P | P | / | M | M | / | M | P | P | 4.5/9 |
| Clients | P | P | M | M | M | P | M | P | P | 5/9 |
| Add Client | P | P | - | / | - | - | / | P | P | 4.5/5 |
| Client Detail | P | P | / | M | / | / | M | P | P | 5.5/9 |
| Edit Client | P | P | - | / | - | - | / | P | P | 4.5/5 |
| Create Session | / | P | - | / | - | M | / | P | P | 4/7 |
| Session Detail | P | P | P | M | M | / | M | P | P | 5.5/9 |
| Edit Session | / | P | - | / | - | - | / | P | P | 4/5 |
| Classes | P | P | M | M | M | P | M | P | P | 5/9 |
| Create Class | / | P | / | / | - | / | / | P | P | 5/7 |
| Class Detail | P | / | P | M | / | / | M | / | P | 4.5/9 |
| Group Attendance | / | P | P | M | / | / | M | P | P | 5/9 |
| Settings | P | P | - | / | - | - | - | P | P | 4.5/5 |

## Findings (Prioritized)

### Critical

- **UX-001** [Hidden prerequisite] Session Create has empty ClientPicker when no clients exist — no guidance to create a client first, no link to /clients/new. User discovers the prerequisite only after opening the form. (Pages: SessionCreatePage)
  Layer: Empty States + Guidance | Fix: Show prerequisite empty state with CTA link to create a client

- **UX-002** [Unclear sequence] After onboarding, new user lands on empty Today with no indication of what to do first. Five equal-weight nav tabs, zero data, no getting-started guidance. (Pages: TodayPage)
  Layer: Next Steps + Guidance | Fix: State-aware getting-started checklist when instructor has 0 clients and 0 sessions

### High

- **UX-003** [Dead end] Client Detail has no "Schedule a session" CTA. After adding a client, the natural next step is to book their first session but nothing suggests this. (Pages: ClientDetailPage)
  Layer: Next Steps | Fix: Add "Schedule Session" button/link on Client Detail

- **UX-004** [Dead end] After marking a session complete, user stays on Session Detail with no nudge to return to Today or move to the next session. (Pages: SessionDetailPage, GroupSessionPage)
  Layer: Next Steps | Fix: Show "Back to Today" or "Next session" CTA after completion

- **UX-005** [Missing handoff] Session Create redirects to /today after creation — newly created session isn't highlighted or linked. (Pages: SessionCreatePage -> TodayPage)
  Layer: Next Steps + Feedback | Fix: Redirect to the new session's detail page instead

- **UX-006** [Stub feature] Class Detail "Edit" and "Cancel Class" buttons show "coming soon" toasts — broken workflows that mislead users. (Pages: ClassDetailPage)
  Layer: Action Clarity | Fix: Flag only — implementing features is out of scope. Recommend removing stubs or showing disabled state with explanation.

- **UX-007** [Hidden prerequisite] Class Create roster shows "No active clients" when no clients exist, with no link to create one. (Pages: ClassCreatePage)
  Layer: Empty States + Guidance | Fix: Add "Add a client first" link in the empty roster section

- **UX-008** [Missing guidance] Packages on Client Detail have no explanation. User doesn't know what packages are, how credits work, or when to create one. (Pages: ClientDetailPage)
  Layer: Guidance | Fix: Add help text explaining packages and credit auto-deduction

- **UX-009** [Missing handoff] Calendar empty day shows icon + "No sessions" with no CTA text. FAB exists but isn't referenced. (Pages: CalendarPage)
  Layer: Empty States + Next Steps | Fix: Add "Tap + to add a session" text

- **UX-010** [Missing metrics] Clients page shows no aggregate client count. (Pages: ClientsPage)
  Layer: Metrics | Fix: Add client count subtitle below page header

- **UX-011** [Missing metrics] Classes page shows no class count or total students. (Pages: ClassesPage)
  Layer: Metrics | Fix: Add class count and total enrolled students subtitle

- **UX-012** [Missing guidance] Calendar dot colors (green=private, blue=group) have no legend. (Pages: CalendarPage)
  Layer: Guidance | Fix: Add a small legend or tooltip explaining dot colors

### Medium

- **UX-013** [Missing metrics] Session Detail doesn't show session duration, client's total session count, or package credit info inline. (Pages: SessionDetailPage)
  Layer: Metrics | Fix: Add duration badge and package credit summary

- **UX-014** [Stub content] Client Detail "Session History" section says "coming soon" — placeholder with no data. (Pages: ClientDetailPage)
  Layer: Empty States | Fix: Flag only — feature gap, not a pure UX fix

- **UX-015** [Partial metrics] Today page shows session count and total minutes but no completed-vs-remaining breakdown. (Pages: TodayPage)
  Layer: Metrics | Fix: Add "X completed, Y remaining" to GreetingHero

- **UX-016** [Missing orientation] Group Attendance page has no breadcrumb or link to parent class. (Pages: GroupSessionPage)
  Layer: Orientation | Fix: Add link to the parent class in the page header

- **UX-017** [Weak orientation] Session Create and Edit back links say "← Back" (navigate(-1)) instead of specific destination. (Pages: SessionCreatePage, SessionEditPage)
  Layer: Orientation | Fix: Use specific back-to labels (e.g., "← Today")

- **UX-018** [Dead end] Cancelled session shows status text but no reschedule or undo option. (Pages: SessionDetailPage)
  Layer: Next Steps | Fix: Add "Reschedule" link that pre-fills a new session form

- **UX-019** [Missing handoff] Session Detail for group sessions doesn't link to the attendance view. (Pages: SessionDetailPage)
  Layer: Next Steps | Fix: Add "Take Attendance" link for group sessions

- **UX-020** [Dead end] After group session completion, same dead end as private sessions. (Pages: GroupSessionPage)
  Layer: Next Steps | Fix: Same as UX-004

- **UX-021** [Missing overview] No cross-client payment/package overview exists. (Pages: none — would need new page)
  Layer: Metrics | Fix: Flag only — out of scope for intuitiveness skill

- **UX-022** [Missing handoff] After class creation, Class Detail doesn't guide user on next steps (scheduling more sessions, adding roster). (Pages: ClassDetailPage)
  Layer: Next Steps | Fix: State-aware "What to do next" section when class has 0 upcoming sessions

### Low

- **UX-023** [Weak feedback] Onboarding submit error is console.error only — no user-facing error message. (Pages: OnboardingPage)
  Layer: Feedback | Fix: Add toast.error on submit failure

- **UX-024** [Weak feedback] Reset Password may lack clear success message about checking email. (Pages: ResetPasswordPage)
  Layer: Feedback | Fix: Show "Check your email" success state

- **UX-025** [Missing link] Session Detail has no link from deducted credits to the client's package info. (Pages: SessionDetailPage)
  Layer: Next Steps | Fix: Add "View package" link when credit is deducted

- **UX-026** [Inconsistency] Loading states are inconsistent — SkeletonCard on Today, raw animate-pulse divs elsewhere. (Pages: ClientsPage, ClassesPage, ClassDetailPage, GroupSessionPage)
  Layer: Feedback | Fix: Use SkeletonCard consistently

## Summary
- **Total findings:** 26
- **By severity:** 2 critical, 10 high, 10 medium, 4 low
- **Pages with worst scores:** Calendar (4.5/9), Clients (5/9), Classes (5/9), Class Detail (4.5/9)
- **Most common missing layer:** Next Steps (missing on 8 pages), Guidance (missing on 7 pages)
- **Workflows at risk:** WF5 (Broken), WF1/WF2/WF3/WF4/WF6/WF7 (Bumpy)
