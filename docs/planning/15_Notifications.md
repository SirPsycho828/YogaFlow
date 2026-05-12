▸ Extended thinking (1237 chars)  
```markdown
## Overview

YogaFlow v1 has a single notification type: a reminder to add post-session notes, fired 5 minutes after a session's scheduled end time. This is the nudge half of the notes capture system -- the in-app "Add Notes" button on completed session cards is the fallback. Notifications use Firebase Cloud Messaging (FCM) and are scheduled by a Cloud Function.

The goal is not to build a notification platform. It is to solve one problem: the instructor finishes a session, gets distracted packing up or greeting the next client, and forgets to jot down notes. A single well-timed push notification fixes this.

## Dependencies

- `02_Database_Schema.md` -- `sessions` collection (endTime, status, notes fields), `instructors` collection (FCM token storage)
- `03_API_Endpoints.md` -- Scheduled function or Firestore trigger to send notifications
- `05_Dashboard_Today_View.md` -- "Add Notes" button as the in-app fallback
- `12_Session_Notes_Prep.md` -- Notes entry sheet is the deep-link target
- `14_Offline_PWA.md` -- Notifications require connectivity; service worker receives push events

## Firebase Cloud Messaging Setup

### Client-Side Registration

On app startup, after the instructor signs in:

1. Check if the browser supports notifications: `'Notification' in window && 'serviceWorker' in navigator`
2. If supported and permission not yet requested, show nothing on first session. Wait until after the instructor has used the app at least once (see Permission Flow below).
3. When permission is granted, call `getToken()` from the Firebase Messaging SDK
4. Store the FCM token on the instructor's document: `instructors/{uid}.fcmToken`
5. Subscribe to `onMessage()` for foreground notification handling

### Service Worker Integration

FCM requires a service worker to receive push events when the app is in the background (closed or not in focus). Since the app already uses a service worker for PWA caching (see `14_Offline_PWA.md`), integrate FCM handling into the same worker.

Add to the existing service worker (via `vite-plugin-pwa` custom service worker injection):

- Import Firebase Messaging's `firebase-messaging-sw.js` compat scripts
- Handle `onBackgroundMessage` to display the notification when the app is not in foreground

### Token Refresh

FCM tokens can rotate. Subscribe to `onTokenRefresh` (or check on each app open) and update `instructors/{uid}.fcmToken` when the token changes. If the token becomes invalid, FCM silently fails to deliver -- no error surfaces to the user. The in-app button remains the reliable fallback.

## Permission Flow

### Timing

Do not request notification permission on first app open. The instructor has no context for why the app wants to send notifications, and an immediate permission prompt has high denial rates.

**Trigger the permission request after the instructor's first completed session:**

1. Instructor marks a session as complete (via `markSessionComplete`)
2. After the completion toast, show a brief prompt card at the bottom of the screen (not a browser permission dialog yet):
   - "Get a reminder to add notes after each session?"
   - Two buttons: "Enable Reminders" and "Not Now"
3. If "Enable Reminders": trigger the browser's native notification permission dialog
4. If "Not Now": dismiss and don't ask again for 7 days. Store the dismissal timestamp in localStorage.
5. If the browser permission is denied: respect it. Show a note in Settings that notifications are blocked, with instructions to enable them in browser settings.

### Permission States

| State | Behavior |
|-------|----------|
| `default` (not yet asked) | Show the in-app prompt after first session completion |
| `granted` | Register FCM token, send notifications normally |
| `denied` | No notifications. In-app "Add Notes" button is the only reminder. Show a settings note. |

### Settings Toggle

In the Settings screen (bottom nav), include a "Session Reminders" toggle:

- Visible only when browser permission is `granted`
- Toggle controls whether the app sends notification requests, not the browser permission itself
- Off state: set `instructors/{uid}.notificationsEnabled` to `false`. The Cloud Function checks this before sending.
- Default: `true` when permission is granted

## Scheduling Notifications

### Approach: Cloud Scheduler + Cloud Function

A single scheduled Cloud Function runs every 5 minutes and finds sessions that need a notes reminder.

**Function: `sendNoteReminders`**

**Schedule**: Every 5 minutes (`*/5 * * * *`)

**Logic:**

1. Calculate the target window: sessions with `endTime` between 5 and 10 minutes ago (matching the function's 5-minute interval to avoid duplicates)
2. Query sessions:
   ```
   sessions
     .where('status', '==', 'completed')
     .where('notes', '==', '')
     .where('date', '==', today)
   ```
3. Filter client-side: check if the session's `endTime` falls within the 5-minute target window (endTime is stored as HH:mm string, so parse and compare against current time)
4. For each matching session:
   - Look up the instructor's `fcmToken` and `notificationsEnabled` from the `instructors` document
   - If token exists and notifications enabled, send the push notification
   - Mark the session with `reminderSent: true` to prevent duplicate sends on subsequent runs

**Why not Firestore trigger?** A trigger on session completion could schedule a delayed notification via Cloud Tasks, but that adds another Firebase service. The polling approach is simpler: one scheduled function, no additional infrastructure.

### Handling Time Parsing

Session `endTime` is stored as "HH:mm" in the instructor's local time, but the Cloud Function runs in UTC. The function needs the instructor's timezone to correctly calculate "5 minutes after end time."

**Solution**: Store a `timezone` field on the instructor document (e.g., "America/New_York"). Set it automatically from the browser on first sign-in using `Intl.DateTimeFormat().resolvedOptions().timeZone`. Update it if the browser reports a different timezone on subsequent opens.

If `timezone` is not set (edge case), skip the notification for that instructor. The in-app button still works.

## Notification Content

### Background Notification (App Closed or Not in Focus)

| Field | Value |
|-------|-------|
| Title | "How did it go?" |
| Body | "[Client Name] session ended 5 minutes ago" (private) or "[Class Name] ended 5 minutes ago" (group) |
| Icon | App icon (192x192) |
| Badge | App icon (small monochrome for Android status bar) |
| Click action | Deep-link to notes entry for this session |
| Tag | `notes-{sessionId}` -- prevents duplicate notifications for the same session |

### Foreground Notification (App Is Open)

When the app is in the foreground, do not show a system notification. Instead, show an in-app toast:

- "Time to add notes for [Client/Class Name]"
- Toast includes a "Add Notes" action button that opens the notes sheet directly
- Duration: 8 seconds (longer than standard toasts since this is a call to action)

## Deep-Linking

When the instructor taps a background notification:

1. The PWA opens (or focuses if already open)
2. Navigate to the Today dashboard
3. Scroll to the relevant session card
4. Automatically open the notes entry sheet for that session

**Implementation**: The notification payload includes `sessionId`. The app's notification click handler reads this ID, navigates to Today, and triggers the notes sheet.

**URL scheme**: Use a query parameter approach: `/?action=addNotes&sessionId=abc123`. The Today dashboard component checks for this parameter on mount, fetches the session, and opens the notes sheet.

## Edge Cases

### Multiple Sessions Ending Near the Same Time

If two sessions have similar end times (e.g., a private session at 10:00 and a group class at 10:15), two separate notifications fire at their respective 5-minute marks. Each has a unique `tag` so they stack rather than replace each other.

### Session Already Has Notes

The scheduled function checks `notes == ''` before sending. If the instructor already added notes (via the in-app button) before the 5-minute mark, no notification fires.

### Session Not Marked Complete

The function filters for `status == 'completed'`. If the instructor hasn't marked the session complete, no notification fires. This is intentional -- the instructor may still be in the session, and a premature reminder would be disruptive.

However, this creates a gap: if the instructor finishes a session and forgets to mark it complete and forgets to add notes, no reminder fires. The in-app "Add Notes" button on the Today view is the safety net -- it appears on sessions past their end time regardless of completion status.

### Instructor in Different Timezone Than Usual

If the instructor travels and their browser reports a new timezone, the `timezone` field updates on next app open. Notifications for existing sessions (created with the old timezone's times) may fire at the wrong real-world moment. This is an acceptable edge case for v1 -- the instructor is unlikely to be teaching regular sessions while traveling.

### Notification Permission Revoked

If the instructor revokes notification permission in browser settings, FCM token becomes invalid. The next `sendNoteReminders` call receives an error from FCM. On receiving a `messaging/registration-token-not-registered` error, clear the `fcmToken` field on the instructor document. The in-app prompt will not reappear (browser permission is `denied`), and the Settings screen shows guidance on re-enabling.

## iOS Limitations

Push notifications for PWAs on iOS require:

- iOS 16.4 or later
- The app must be installed to the home screen (not just opened in Safari)
- The user must grant permission after install

These are platform constraints, not app bugs. The install banner (see `14_Offline_PWA.md`) guides the instructor to install the PWA. If the instructor uses the app in Safari without installing, push notifications will not work -- the in-app "Add Notes" button is the only reminder.

## Gaps & Assumptions

1. **Single notification type.** v1 only sends post-session note reminders. No appointment reminders, no payment due alerts, no schedule change notifications. Additional notification types are deferred to `16_Future_Features.md`.

2. **No notification history.** There is no in-app list of past notifications. Notifications are ephemeral -- tap them or they disappear.

3. **5-minute delay is fixed.** The reminder always fires 5 minutes after session end time. Not configurable by the instructor. 5 minutes is a reasonable default -- enough time to wrap up, soon enough that details are fresh.

4. **No SMS or email fallback.** If push notifications are not available (permission denied, iOS Safari, old browser), the instructor relies entirely on the in-app button. No alternative delivery channel in v1.

5. **Cloud Function cold starts.** The `sendNoteReminders` function runs every 5 minutes. It may cold start each time if there is no sustained traffic. This adds 1-3 seconds of latency to notification delivery, which is acceptable -- the notification is already delayed by 5 minutes.

6. **Timezone field added to instructor schema.** This field (`timezone`: string, e.g., "America/Chicago") is not in the original schema in `02_Database_Schema.md`. It should be added to the `instructors` collection. Auto-set from the browser, not user-editable.
```  
