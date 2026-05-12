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
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Instructor } from '@/types'

export interface AuthContextType {
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
  clearError: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

const googleProvider = new GoogleAuthProvider()

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
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
          setInstructor({ ...instructorDoc.data(), uid: instructorDoc.id } as Instructor)
        } else {
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
          setInstructor(newInstructor as unknown as Instructor)
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
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      setError(getAuthErrorMessage(firebaseErr.code || ''))
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      setError(getAuthErrorMessage(firebaseErr.code || ''))
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(newUser)
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      setError(getAuthErrorMessage(firebaseErr.code || ''))
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      setError(getAuthErrorMessage(firebaseErr.code || ''))
    }
  }

  const resendVerification = async () => {
    if (user) {
      await sendEmailVerification(user)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setInstructor(null)
  }

  const clearError = () => setError(null)

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
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
