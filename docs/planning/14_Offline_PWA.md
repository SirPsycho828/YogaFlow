```markdown
## Overview

YogaFlow is a PWA (Progressive Web App) that installs on the instructor's phone home screen and works reliably with poor or no connectivity. Offline support is a trust feature -- the instructor needs to believe the app will not lose their data or leave them stranded in a studio basement with no signal. Firebase's built-in offline persistence does the heavy lifting. The PWA shell ensures the app loads instantly regardless of network state.

## Dependencies

- `01_Auth.md` -- Auth persistence across PWA installs and restarts
- `04_UI_Design_System.md` -- Theme colors for PWA manifest, offline indicator styling
- `05_Dashboard_Today_View.md` -- Today view must render from cache, offline indicator placement

## PWA Configuration

### Web App Manifest

File: `public/manifest.json`

| Field | Value | Notes |
|-------|-------|-------|
| `name` | "YogaFlow" | Full name in app drawer |
| `short_name` | "YogaFlow" | Home screen label |
| `description` | "Organize your yoga clients and classes" | |
| `start_url` | "/" | Opens to Today dashboard |
| `display` | "standalone" | No browser chrome |
| `orientation` | "portrait" | Lock to portrait |
| `theme_color` | "#5B7F6E" | Primary sage -- colors the status bar |
| `background_color` | "#FAFAF7" | Warm off-white -- splash screen background |
| `icons` | See below | Multiple sizes for install |

### App Icons

Provide icons at these sizes, all in PNG format:

| Size | Purpose |
|------|---------|
| 192x192 | Standard home screen icon |
| 512x512 | Splash screen, Play Store listing |
| 180x180 | Apple touch icon |
| maskable 192x192 | Adaptive icon for Android (safe zone padding) |
| maskable 512x512 | Adaptive icon large |

Icon design: white logomark (or "YF" lettermark in Inter Bold) on `#5B7F6E` sage green background. The maskable variants need extra padding so the logo isn't cropped by circular or squircle masks.

### HTML Meta Tags

```html
<meta name="theme-color" content="#5B7F6E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
<link rel="manifest" href="/manifest.json">
```

## Service Worker

Use Vite's PWA plugin (`vite-plugin-pwa` with Workbox) to generate the service worker. No hand-written service worker.

### Caching Strategy

| Resource Type | Strategy | Rationale |
|--------------|----------|-----------|
| App shell (HTML, JS, CSS) | Precache (install-time) | Ensures instant load on revisit |
| Google Fonts (Inter) | Cache-first, 30-day expiry | Font rarely changes |
| App icons, static images | Precache | Small payload, always needed |
| Firestore data | Handled by Firebase SDK | Not routed through the service worker |
| Cloud Function calls | Network-only | Cannot be meaningfully cached |

### Precache Manifest

Workbox auto-generates the precache manifest from the Vite build output. All files in the `dist/` directory are precached by default. No manual manifest management needed.

### Update Flow

When a new version is deployed to Firebase Hosting:

1. The service worker detects updated assets on next visit
2. New assets download in the background
3. Show a toast at the bottom of the screen: "Update available" with a "Refresh" button
4. Tapping "Refresh" calls `skipWaiting()` on the new service worker and reloads the page
5. Do not force-reload without user action -- the instructor might be mid-note-entry

Configure `vite-plugin-pwa` with `registerType: 'prompt'` to enable this flow.

## Firestore Offline Persistence

### Enabling Persistence

Enable multi-tab offline persistence during Firestore initialization:

```
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})
```

This is the Firebase v10+ API for persistent cache. It replaces the deprecated `enablePersistence()` call.

### What Offline Persistence Does

- Caches every Firestore document the app reads to IndexedDB
- Queued writes are stored locally and sync when connectivity returns
- Snapshot listeners fire with cached data immediately, then update when the server responds
- The app can read and write as if it's online -- the SDK handles sync transparently

### What It Does Not Do

- It does not cache documents the app has never read. If the instructor has never viewed February's calendar, that data is not available offline.
- It does not run Cloud Functions offline. Operations that require Cloud Functions (`cancelSession`, `createPackage`, `markSessionComplete`, etc.) will fail offline.
- It does not resolve conflicts. Last-write-wins is the default merge strategy.

## Offline Behavior by Feature

| Feature | Offline Capability | Notes |
|---------|-------------------|-------|
| View Today dashboard | Full | If previously loaded while online |
| View session details | Full | Cached from prior access |
| View client list | Full | Cached on first load |
| View client detail | Full | Cached from prior access |
| Add session notes | Queued | Writes to local cache, syncs later |
| Create session | Queued | Document created locally, syncs later |
| Edit session | Queued | Updates cached locally, syncs later |
| Create client | Queued | Same as above |
| Edit client | Queued | Same as above |
| Mark attendance | Queued | Each checkbox write queued independently |
| Mark session complete | Fails | Requires `markSessionComplete` Cloud Function |
| Cancel session | Fails | Requires `cancelSession` Cloud Function |
| Create package | Fails | Requires `createPackage` Cloud Function |
| Toggle payment status | Partial | Manual toggle (direct Firestore write) works. Package credit deduction (Cloud Function) fails. |
| View calendar (new month) | Empty | Data not in cache yet |
| Sign in / sign out | Fails | Requires network |

### Handling Cloud Function Failures Offline

When the instructor attempts a Cloud Function call while offline:

1. The call times out (Firebase callable default timeout: 70 seconds -- too long)
2. Override the timeout to 10 seconds for a faster feedback loop
3. On timeout or network error, show a toast: "You're offline. This action needs a connection."
4. Do not queue the action for retry -- Cloud Functions involve multi-document transactions that should not be blindly retried. The instructor must repeat the action when online.

### Queued Write Indicator

When Firestore has pending writes that haven't synced:

- Show a subtle "Syncing..." label next to the offline indicator in the header
- When all writes sync, the label disappears
- If the app is closed with pending writes, they persist in IndexedDB and sync on next open (with connectivity)

No count of pending writes is shown -- that would create anxiety. Just "syncing" or nothing.

## Offline Indicator

A subtle, non-alarming indicator that appears when the device has no network:

- **Location**: Header bar, right side, next to the date picker trigger (Today view) or view toggle (Calendar)
- **Design**: Small `WifiOff` Lucide icon in `--muted-foreground` color, 16px
- **No text label** by default -- the icon is sufficient. If the instructor taps it, show a tooltip: "You're offline. Changes will sync when you reconnect."
- **Appears/disappears** reactively based on `navigator.onLine` and Firebase's `.info/connected` reference

Use Firebase's connectivity listener for accuracy:

```
onValue(ref(realtimeDb, '.info/connected'), (snap) => {
  const isConnected = snap.val() === true;
});
```

`navigator.onLine` can produce false positives (connected to WiFi but no internet). The Firebase `.info/connected` check confirms actual server reachability. Use both: show offline if either reports disconnected.

Note: `.info/connected` requires Realtime Database, not Firestore. Initialize a minimal Realtime Database connection solely for this connectivity check. No data is stored in Realtime Database.

## Install Prompt

### Android (Chrome)

Chrome shows the native "Add to Home Screen" banner automatically when PWA criteria are met (manifest, service worker, HTTPS). No custom install prompt needed for v1. The banner appears after the instructor visits the app twice with at least 5 minutes between visits.

### iOS (Safari)

Safari does not show an automatic install prompt. Show a one-time, dismissible banner at the bottom of the screen on first visit from iOS Safari:

- Text: "Install YogaFlow: tap the share button, then 'Add to Home Screen'"
- Include a small illustration showing the Safari share icon
- "Dismiss" link to close permanently (store dismissal in localStorage)
- Detect iOS Safari via user agent to conditionally show this banner

### Desktop

No install prompt for desktop. The app works in a browser tab on desktop but is not optimized for that experience.

## Cache Size Management

Firestore's offline cache in IndexedDB can grow over time. Firebase does not automatically prune old data.

For v1, do not implement manual cache management. A solo instructor's data volume (hundreds of sessions, tens of clients) is well within IndexedDB limits (typically 50-100MB+ depending on browser). If cache size becomes an issue at scale, Firestore's `clearIndexedDbPersistence()` can be called as a nuclear option from a settings screen.

## Gaps & Assumptions

1. **No background sync for Cloud Functions.** Actions that require Cloud Functions simply fail offline. The instructor must retry when online. A background sync queue for these operations would add significant complexity (idempotency, conflict resolution, UI state reconciliation) and is deferred.

2. **No offline-first session completion.** Marking a session complete requires a Cloud Function (for credit deduction). If the instructor finishes a session without connectivity, they can add notes (queued write) but cannot mark it complete until online. This is the most notable offline gap.

3. **Realtime Database dependency for connectivity.** Using `.info/connected` requires initializing Realtime Database alongside Firestore. This adds a small amount of setup but no data storage. The Realtime Database free tier covers this trivially.

4. **No push notification while offline.** Push notifications (see `15_Notifications.md`) require the Firebase Cloud Messaging service, which depends on connectivity. If the instructor is offline when a notification should fire, it will not arrive. The in-app "Add Notes" button on session cards is the fallback.

5. **IndexedDB quota on iOS.** Safari's IndexedDB quota is more restrictive than Chrome's (~1GB vs ~device-dependent). For a solo instructor's data, this is not a concern, but large health notes or many sessions could eventually approach limits on older iOS devices.

6. **Multi-tab behavior.** `persistentMultipleTabManager()` enables multiple browser tabs to share the same offline cache. This prevents data corruption if the instructor has the app open in two tabs. In PWA standalone mode, only one instance runs, so this is mainly a development convenience.
```  
