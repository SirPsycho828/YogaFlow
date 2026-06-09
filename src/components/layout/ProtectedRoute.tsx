import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 rounded-full gradient-studio animate-pulse" />
        <p className="mt-4 font-heading text-lg text-foreground">YogaFlow</p>
        <p className="mt-1 text-xs text-muted-foreground">Loading your practice...</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, instructor, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  if (instructor && !instructor.onboardingComplete) return <Navigate to="/onboarding" replace />
  if (instructor && instructor.setupWizardComplete === false) return <Navigate to="/setup" replace />

  return <>{children}</>
}

export function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
