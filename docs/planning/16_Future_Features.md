▸ Extended thinking (2170 chars)  
```markdown
## Overview

This file catalogs every feature explicitly deferred from v1 across all specification files. Items are grouped by theme and rated by complexity. Nothing here is committed -- this is a backlog for future planning, not a roadmap. The instructor's feedback after using v1 should determine which of these matter most.

## Dependencies

None. This file references the v1 spec files where each deferral originated but has no implementation dependencies.

## Deferred Features

### Payments & Financial Tracking

#### Dollar-Based Payment Tracking
**What**: Track monetary amounts per session and per package (e.g., "$80/session, 10-pack for $700"). Revenue totals, income summaries, and basic financial reporting.
**Why deferred**: v1 validates the core workflow (organizing sessions) without financial complexity. Credit-based tracking was chosen to keep the model simple. See `11_Packages_Payments.md`.
**Complexity**: Medium

#### Package Expiration
**What**: Time-based expiration on packages (e.g., "use within 3 months"). Auto-expire packages past their window, notify the instructor.
**Why deferred**: Adds state management (scheduled checks, expiration warnings) and policy decisions (what happens to unused credits). See `02_Database_Schema.md`.
**Complexity**: Medium

#### Bulk Payment Operations
**What**: Select multiple unpaid sessions and mark them all as paid in one action. Useful when a client pays for several sessions at once.
**Why deferred**: Single-session toggle is sufficient for small volumes. See `11_Packages_Payments.md`.
**Complexity**: Low

#### Per-Class Pricing Tiers
**What**: Different group class types consume different credit amounts (e.g., a premium workshop costs 2 credits). Or separate package types per class.
**Why deferred**: One credit per session regardless of type keeps the model uniform. See `08_Group_Classes.md`.
**Complexity**: Medium

#### Partial Credits
**What**: Half-credit or double-credit sessions based on duration or type.
**Why deferred**: Fractional accounting adds edge cases. One session equals one credit is simple and predictable. See `11_Packages_Payments.md`.
**Complexity**: Low

### Client Features

#### Client-Facing Portal
**What**: Clients log in to view their schedule, book sessions, update their own contact info, or see their payment balance.
**Why deferred**: v1 is an instructor-only tool. A client portal fundamentally changes the auth model, data access patterns, and security rules. This is a major architectural expansion, not an incremental feature.
**Complexity**: High

#### Client Photos
**What**: Upload and display a photo for each client. Stored in Firebase Storage, referenced by URL in the client document.
**Why deferred**: Initials avatars are sufficient for v1. Photo upload adds Storage configuration, image resizing, and upload UI. The `clients` schema already accommodates a `photoUrl` field.
**Complexity**: Low

#### Client Import (CSV)
**What**: Bulk-import clients from a CSV file (name, email, phone, health notes). Useful for instructors migrating from spreadsheets.
**Why deferred**: With 15-40 typical clients, manual entry is feasible for launch. See `06_Client_Management.md`.
**Complexity**: Low

#### Duplicate Client Detection
**What**: Warn when creating a client with a name that matches an existing client. Offer to merge or proceed.
**Why deferred**: Solo instructors with small client bases rarely create duplicates accidentally. See `06_Client_Management.md`.
**Complexity**: Low

#### Full-Text Note Search
**What**: Search across all session notes for keywords (e.g., "hip opener", "modified chaturanga"). Surface matching sessions and clients.
**Why deferred**: Firestore does not support native full-text search. Would require Algolia, Typesense, or a Cloud Function with a search index. See `12_Session_Notes_Prep.md`.
**Complexity**: High

### Scheduling & Calendar

#### Calendar Sync
**What**: Two-way sync with Google Calendar, Apple Calendar, or iCal export. Sessions created in YogaFlow appear on the instructor's external calendar and vice versa.
**Why deferred**: Calendar sync is notoriously complex (conflict resolution, recurring event translation, API quotas). v1 calendar is self-contained. See `10_Calendar_View.md`.
**Complexity**: High

#### Session Overlap Detection
**What**: Warn when creating a session that overlaps with an existing session on the same day.
**Why deferred**: Instructors manage their own time and edge cases (travel, flexible end times) make automated detection more annoying than helpful. See `07_Private_Sessions.md`.
**Complexity**: Medium

#### Drag-to-Reschedule
**What**: Drag a session block on the calendar week view to a new time or day to reschedule it.
**Why deferred**: Drag interactions are difficult on mobile touchscreens. Cancel + recreate workflow is sufficient. See `10_Calendar_View.md`.
**Complexity**: Medium

#### Custom Recurrence Rules
**What**: Support arbitrary patterns beyond weekly/biweekly/monthly: "every 3 weeks", "Mondays and Wednesdays", "first and third Saturday".
**Why deferred**: The three presets cover the vast majority of yoga scheduling patterns. The backend (RRuleJS) already supports arbitrary rules -- only the UI needs expansion. See `09_Recurring_Sessions.md`.
**Complexity**: Low

#### Saved Locations
**What**: A reusable list of locations (studios, client homes) that auto-complete when entering a session location, instead of free-text every time.
**Why deferred**: Free-text location is functional. Instructors who teach at the same 2-3 places can use phone autocomplete from prior entries. See `07_Private_Sessions.md`.
**Complexity**: Low

### Data & Reporting

#### Data Export (CSV)
**What**: Export client list and/or payment history as CSV files for use in spreadsheets or tax preparation.
**Why deferred**: No reporting or export needs identified for v1. Explicitly deferred in Step 4. See `00_README.md`.
**Complexity**: Low

#### Weekly/Monthly Summary Dashboard
**What**: A summary screen showing total sessions taught, payment totals (credits or dollars), and trends over time.
**Why deferred**: Step 12 asked about this but the answer was not definitively captured. Assumed deferred for v1 simplicity.
**Complexity**: Medium

#### Session Analytics
**What**: Insights like busiest days, most-taught clients, cancellation rates, average sessions per week.
**Why deferred**: Analytics are valuable but not core to the organizing workflow. GA4 (already integrated via Firebase) provides basic usage data in the meantime. See `00_README.md`.
**Complexity**: Medium

### Notifications & Communication

#### Appointment Reminders
**What**: Push notification to the instructor before an upcoming session (e.g., 30 minutes before). Optionally, send a reminder to the client via SMS or email.
**Why deferred**: v1 notifications only cover post-session note reminders. Pre-session reminders are useful but client-facing messages introduce communication complexity. See `15_Notifications.md`.
**Complexity**: Medium (instructor only), High (client-facing)

#### SMS/Email Notification Fallback
**What**: Send note reminders or other notifications via SMS or email when push notifications are unavailable.
**Why deferred**: Adds Twilio or SendGrid dependency, cost per message, and phone number verification. See `15_Notifications.md`.
**Complexity**: Medium

#### Cancellation Policy Enforcement
**What**: Define a cancellation policy (e.g., "24-hour notice required") and automatically charge a credit or flag late cancellations.
**Why deferred**: Policy enforcement is a business logic decision that varies per instructor. v1 always refunds on cancel. See `13_Cancellations_Rescheduling.md`.
**Complexity**: Medium

### Group Classes

#### Waitlist
**What**: When a class hits capacity, additional students join a waitlist. Auto-enroll from waitlist when a spot opens (cancellation or roster removal).
**Why deferred**: Capacity enforcement is in v1 but waitlist management adds notification and auto-enrollment logic. See `08_Group_Classes.md`.
**Complexity**: Medium

#### Co-Teaching
**What**: Multiple instructors assigned to a single group class. Shared visibility of attendance and notes.
**Why deferred**: v1 is single-instructor. Multi-instructor access requires shared data ownership and permission changes. See `08_Group_Classes.md`.
**Complexity**: High

### Platform & UX

#### Dark Mode
**What**: A dark color theme that follows system preference or is manually toggled. Useful for instructors teaching in dim studios.
**Why deferred**: The warm light palette was designed to be easy on eyes in low light. Dark mode requires a full second set of color tokens and testing every component. See `04_UI_Design_System.md`.
**Complexity**: Medium

#### Tablet/Landscape Layout
**What**: Responsive layout that uses wider screens effectively -- sidebar navigation, multi-column views, split-pane detail views.
**Why deferred**: Mobile portrait is the primary use case. The max-width constraint keeps the app usable on tablets without a dedicated layout. See `04_UI_Design_System.md`.
**Complexity**: Medium

#### Structured Session Notes
**What**: Optional structured fields alongside free text: intensity level, focus areas (dropdown), poses practiced (tags), client mood.
**Why deferred**: Free text was explicitly chosen for speed. Structure adds taps and decisions that slow down the under-2-minute workflow. See `12_Session_Notes_Prep.md`.
**Complexity**: Low

#### Account Deletion
**What**: Self-service account deletion from within the app. Removes the instructor document, all associated data, and the Firebase Auth account.
**Why deferred**: No app store listing means no regulatory requirement for self-service deletion in v1. May become required for PWA distribution channels. See `01_Auth.md`.
**Complexity**: Medium

#### Multi-Instructor / Team Accounts
**What**: A studio owner account that manages multiple instructor sub-accounts. Shared client database, schedule visibility across instructors, permission roles.
**Why deferred**: Fundamentally changes the data model (shared ownership vs single-tenant). The entire security rule architecture would need reworking. See `01_Auth.md`.
**Complexity**: High

#### Additional Auth Providers
**What**: Apple Sign-In, Facebook Login, or other OAuth providers beyond Google and email/password.
**Why deferred**: Google + email/password covers the target audience. Each additional provider adds configuration and testing. See `01_Auth.md`.
**Complexity**: Low per provider

#### Offline Session Completion
**What**: Allow marking sessions complete while offline, queuing the credit deduction for when connectivity returns.
**Why deferred**: Credit deduction requires a Cloud Function for atomicity. Offline queuing of transactional operations introduces conflict and idempotency concerns. See `14_Offline_PWA.md`.
**Complexity**: High

## Prioritization Guidance

Based on user pain points identified in the PRD, likely highest-impact post-v1 features:

1. **Data export (CSV)** -- Low complexity, immediate value for tax and record-keeping
2. **Client photos** -- Low complexity, improves recognition in client lists
3. **Package expiration** -- Medium complexity, reflects real-world business policies
4. **Saved locations** -- Low complexity, reduces repetitive typing
5. **Custom recurrence** -- Low complexity (UI only), unlocks more scheduling patterns

These five could form a meaningful v1.1 release with moderate effort.

## Gaps & Assumptions

1. **No user research validation.** These priorities are inferred from the PRD process, not from post-launch user feedback. Actual usage patterns may surface entirely different needs.

2. **Complexity ratings are rough estimates.** "Low" means days, "Medium" means weeks, "High" means a significant architecture change. Actual effort depends on implementation specifics.

3. **No timeline or commitment.** This is a backlog, not a roadmap. Features may be reprioritized, combined, or dropped based on real instructor feedback after v1 launch.
```  
