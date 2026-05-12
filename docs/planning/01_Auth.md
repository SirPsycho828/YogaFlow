```markdown
## Overview

YogaFlow uses Firebase Authentication with two sign-in methods: Google OAuth and email/password. This is an instructor-only application -- there are no client-facing accounts, no role hierarchy, and no multi-user access controls. Every authenticated user is an instructor with full access to their own data.

The auth system must handle sign-up, sign-in, sign-out, password reset, and session persistence across browser restarts and PWA installs. Auth state gates all Firestore access via security rules.

## Dependencies

- `02_Database_Schema.md` -- Auth creates the instructor's user document on first sign-in
- `04_UI_Design_System.md` -- Login/signup screens follow the design system
- `14_Offline_PWA.md` -- Auth persistence interacts with offline/PWA behavior

## Auth Providers

### Google Sign-In

- Standard Firebase Google OAuth popup flow on desktop, redirect on mobile
- On first sign-in, create an instructor document in Firestore (see "First Sign-In Flow" below)
- Extract `displayName`, `email`, and `photoURL` from the Google profile to pre-populate the instructor record
- No additional scopes beyond default profile and email

### Email/Password

- Standard Firebase `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`
- Send email verification on sign-up via `sendEmailVerification`
- **Do not block access** on unverified email -- allow the instructor to use the app immediately, but show a persistent banner prompting verification
- Password reset via `sendPasswordResetLink` from the login screen

### Account Linking

If an instructor signs up with email/password and later tries Google sign-in with the same email (or vice versa), Firebase will throw `auth/account-exists-with-different-credential`. Handle this by:

1. Detecting the error
2. Showing a message: "An account with this email already exists. Sign in with [original method] to link your Google account."
3. After signing in with the original method, call `linkWithCredential` to merge providers

This is a known Firebase friction point -- handle it explicitly rather than showing a generic error.

## First Sign-In Flow

When a user authenticates for the first time (no matching document in the `instructors` collection):

1. Create an instructor document in Firestore at `instructors/{uid}` with:
   - `uid`: Firebase Auth UID
   - `email`: from auth profile
   - `displayName`: from auth profile (Google) or empty string (email/password)
   - `createdAt`: server timestamp
   - `updatedAt`: server timestamp
   - `onboardingComplete`: false

2. Redirect to a minimal onboarding screen:
   - **Display name** (pre-filled from Google if available, required)
   - No other required fields for v1

3. On completion, set `onboardingComplete: true` and redirect to the Today dashboard

The onboarding screen is intentionally minimal. Do not ask for business name, location, or preferences in v1. Get the instructor into the app fast.

## Session Persistence

Configure Firebase Auth persistence as `browserLocalPersistence`. This means:

- Auth state survives browser tab close and reopen
- Auth state survives PWA close and reopen
- Auth state survives device restart
- The instructor stays logged in until explicit sign-out

This is critical for the PWA experience. An instructor opening the app between sessions should never hit a login screen unexpectedly.

## Auth State Management

### React Integration

Use a top-level auth context provider that:

- Subscribes to `onAuthStateChanged` on mount
- Exposes `user`, `loading`, and `error` states
- While `loading` is true, show a full-screen loading indicator (not the login page -- avoid the flash-of-login-screen problem)
- On auth state change, fetch the instructor document from Firestore

### Route Protection

- **Public routes**: Login, signup, password reset, privacy policy
- **Protected routes**: Everything else
- If an unauthenticated user hits a protected route, redirect to login
- If an authenticated user hits login/signup, redirect to Today dashboard
- No role-based routing -- all authenticated users have identical access

## Firestore Security Rules

Every Firestore document belongs to a single instructor. Security rules enforce this universally:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Instructor can only read/write their own instructor document
    match /instructors/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // All data collections use instructorId field for ownership
    match /clients/{clientId} {
      allow read, write: if request.auth != null
        && resource == null  // allow create
        || resource.data.instructorId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.instructorId == request.auth.uid;
    }

    // Same pattern for sessions, packages, payments, groupClasses
    // Each collection document MUST have an instructorId field
    // Rules enforce: instructorId == request.auth.uid for all operations
  }
}
```

**Key principle**: The `instructorId` field on every document is the single source of access control. There are no shared documents, no team access, no public reads. See `02_Database_Schema.md` for the full collection list -- every collection follows this same ownership pattern.

**Important**: The security rules above are simplified. The actual rules need to handle create vs read/update/delete separately since `resource.data` is null on create operations. Use `request.resource.data.instructorId` for creates and `resource.data.instructorId` for reads/updates/deletes.

## Custom Auth UI

The PRD specifies a custom-built login/signup UI rather than FirebaseUI. This aligns with the design system in `04_UI_Design_System.md`.

### Login Screen

- App logo and name at top
- "Sign in with Google" button (prominent, top position)
- Divider with "or"
- Email input field
- Password input field
- "Sign In" button
- "Forgot password?" link below the password field
- "Don't have an account? Sign up" link at bottom
- Mobile-first layout: centered, max-width 400px, generous padding

### Sign-Up Screen

- Same layout as login, with:
- "Sign up with Google" button
- Email input
- Password input (show requirements: minimum 6 characters, Firebase default)
- Confirm password input
- "Create Account" button
- "Already have an account? Sign in" link

### Password Reset Screen

- Email input
- "Send Reset Link" button
- Success message: "Check your email for a reset link"
- "Back to sign in" link

### Email Verification Banner

- Shown on all protected pages when `emailVerified === false`
- Dismissible but reappears on next session
- Text: "Please verify your email address. Check your inbox or [resend verification email]."
- Non-blocking -- the instructor can use all features

## Sign-Out

- Sign-out button in the app's navigation/settings area
- Calls `signOut()` on Firebase Auth
- Redirects to login screen
- Clears any local state/cache

## OAuth Production Requirements

Google OAuth requires the following for production (non-testing) mode:

- **Privacy policy URL** -- Use a free generator (TermsFeed or Iubenda). Must be publicly accessible and linked in Firebase Console under authorized domains.
- **OAuth consent screen** -- Configure in Google Cloud Console with app name "YogaFlow", support email, and privacy policy link.
- **Testing mode limit** -- Without a published OAuth consent screen, Google sign-in is limited to 100 manually added test users. Publish the consent screen before any broader rollout.

This is a launch task, not a development task. But the login screen should include a "Privacy Policy" link in the footer that points to the hosted policy page.

## Error Handling

Only non-obvious error cases are listed here. Standard Firebase auth errors (network failure, invalid email format) should show user-friendly messages from a simple error code mapping.

| Error Code | User-Facing Message |
|-----------|---------------------|
| `auth/account-exists-with-different-credential` | "An account with this email already exists. Try signing in with [other method]." |
| `auth/popup-blocked` | "Pop-up was blocked. Please allow pop-ups for this site or try again." |
| `auth/too-many-requests` | "Too many attempts. Please wait a few minutes and try again." |
| `auth/user-disabled` | "This account has been disabled. Contact support." |

## Gaps & Assumptions

1. **No multi-instructor support.** The entire auth model assumes one instructor per account. If team/studio accounts are ever needed, this requires a fundamental rearchitecture of security rules and data ownership. Deferred to `16_Future_Features.md`.

2. **No social providers beyond Google.** Apple Sign-In, Facebook, etc. are not in scope. Google + email/password covers the target audience.

3. **No MFA.** Multi-factor authentication is not required for v1. This is a personal productivity tool, not a system holding sensitive client medical records. Health notes are informal instructor observations, not HIPAA-protected data.

4. **Account deletion flow not specified.** The PRD does not address an instructor deleting their own account. For v1, assume this is a manual request handled outside the app. A self-service account deletion flow may be required by app store policies if the PWA is ever listed.

5. **Rate limiting on auth endpoints.** Firebase handles this automatically. No custom rate limiting needed.

6. **Session timeout not specified.** Assumed: no automatic timeout. The instructor stays logged in indefinitely until sign-out. Firebase Auth tokens auto-refresh as long as the account is active.

## Implementation Notes

- Use `onAuthStateChanged` (not `onIdTokenChanged`) for the auth state listener. Token refreshes should not trigger UI re-renders.
- Firebase Auth persistence must be set before any sign-in call. Set it once at app initialization.
- For the PWA, test that auth state persists correctly after "Add to Home Screen" installation. Some browsers treat installed PWAs as separate storage contexts.
```  
