import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function SignUpPage() {
  const { user, signInWithGoogle, signUpWithEmail, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/today" replace />

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    await signUpWithEmail(email, password)
    setIsSubmitting(false)
  }

  const handleGoogleSignUp = async () => {
    setLocalError(null)
    clearError()
    await signInWithGoogle()
  }

  const displayError = localError || error

  return (
    <div className="relative flex min-h-[100svh] bg-background">
      {/* Image Panel — desktop only */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/images/feature-meditation.jpg"
          alt="Silhouette of a yoga practitioner against a warm sunset"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B1F]/60 via-[#3D2B1F]/20 to-[#3D2B1F]/30" />
        <div className="absolute bottom-10 left-10 right-10">
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-heading text-2xl text-white font-semibold">YogaFlow</span>
          </div>
          <p className="text-white/70 text-sm max-w-xs">
            Start managing your practice today
          </p>
        </div>
      </div>

      {/* Form Panel — scrollable to prevent overflow */}
      <div className="relative flex w-full items-start justify-center overflow-y-auto px-4 py-8 lg:w-1/2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-sm space-y-7 my-auto"
        >
          {/* Brand header */}
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-3">
              <img src="/favicon.svg" alt="" className="h-8 w-8" />
              <span className="font-heading text-2xl text-foreground font-semibold">YogaFlow</span>
            </div>
            <h1 className="font-heading text-3xl text-foreground">Create Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Free forever for solo instructors
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {displayError}
            </div>
          )}

          {/* Google Sign Up */}
          <Button
            className="w-full h-12 gap-3 bg-card border-2 border-border text-foreground font-semibold shadow-sm hover:bg-secondary hover:border-accent/30 transition-all"
            onClick={handleGoogleSignUp}
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium tracking-wide text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-lg border-input bg-card shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium tracking-wide text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-12 rounded-lg border-input bg-card shadow-sm"
              />
              {password && (
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all',
                        password.length >= level * 4
                          ? password.length >= 12 ? 'bg-[hsl(var(--status-completed))]'
                            : password.length >= 8 ? 'bg-accent'
                            : 'bg-[hsl(var(--status-unpaid))]'
                          : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-medium tracking-wide text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-12 rounded-lg border-input bg-card shadow-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-lg gradient-studio text-primary-foreground font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent/80 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
