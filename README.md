<div align="center">

# YogaFlow

**A mobile-first PWA for yoga instructors to manage clients, sessions, and payments**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

</div>

---

## Overview

YogaFlow is a progressive web app built for solo yoga instructors who want to run their practice without the chaos of scattered notebooks and spreadsheets. It provides a single place to track clients, schedule private and group sessions, manage class packages, and collect payments — all from a mobile device, even when offline.

---

## Features

<table>
  <tr>
    <td><strong>Client Management</strong><br/>Store contact info, health notes, and full session history per client.</td>
    <td><strong>Private Sessions</strong><br/>Create, edit, and mark one-on-one sessions complete with notes.</td>
    <td><strong>Group Classes</strong><br/>Manage class rosters, track attendance, and enforce capacity limits.</td>
  </tr>
  <tr>
    <td><strong>Recurring Sessions</strong><br/>Schedule weekly, biweekly, and monthly repeating sessions powered by RRuleJS.</td>
    <td><strong>Calendar View</strong><br/>Month and week views with session dots and duration bars for quick scanning.</td>
    <td><strong>Packages &amp; Payments</strong><br/>Sell credit-based packages; credits auto-deduct when sessions are completed.</td>
  </tr>
  <tr>
    <td><strong>Session Notes &amp; Prep</strong><br/>Add post-session notes and review pre-session prep before each appointment.</td>
    <td><strong>Push Notifications</strong><br/>FCM-powered reminders prompt instructors to add notes after sessions.</td>
    <td><strong>Offline Support</strong><br/>Firestore persistence and PWA install keep the app fully usable offline.</td>
  </tr>
</table>

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Firebase (Auth, Firestore, Cloud Functions v2, Hosting, Cloud Messaging) |
| Scheduling | RRuleJS |
| Monitoring | Sentry |

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # AppLayout, BottomNav, ProtectedRoute
│   ├── notifications/ # NotificationPrompt
│   ├── payments/      # PackageCreateSheet, PaymentSummary
│   ├── pwa/           # UpdatePrompt, IOSInstallBanner
│   ├── sessions/      # SessionCard, DatePicker, TimePicker, etc.
│   ├── shared/        # InitialsAvatar, EmptyState
│   └── ui/            # shadcn/ui components
├── contexts/          # AuthContext
├── hooks/             # useAuth, useCallable, useOnlineStatus
├── lib/               # firebase, messaging, rrule, utils
├── pages/             # All page components
└── types/             # TypeScript interfaces
functions/
└── src/               # Cloud Functions (create, cancel, deduct, triggers)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

### Install

```bash
# Install root dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### Environment Setup

Copy the example env file and fill in your Firebase project config:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_VAPID_KEY` | FCM VAPID key for push notifications |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) |

### Development

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Build

```bash
npm run build
```

### Deploy

```bash
firebase deploy
```

To deploy only hosting or only functions:

```bash
firebase deploy --only hosting
firebase deploy --only functions
```

---

## License

[MIT](LICENSE)
