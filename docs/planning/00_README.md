```markdown
## Overview

YogaFlow is a mobile-first web application for yoga instructors to organize their clients, classes, and sessions. It is an instructor-only tool -- clients never interact with the app. The core value proposition is replacing scattered notebooks, spreadsheets, and calendar apps with a single purpose-built system that makes forgetting client details impossible and reduces daily admin from 30-60 minutes to under 5 minutes.

The app is a PWA (installable on phone home screen) targeting instructors who work across multiple locations, often with unreliable connectivity. Offline support is a first-class concern.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 19 + TypeScript | Vite bundler |
| Styling | Tailwind CSS 4 + shadcn/ui | Custom warm theme |
| Font | Inter (Google Fonts) | Primary and only typeface |
| Auth | Firebase Auth | Google sign-in + email/password |
| Database | Cloud Firestore | Region: us-central1 |
| Backend | Firebase Cloud Functions | Node.js runtime |
| Storage | Firebase Storage | Client photos (future) |
| Hosting | Firebase Hosting | PWA with service worker |
| Recurrence | RRuleJS | Recurring session logic |
| Tables | TanStack Table | Client list, attendance, payment views |
| Error Monitoring | Sentry (free tier) | 5,000 errors/month |
| Analytics | Google Analytics 4 via Firebase | Basic usage tracking |

## File Structure

| File | Description |
|------|-------------|
| `00_README.md` | Project overview, tech stack, file map, key gaps |
| `01_Auth.md` | Google OAuth + email/password auth, session handling |
| `02_Database_Schema.md` | Firestore collections, interfaces, indexes, relationships |
| `03_API_Endpoints.md` | Cloud Functions endpoint specifications |
| `04_UI_Design_System.md` | Colors, typography, component specs, layout patterns |
| `05_Dashboard_Today_View.md` | Today screen with timeline, date picker, session cards |
| `06_Client_Management.md` | Client CRUD, health notes, search, archive/delete |
| `07_Private_Sessions.md` | One-on-one session creation, editing, location tracking |
| `08_Group_Classes.md` | Group class management, enrollment, capacity, attendance |
| `09_Recurring_Sessions.md` | RRuleJS recurrence, series editing, exception handling |
| `10_Calendar_View.md` | Calendar/schedule views beyond the Today dashboard |
| `11_Packages_Payments.md` | Session credit packages, paid/unpaid tracking, auto-refund |
| `12_Session_Notes_Prep.md` | Post-session notes (quick entry) and pre-session prep view |
| `13_Cancellations_Rescheduling.md` | Cancel flow, record keeping, credit refund logic |
| `14_Offline_PWA.md` | Firebase offline persistence, PWA manifest, service worker |
| `15_Notifications.md` | Push notification for post-session note reminders |
| `16_Future_Features.md` | Deferred features and post-MVP roadmap |

## Build Sequence

The implementation order follows data-up, UI-down logic:

1. **Foundation** (files 00-04) -- Auth, schema, API structure, and design system. Everything else depends on these.
2. **Core data entry** (files 06-07) -- Clients and private sessions. The app is useless without data to manage.
3. **Group classes** (file 08) -- Builds on clients and sessions with enrollment and attendance.
4. **Recurrence** (file 09) -- Adds recurring logic to both private sessions and group classes.
5. **Views** (files 05, 10) -- Dashboard and calendar consume session/client data. Build after the data layer exists.
6. **Business logic** (files 11, 13) -- Packages, payments, and cancellations layer on top of sessions.
7. **Workflow features** (files 12, 15) -- Session notes/prep and notifications enhance the daily workflow.
8. **Infrastructure** (file 14) -- Offline and PWA. Can be enabled incrementally alongside other work but finalized last.

## Architecture Decisions

**Instructor-only app.** No client-facing features, no client logins, no booking portal. This dramatically simplifies auth, permissions, and data access patterns. Every Firestore read/write is scoped to a single authenticated instructor.

**Mobile-first, not mobile-only.** Design for phone screens as the primary experience. Desktop should work but is not optimized. Instructors use this between sessions, standing up, often one-handed.

**Offline-first via Firestore persistence.** Firebase's built-in offline persistence is enabled from day one. The app must remain functional when connectivity drops -- instructors work in studios, basements, and parks. See `14_Offline_PWA.md`.

**Session credit packages, not dollar tracking.** v1 tracks session credits (e.g., "5-session package, 3 remaining") not monetary amounts. Payment tracking is paid/unpaid per session, rolling up to a client-level summary. See `11_Packages_Payments.md`.

**Recurrence via RRuleJS.** Recurring sessions store an RRULE string. Individual instances can be edited ("this session only" vs "this and all future"). See `09_Recurring_Sessions.md`.

**No data export in v1.** CSV export of clients and payment history is deferred. See `16_Future_Features.md`.

**Privacy policy via free generator.** Required for Google OAuth production mode. Use TermsFeed or Iubenda. Not a development task but a launch prerequisite.

## MVP Scope Summary

**In scope for v1:**
- Google + email/password authentication
- Client management (name required, contact and health notes optional, archive + hard delete)
- Private sessions with optional location
- Group classes with capacity enforcement, roster management, and per-session attendance
- Recurring sessions with series editing (this session / all future)
- Today dashboard as home screen with date picker to peek ahead
- Calendar view for schedule overview
- Session credit packages (bundles of sessions, no dollar amounts)
- Payment tracking (per-session paid/unpaid, rolling up to client summary)
- Post-session notes with sub-2-minute entry target
- Pre-session prep view (last 3 sessions, health notes, payment status)
- Cancellation with record keeping and automatic credit refund
- Push notification 5 minutes after session end for notes reminder
- Persistent "Add Notes" button on completed sessions in Today view
- Firebase offline persistence
- PWA (installable, home screen icon)
- Friendly empty states with CTAs for first-time use

**Explicitly deferred:**
- Client-facing portal or booking
- Dollar/currency payment processing
- Data export (CSV)
- Advanced reporting beyond simple weekly/monthly summary
- Client photos
- Multi-instructor / team accounts

## Key Gaps

These gaps are flagged across individual files. The highest-impact ones:

1. **No weekly/monthly summary decision finalized.** Step 12 asked about summary views (session count, payment totals) but the answer was not captured in the provided context. Files assume this is deferred to `16_Future_Features.md`. If the instructor wants a simple summary screen, it would add one more feature file.

2. **Notification infrastructure unspecified.** Push notifications were selected for post-session reminders, but the PRD does not specify the push service (Firebase Cloud Messaging is the obvious choice). See `15_Notifications.md`.

3. **Multi-device sync behavior.** Firestore handles this natively, but the PRD does not address conflict resolution if the instructor edits on two devices simultaneously. Default Firestore last-write-wins is assumed.

4. **Client photo storage.** Firebase Storage is in the tech stack but client photos are not in v1 scope. The schema should accommodate a `photoUrl` field but the upload flow is deferred.

5. **Session time zones.** Not addressed in the PRD. Assumed: all times stored in UTC, displayed in the device's local timezone. This matters if an instructor travels.

6. **Group class drop-in pricing.** Packages and enrollment are defined, but how drop-in students (added per-session) interact with packages is not fully specified. See `11_Packages_Payments.md`.

## Dependencies

This file has no dependencies. All other files reference this one for project context.
```  
