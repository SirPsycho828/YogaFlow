# YogaFlow MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for yoga instructors to manage clients, sessions, payments, and notes — replacing scattered notebooks and spreadsheets.

**Architecture:** Single-tenant Firestore app with Firebase Auth. Client reads/writes Firestore directly for simple CRUD; Cloud Functions handle multi-document transactions (credit deduction, cascading deletes, recurrence generation). PWA with offline-first via Firestore persistence.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Firebase (Auth, Firestore, Functions, Hosting, Cloud Messaging), RRuleJS, TanStack Table, Sentry

---

## Phase 1: Project Foundation

### Task 1: Initialize Project with Vite + React 19 + TypeScript

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `eslint.config.js`

- [ ] **Step 1: Create Vite project**

Run:
```bash
cd /c/Users/steve/OneDrive/Documents/Repos/YogaFlow
npm create vite@latest . -- --template react-ts
```

Expected: Project scaffolded with React 19 + TypeScript

- [ ] **Step 2: Install core dependencies**

```bash
npm install firebase rrule @tanstack/react-table react-router-dom sonner lucide-react date-fns
npm install -D tailwindcss @tailwindcss/vite autoprefixer
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

Select: TypeScript, Tailwind CSS, default style, base color "neutral", CSS variables yes, `src/components/ui` path, import alias `@/`.

- [ ] **Step 4: Configure Vite with Tailwind 4**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Create .env.example**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_SENTRY_DSN=
```

- [ ] **Step 6: Set up .gitignore**

Ensure node_modules, dist, .env, .env.local are excluded.

- [ ] **Step 7: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: initialize Vite + React 19 + TypeScript project"
```

---

### Task 2: Configure Tailwind Theme and Design System

**Files:**
- Create: `src/index.css`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Configure globals.css with YogaFlow theme**

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-lg: 8px;
  --radius-md: 6px;
  --radius-sm: 4px;
}

@layer base {
  :root {
    --background: 60 20% 97%;
    --foreground: 30 8% 16%;
    --card: 0 0% 100%;
    --card-foreground: 30 8% 16%;
    --primary: 152 16% 43%;
    --primary-foreground: 0 0% 100%;
    --secondary: 30 14% 93%;
    --secondary-foreground: 30 6% 33%;
    --muted: 30 14% 93%;
    --muted-foreground: 30 5% 52%;
    --accent: 28 45% 83%;
    --accent-foreground: 30 6% 33%;
    --destructive: 4 44% 54%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 14% 88%;
    --input: 30 14% 88%;
    --ring: 152 16% 43%;

    --status-paid: 152 16% 43%;
    --status-unpaid: 4 44% 54%;
    --status-cancelled: 30 5% 52%;
    --status-scheduled: 214 35% 60%;
    --status-completed: 152 16% 43%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}
```

- [ ] **Step 2: Add Inter font to index.html**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Create utility helper**

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Verify the dev server runs**

```bash
npm run dev
```

Expected: App renders at localhost:5173 with warm off-white background.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: configure Tailwind 4 theme with YogaFlow design system"
```

---

### Task 3: Firebase Configuration

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`

- [ ] **Step 1: Install Firebase CLI and initialize**

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select: Firestore, Functions (TypeScript), Hosting (dist directory), Emulators.

- [ ] **Step 2: Create Firebase client config**

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export const rtdb = getDatabase(app)

export default app
```

- [ ] **Step 3: Write Firestore security rules**

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /instructors/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /clients/{clientId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }

    match /sessions/{sessionId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }

    match /groupClasses/{classId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }

    match /attendance/{attendanceId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }

    match /series/{seriesId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }

    match /packages/{packageId} {
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
      allow read, update, delete: if request.auth != null
        && resource.data.instructorId == request.auth.uid;
    }
  }
}
```

- [ ] **Step 4: Create Firestore indexes configuration**

```json
{
  "indexes": [
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "seriesId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "packages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instructorId", "order": "ASCENDING" },
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: configure Firebase with Firestore, security rules, and indexes"
```

---

### Task 4: TypeScript Types and Data Models

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Define all data model interfaces**

```typescript
// src/types/index.ts
import { Timestamp } from 'firebase/firestore'

export interface Instructor {
  uid: string
  email: string
  displayName: string
  onboardingComplete: boolean
  fcmToken?: string
  notificationsEnabled?: boolean
  timezone?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Client {
  id: string
  instructorId: string
  name: string
  email: string
  phone: string
  healthNotes: string
  status: 'active' | 'archived'
  unpaidCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Session {
  id: string
  instructorId: string
  type: 'private' | 'group'
  clientId: string | null
  groupClassId: string | null
  title: string
  date: Timestamp
  startTime: string // HH:mm
  endTime: string // HH:mm
  location: string
  status: 'scheduled' | 'completed' | 'cancelled'
  paymentStatus: 'paid' | 'unpaid'
  notes: string
  seriesId: string | null
  isException: boolean
  cancelledAt: Timestamp | null
  reminderSent?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface GroupClass {
  id: string
  instructorId: string
  name: string
  maxCapacity: number
  defaultRoster: string[]
  location: string
  seriesId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Attendance {
  id: string
  instructorId: string
  sessionId: string
  clientId: string
  attended: boolean
  paymentStatus: 'paid' | 'unpaid'
  createdAt: Timestamp
}

export interface Series {
  id: string
  instructorId: string
  rrule: string
  type: 'private' | 'group'
  linkedId: string
  sessionDefaults: {
    title: string
    startTime: string
    endTime: string
    location?: string
  }
  generatedUntil: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Package {
  id: string
  instructorId: string
  clientId: string
  type: 'private' | 'group'
  totalCredits: number
  remainingCredits: number
  status: 'active' | 'depleted'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: define TypeScript interfaces for all data models"
```

---

### Task 5: Authentication Context and Provider

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create auth context with Firebase listener**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  linkWithCredential,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Instructor } from '@/types'

interface AuthContextType {
  user: User | null
  instructor: Instructor | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

const googleProvider = new GoogleAuthProvider()

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const instructorDoc = await getDoc(doc(db, 'instructors', firebaseUser.uid))
        if (instructorDoc.exists()) {
          setInstructor({ uid: instructorDoc.id, ...instructorDoc.data() } as Instructor)
        } else {
          // First sign-in — create instructor document
          const newInstructor = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            onboardingComplete: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
          await setDoc(doc(db, 'instructors', firebaseUser.uid), newInstructor)
          setInstructor({ ...newInstructor, id: firebaseUser.uid } as unknown as Instructor)
        }
      } else {
        setInstructor(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      setError(null)
      if (isMobile()) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        await signInWithPopup(auth, googleProvider)
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code))
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code))
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(user)
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code))
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code))
    }
  }

  const resendVerification = async () => {
    if (user) await sendEmailVerification(user)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setInstructor(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        instructor,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        resendVerification,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists. Try signing in with a different method.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups for this site or try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    default:
      return 'An error occurred. Please try again.'
  }
}
```

- [ ] **Step 2: Create useAuth hook**

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: implement Firebase auth context with Google and email sign-in"
```

---

### Task 6: Router and Layout Shell

**Files:**
- Create: `src/components/layout/AppLayout.tsx`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/ProtectedRoute.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/SignUpPage.tsx`
- Create: `src/pages/ResetPasswordPage.tsx`
- Create: `src/pages/OnboardingPage.tsx`
- Create: `src/pages/TodayPage.tsx` (placeholder)
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create ProtectedRoute component**

```typescript
// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, instructor, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">YogaFlow</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (instructor && !instructor.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
```

- [ ] **Step 2: Create BottomNav**

```typescript
// src/components/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom'
import { CalendarCheck, Calendar, Users, UsersRound, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: CalendarCheck, label: 'Today' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/classes', icon: UsersRound, label: 'Classes' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Create AppLayout**

```typescript
// src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="mx-auto max-w-lg px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Create Login page**

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await signInWithEmail(email, password)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">YogaFlow</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize your yoga practice</p>
        </div>

        <Button
          variant="outline"
          className="w-full h-11"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/reset-password" className="text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-foreground hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create SignUp page**

```typescript
// src/pages/SignUpPage.tsx
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignUpPage() {
  const { user, signInWithGoogle, signUpWithEmail, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    setLocalError('')
    setSubmitting(true)
    await signUpWithEmail(email, password)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get started with YogaFlow</p>
        </div>

        <Button variant="outline" className="w-full h-11" onClick={signInWithGoogle}>
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          {(error || localError) && <p className="text-xs text-destructive">{error || localError}</p>}

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create ResetPassword page**

```typescript
// src/pages/ResetPasswordPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordPage() {
  const { resetPassword, error } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    await resetPassword(email)
    if (!error) setSent(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm">Check your email for a reset link.</p>
            <Link to="/login" className="text-sm text-primary hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-11">Send Reset Link</Button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create Onboarding page**

```typescript
// src/pages/OnboardingPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function OnboardingPage() {
  const { user, instructor } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(instructor?.displayName || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !displayName.trim()) return
    setSubmitting(true)
    await updateDoc(doc(db, 'instructors', user.uid), {
      displayName: displayName.trim(),
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Welcome to YogaFlow</h1>
          <p className="mt-1 text-sm text-muted-foreground">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Sarah"
              required
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={submitting || !displayName.trim()}>
            {submitting ? 'Getting started...' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Wire up router in App.tsx**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { TodayPage } from '@/pages/TodayPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<TodayPage />} />
            {/* Additional routes added in later tasks */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-center" />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 9: Create placeholder TodayPage**

```typescript
// src/pages/TodayPage.tsx
export function TodayPage() {
  return (
    <div className="pt-6">
      <h1 className="text-xl font-semibold">Today</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dashboard coming soon</p>
    </div>
  )
}
```

- [ ] **Step 10: Update main.tsx**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Install needed shadcn components**

```bash
npx shadcn@latest add button input label alert-dialog sheet calendar dropdown-menu popover sonner
```

- [ ] **Step 12: Verify app loads and routes work**

```bash
npm run dev
```

Navigate to localhost:5173 — should see login page.

- [ ] **Step 13: Commit**

```bash
git add .
git commit -m "feat: implement auth pages, routing, and app layout shell"
```

---

## Phase 2: Core Data Entry

### Task 7: Client Management — List and Create

**Files:**
- Create: `src/pages/ClientsPage.tsx`
- Create: `src/pages/ClientCreatePage.tsx`
- Create: `src/components/clients/ClientRow.tsx`
- Create: `src/components/shared/InitialsAvatar.tsx`
- Create: `src/components/shared/EmptyState.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create InitialsAvatar shared component**

```typescript
// src/components/shared/InitialsAvatar.tsx
import { cn } from '@/lib/utils'

interface InitialsAvatarProps {
  name: string
  className?: string
}

export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.[0] || '?'

  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground', className)}>
      {initials.toUpperCase()}
    </div>
  )
}
```

- [ ] **Step 2: Create EmptyState shared component**

```typescript
// src/components/shared/EmptyState.tsx
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-medium">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create ClientRow component**

```typescript
// src/components/clients/ClientRow.tsx
import { Link } from 'react-router-dom'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import type { Client } from '@/types'

interface ClientRowProps {
  client: Client
}

export function ClientRow({ client }: ClientRowProps) {
  return (
    <Link
      to={`/clients/${client.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/50"
    >
      <InitialsAvatar name={client.name} />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate">{client.name}</p>
        {(client.phone || client.email) && (
          <p className="text-xs text-muted-foreground truncate">
            {client.phone || client.email}
          </p>
        )}
      </div>
      {client.unpaidCount > 0 && (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          {client.unpaidCount} unpaid
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 4: Create ClientsPage with search**

```typescript
// src/pages/ClientsPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ClientRow } from '@/components/clients/ClientRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserPlus, Search } from 'lucide-react'
import type { Client } from '@/types'

export function ClientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', showArchived ? 'archived' : 'active'),
      orderBy('name')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client))
      setClients(data)
      setLoading(false)
    })
    return unsubscribe
  }, [user, showArchived])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const lower = searchQuery.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(lower))
  }, [clients, searchQuery])

  if (loading) {
    return (
      <div className="pt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button size="sm" onClick={() => navigate('/clients/new')}>Add Client</Button>
      </div>

      {clients.length > 0 && (
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <p className="mt-1 text-xs text-muted-foreground">{filtered.length} results</p>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && clients.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            heading="No clients yet"
            description="Add your first client to start organizing your sessions."
            actionLabel="Add Client"
            onAction={() => navigate('/clients/new')}
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No clients match "{searchQuery}".{' '}
            <button onClick={() => setSearchQuery('')} className="text-primary hover:underline">Clear search</button>
          </p>
        ) : (
          filtered.map((client) => <ClientRow key={client.id} client={client} />)
        )}
      </div>

      <button
        onClick={() => setShowArchived(!showArchived)}
        className="mt-4 text-xs text-muted-foreground hover:text-foreground"
      >
        {showArchived ? 'Show active' : 'Show archived'}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create ClientCreatePage**

```typescript
// src/pages/ClientCreatePage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ClientCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [healthNotes, setHealthNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSubmitting(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        instructorId: user.uid,
        name: name.trim(),
        phone,
        email,
        healthNotes,
        status: 'active',
        unpaidCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Client added')
      navigate(`/clients/${docRef.id}`)
    } catch {
      toast.error('Could not save. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-6">
      <h1 className="text-xl font-semibold">Add Client</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="healthNotes">Health Notes</Label>
          <Textarea
            id="healthNotes"
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Injuries, conditions, preferences..."
            rows={4}
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={submitting || !name.trim()}>
          {submitting ? 'Adding...' : 'Add Client'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Add shadcn textarea component**

```bash
npx shadcn@latest add textarea
```

- [ ] **Step 7: Add routes to App.tsx**

Add inside the `AppLayout` route:
```typescript
<Route path="/clients" element={<ClientsPage />} />
<Route path="/clients/new" element={<ClientCreatePage />} />
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: implement client list, search, and create flow"
```

---

### Task 8: Client Detail, Edit, Archive, and Delete

**Files:**
- Create: `src/pages/ClientDetailPage.tsx`
- Create: `src/pages/ClientEditPage.tsx`
- Modify: `src/App.tsx` (add routes)

- [ ] **Step 1: Create ClientDetailPage**

Full client detail with contact info, health notes, payment summary (placeholder), session history (placeholder), and archive/delete actions. Uses AlertDialog for confirmation flows.

- [ ] **Step 2: Create ClientEditPage**

Same form as create, pre-populated. Writes only changed fields + `updatedAt`.

- [ ] **Step 3: Implement archive flow**

AlertDialog confirmation, sets `status: 'archived'`, navigates back, toast.

- [ ] **Step 4: Implement delete flow**

AlertDialog with destructive styling. Calls `deleteClient` Cloud Function (placeholder — wired in Task 17). For now, perform a simple client document delete.

- [ ] **Step 5: Add routes and commit**

```bash
git add .
git commit -m "feat: implement client detail, edit, archive, and delete"
```

---

### Task 9: Private Session — Create Form

**Files:**
- Create: `src/pages/SessionCreatePage.tsx`
- Create: `src/components/sessions/ClientPicker.tsx`
- Create: `src/components/sessions/TimePicker.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create ClientPicker component**

Searchable dropdown filtering active clients. Returns selected clientId and name.

- [ ] **Step 2: Create TimePicker component**

Input that constrains to 15-minute intervals (HH:mm format). Auto-calculates end time as start + 60 min.

- [ ] **Step 3: Create SessionCreatePage**

Form with: client picker, date picker, start time, end time, location text input, recurring toggle (basic UI only — recurring creation wired in Task 14).

Non-recurring submit: creates a single `sessions` document with `type: 'private'`, `status: 'scheduled'`, `paymentStatus: 'unpaid'`.

- [ ] **Step 4: Add route and commit**

```bash
git add .
git commit -m "feat: implement private session creation form"
```

---

### Task 10: Session Detail View and Mark Complete

**Files:**
- Create: `src/pages/SessionDetailPage.tsx`
- Create: `src/components/sessions/SessionCard.tsx`
- Create: `src/components/sessions/StatusBadge.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create StatusBadge component**

Small pill badge colored by session status (scheduled=blue, completed=green, cancelled=gray).

- [ ] **Step 2: Create SessionCard component**

Horizontal card with time left, details right. Used on Today, Calendar, and history views. Tappable (Link to detail).

- [ ] **Step 3: Create SessionDetailPage**

Full detail: client name, date/time, location, status + payment badges, health notes preview, session notes, and context-dependent actions (Mark Complete, Cancel, Add Notes).

- [ ] **Step 4: Implement Mark Complete**

For now (pre-Cloud Functions), directly update `status: 'completed'` on the session document. Will be upgraded to Cloud Function call in Task 17.

- [ ] **Step 5: Add route and commit**

```bash
git add .
git commit -m "feat: implement session detail view and mark complete"
```

---

### Task 11: Session Edit

**Files:**
- Create: `src/pages/SessionEditPage.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create SessionEditPage**

Same form as creation, pre-filled. Only allows editing: client, date, start/end time, location. Shows recurring series prompt (wired in Task 14).

- [ ] **Step 2: Add route and commit**

```bash
git add .
git commit -m "feat: implement session edit form"
```

---

## Phase 3: Group Classes

### Task 12: Group Class Management

**Files:**
- Create: `src/pages/ClassesPage.tsx`
- Create: `src/pages/ClassCreatePage.tsx`
- Create: `src/pages/ClassDetailPage.tsx`
- Create: `src/components/classes/RosterManager.tsx`
- Create: `src/pages/GroupSessionPage.tsx`
- Modify: `src/App.tsx` (add routes)

- [ ] **Step 1: Create ClassesPage**

List of group class definitions: name, student count / capacity, location, next session date. Empty state with UsersRound icon.

- [ ] **Step 2: Create ClassCreatePage**

Form: class name, max capacity, default roster (client multi-select), location, date, start/end time, recurring toggle.

Submit creates `groupClasses` document + single `sessions` document (type: 'group') + attendance records for each roster member.

- [ ] **Step 3: Create RosterManager component**

Displays enrolled students with remove buttons. "Add Student" button with client picker (respects capacity). Used on class detail and class edit.

- [ ] **Step 4: Create ClassDetailPage**

Header, info section, default roster, upcoming sessions (next 3), cancel class action.

- [ ] **Step 5: Create GroupSessionPage (attendance screen)**

Roster with large checkboxes for attendance, payment badges per student, "Add Drop-in" button, summary bar, "Mark Complete" button.

- [ ] **Step 6: Add routes and commit**

```bash
git add .
git commit -m "feat: implement group class CRUD and attendance tracking"
```

---

## Phase 4: Recurrence

### Task 13: Recurrence UI Components

**Files:**
- Create: `src/components/sessions/RecurrenceConfig.tsx`

- [ ] **Step 1: Create RecurrenceConfig component**

Toggle + frequency dropdown (weekly, biweekly, monthly) + end condition (no end / until date). Returns an object `{ enabled: boolean, frequency: string, until?: Date }`.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add recurrence configuration UI component"
```

---

### Task 14: Recurring Series Cloud Function Wiring

**Files:**
- Create: `functions/src/index.ts`
- Create: `functions/src/createRecurringSeries.ts`
- Create: `functions/src/editRecurringSeries.ts`
- Create: `functions/src/deleteRecurringSeries.ts`
- Create: `functions/src/extendRecurringSeries.ts`
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`

- [ ] **Step 1: Initialize functions directory**

```bash
cd functions
npm install firebase-admin firebase-functions rrule
npm install -D typescript
```

- [ ] **Step 2: Implement createRecurringSeries**

Callable function: creates `series` document, parses RRULE with rrule library, generates session instances for 4 weeks, batch-writes sessions + attendance records for group.

- [ ] **Step 3: Implement editRecurringSeries**

Handles `single` (mark as exception) and `future` (update sessionDefaults, delete/regenerate future instances).

- [ ] **Step 4: Implement deleteRecurringSeries**

Handles `single`, `future`, `all` modes. Cancels sessions, refunds credits, deactivates series.

- [ ] **Step 5: Implement extendRecurringSeries**

Scheduled function (daily 2AM UTC). Queries series where `generatedUntil < now + 28 days`, generates new instances.

- [ ] **Step 6: Wire recurrence into session creation forms**

Update SessionCreatePage and ClassCreatePage: when recurring toggle is enabled, call `createRecurringSeries` callable instead of direct Firestore write.

- [ ] **Step 7: Wire "Edit this session only" / "Edit future" prompt**

Update SessionEditPage: detect `seriesId`, show choice prompt, call appropriate function.

- [ ] **Step 8: Deploy functions and test**

```bash
cd functions && npm run build
firebase deploy --only functions
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: implement recurring session Cloud Functions and UI integration"
```

---

## Phase 5: Views

### Task 15: Today Dashboard

**Files:**
- Modify: `src/pages/TodayPage.tsx` (full implementation)
- Create: `src/components/today/SessionTimeline.tsx`
- Create: `src/components/today/NowDivider.tsx`
- Create: `src/components/today/DaySummary.tsx`
- Create: `src/components/today/FAB.tsx`
- Create: `src/hooks/useOnlineStatus.ts`

- [ ] **Step 1: Create useOnlineStatus hook**

Uses `navigator.onLine` + Firebase Realtime Database `.info/connected` to detect connectivity. Returns `isOnline` boolean.

- [ ] **Step 2: Create NowDivider**

Thin line with "Now" label positioned between past and future sessions. Only shown for today.

- [ ] **Step 3: Create DaySummary**

One-line summary: "3 sessions — 1 private, 2 group".

- [ ] **Step 4: Create FAB (Floating Action Button)**

Primary circle button with "+" icon. Tap opens dropdown: "Private Session" and "Group Class", linking to create pages with date pre-filled.

- [ ] **Step 5: Implement full TodayPage**

Header with date picker, session timeline query (instructorId + date), session cards, empty states (today vs future vs past), offline indicator, pull-to-refresh.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement Today dashboard with timeline, FAB, and date picker"
```

---

### Task 16: Calendar View

**Files:**
- Create: `src/pages/CalendarPage.tsx`
- Create: `src/components/calendar/MonthGrid.tsx`
- Create: `src/components/calendar/WeekView.tsx`
- Create: `src/components/calendar/DayDetailPanel.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create MonthGrid component**

Standard 7-column month grid. Day cells show colored dots (green=private, blue=group). Today highlighted with primary circle. Selected date with ring.

- [ ] **Step 2: Create WeekView component**

7-day horizontal timeline with session bars (colored by type, proportional height).

- [ ] **Step 3: Create DayDetailPanel**

Session list for selected date (reuses SessionCard). Empty state with "Add Session" button.

- [ ] **Step 4: Create CalendarPage**

View mode toggle (month/week), navigation arrows, "Today" shortcut pill, queries sessions by date range, FAB for creation.

- [ ] **Step 5: Add route and commit**

```bash
git add .
git commit -m "feat: implement calendar with month/week views and day detail"
```

---

## Phase 6: Business Logic

### Task 17: Cloud Functions — Packages, Payments, Cancellations

**Files:**
- Create: `functions/src/createPackage.ts`
- Create: `functions/src/deductCredit.ts`
- Create: `functions/src/cancelSession.ts`
- Create: `functions/src/markSessionComplete.ts`
- Create: `functions/src/deleteClient.ts`
- Create: `functions/src/triggers.ts`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Implement createPackage**

Callable: validates one-active-package-per-type-per-client rule, creates package document.

- [ ] **Step 2: Implement deductCredit**

Callable: finds active package, transactionally decrements credit, updates payment status, updates `unpaidCount`.

- [ ] **Step 3: Implement markSessionComplete**

Callable: sets status to completed, auto-deducts credit from package if available. For group sessions, processes each attending student.

- [ ] **Step 4: Implement cancelSession**

Callable: sets status cancelled, refunds credits for paid sessions, updates `unpaidCount`.

- [ ] **Step 5: Implement deleteClient**

Callable: cascading delete of client + sessions + attendance + packages + roster removal. Uses batched writes with chunking for >500 operations.

- [ ] **Step 6: Implement Firestore triggers**

`onSessionPaymentUpdate`: sync `unpaidCount` on `sessions` payment status change.
`onAttendancePaymentUpdate`: sync `unpaidCount` on `attendance` payment status change.

- [ ] **Step 7: Deploy and test**

```bash
cd functions && npm run build
firebase deploy --only functions
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: implement Cloud Functions for packages, payments, and cancellations"
```

---

### Task 18: Packages and Payments UI

**Files:**
- Create: `src/components/payments/PackageCreateSheet.tsx`
- Create: `src/components/payments/PaymentBadge.tsx`
- Create: `src/components/payments/PaymentSummary.tsx`
- Create: `src/hooks/useCallable.ts`
- Modify: `src/pages/ClientDetailPage.tsx`
- Modify: `src/pages/SessionDetailPage.tsx`
- Modify: `src/pages/GroupSessionPage.tsx`

- [ ] **Step 1: Create useCallable hook**

Wrapper around `httpsCallable` with 10-second timeout for offline handling. Returns `{ call, loading, error }`.

- [ ] **Step 2: Create PaymentBadge component**

Tappable badge showing paid/unpaid. On tap: opens confirmation dialog for manual toggle or credit deduction.

- [ ] **Step 3: Create PackageCreateSheet**

Bottom sheet with package type toggle + credit preset buttons + custom input. Calls `createPackage`.

- [ ] **Step 4: Create PaymentSummary**

Displays active package info + unpaid count on client detail page.

- [ ] **Step 5: Wire payment UI into session detail and group attendance**

Update SessionDetailPage to use real `markSessionComplete` callable. Update payment badges to call `deductCredit`. Update GroupSessionPage attendance payment toggles.

- [ ] **Step 6: Wire delete into ClientDetailPage**

Replace direct delete with `deleteClient` callable.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: implement packages, payment UI, and Cloud Function integration"
```

---

### Task 19: Cancellation UI

**Files:**
- Create: `src/components/sessions/CancelDialog.tsx`
- Create: `src/components/sessions/RecurringCancelPrompt.tsx`
- Modify: `src/pages/SessionDetailPage.tsx`

- [ ] **Step 1: Create CancelDialog**

AlertDialog showing cancellation details (credit refund info). Calls `cancelSession` callable.

- [ ] **Step 2: Create RecurringCancelPrompt**

Shows "This session only" vs "This and all future sessions" choice before CancelDialog.

- [ ] **Step 3: Wire into session detail**

Add cancel action to scheduled sessions. Handle recurring series detection.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: implement cancellation flows with credit refund"
```

---

## Phase 7: Workflow Features

### Task 20: Session Notes

**Files:**
- Create: `src/components/sessions/NotesSheet.tsx`
- Modify: `src/components/sessions/SessionCard.tsx`
- Modify: `src/pages/SessionDetailPage.tsx`
- Modify: `src/pages/TodayPage.tsx`

- [ ] **Step 1: Create NotesSheet**

Bottom sheet with: session context header, auto-focused textarea, "Save Notes" button. Writes to `sessions/{id}.notes`. Handles discard confirmation if unsaved changes.

- [ ] **Step 2: Add "Add Notes" button to session cards**

Show on completed sessions where `notes` is empty. Primary colored button. Shows truncated notes preview after save.

- [ ] **Step 3: Wire notes editing on session detail page**

Show full notes or "Add Notes" button. Edit link opens NotesSheet.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: implement post-session notes with quick-entry sheet"
```

---

### Task 21: Session Prep View

**Files:**
- Create: `src/components/sessions/PrepSheet.tsx`
- Create: `src/components/sessions/GroupPrepSheet.tsx`
- Modify: `src/components/sessions/SessionCard.tsx`

- [ ] **Step 1: Create PrepSheet (private sessions)**

75%-height sheet showing: client header, health notes card (accent background), payment status, last 3 completed sessions with notes preview.

- [ ] **Step 2: Create GroupPrepSheet**

Sheet showing: class header with enrollment count, roster sorted by health notes (non-empty first), per-student health notes preview, payment overview line.

- [ ] **Step 3: Add "Prep" button to scheduled session cards**

Opens PrepSheet or GroupPrepSheet depending on session type.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: implement session prep view for private and group sessions"
```

---

### Task 22: Push Notifications

**Files:**
- Create: `src/lib/messaging.ts`
- Create: `src/components/notifications/NotificationPrompt.tsx`
- Create: `functions/src/sendNoteReminders.ts`
- Create: `public/firebase-messaging-sw.js`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Set up FCM client registration**

`src/lib/messaging.ts`: request permission, get token, store on instructor document, handle foreground messages with in-app toast.

- [ ] **Step 2: Create NotificationPrompt**

In-app card shown after first session completion. "Enable Reminders" triggers browser permission. "Not Now" dismisses for 7 days.

- [ ] **Step 3: Create service worker for background messages**

`public/firebase-messaging-sw.js`: handles onBackgroundMessage, displays notification with session info.

- [ ] **Step 4: Implement sendNoteReminders Cloud Function**

Scheduled every 5 minutes. Finds completed sessions from today with empty notes whose endTime was 5-10 minutes ago. Sends FCM message with deep-link payload.

- [ ] **Step 5: Handle notification deep-link**

Today page checks URL params (`action=addNotes&sessionId=X`), opens NotesSheet for that session.

- [ ] **Step 6: Add settings toggle**

Settings page: "Session Reminders" toggle (visible when permission granted).

- [ ] **Step 7: Deploy and commit**

```bash
git add .
git commit -m "feat: implement push notifications for post-session note reminders"
```

---

## Phase 8: Infrastructure & Polish

### Task 23: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/` (placeholder PNGs)
- Modify: `vite.config.ts` (add vite-plugin-pwa)
- Modify: `index.html` (meta tags)

- [ ] **Step 1: Install vite-plugin-pwa**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Configure PWA plugin**

```typescript
// in vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

// Add to plugins:
VitePWA({
  registerType: 'prompt',
  manifest: {
    name: 'YogaFlow',
    short_name: 'YogaFlow',
    description: 'Organize your yoga clients and classes',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#5B7F6E',
    background_color: '#FAFAF7',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts-stylesheets', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts-webfonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
    ],
  },
})
```

- [ ] **Step 3: Add HTML meta tags**

```html
<meta name="theme-color" content="#5B7F6E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
```

- [ ] **Step 4: Create placeholder icons**

Generate simple sage green squares with "YF" text at required sizes. Store in `public/icons/`.

- [ ] **Step 5: Create update prompt component**

Show toast "Update available" with "Refresh" button when service worker detects new version.

- [ ] **Step 6: Add iOS install banner**

Detect iOS Safari, show one-time dismissible banner with install instructions.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: configure PWA with service worker, manifest, and install prompts"
```

---

### Task 24: Settings Page

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create SettingsPage**

Profile section (display name, email), notification toggle, email verification banner, sign-out button, privacy policy link.

- [ ] **Step 2: Add route and commit**

```bash
git add .
git commit -m "feat: implement settings page with profile and notification controls"
```

---

### Task 25: Email Verification Banner

**Files:**
- Create: `src/components/layout/VerificationBanner.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create VerificationBanner**

Shown when `user.emailVerified === false`. Dismissible but reappears next session. "Resend verification email" link.

- [ ] **Step 2: Add to AppLayout and commit**

```bash
git add .
git commit -m "feat: add email verification banner for unverified accounts"
```

---

### Task 26: Firebase Hosting Deployment

**Files:**
- Modify: `firebase.json`
- Create: `.github/workflows/deploy.yml` (optional)

- [ ] **Step 1: Configure firebase.json for SPA hosting**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "/icons/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000" }]
      }
    ]
  }
}
```

- [ ] **Step 2: Build and deploy**

```bash
npm run build
firebase deploy --only hosting
```

- [ ] **Step 3: Deploy Firestore rules and indexes**

```bash
firebase deploy --only firestore
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: configure Firebase Hosting for production deployment"
```

---

### Task 27: Sentry Error Monitoring

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Install and configure Sentry**

```bash
npm install @sentry/react
```

Initialize in `main.tsx` before app render:
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
})
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Sentry error monitoring"
```

---

### Task 28: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write professional README**

Centered header, tech stack badges, overview, features table, architecture diagram (text), getting started instructions (prerequisites, install, env setup, dev/build/deploy).

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "docs: add project README"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-6 | Project init, theme, Firebase, types, auth, routing |
| 2 | 7-11 | Client CRUD, private session CRUD |
| 3 | 12 | Group classes, attendance tracking |
| 4 | 13-14 | Recurrence UI + Cloud Functions |
| 5 | 15-16 | Today dashboard, Calendar view |
| 6 | 17-19 | Packages, payments, cancellations |
| 7 | 20-22 | Notes, prep, push notifications |
| 8 | 23-28 | PWA, settings, deployment, monitoring, README |
