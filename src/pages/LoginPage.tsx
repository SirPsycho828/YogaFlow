import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/today" replace />

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setIsSubmitting(true)
    await signInWithEmail(email, password)
    setIsSubmitting(false)
  }

  const handleGoogleSignIn = async () => {
    clearError()
    await signInWithGoogle()
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Image Panel - hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1729886484967-a93f9d5df220?w=800&h=1200&q=80&auto=format&fit=crop"
          alt="Yoga instructor in a warmly lit studio by a window"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Warm overlay to match design system */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        {/* Brand text at bottom of image */}
        <div className="absolute bottom-8 left-8 right-8">
          <p className="font-heading text-2xl text-white">YogaFlow</p>
          <p className="mt-1 text-sm text-white/70">Welcome back to your practice</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="relative flex w-full items-center justify-center px-4 lg:w-1/2">
        {/* Decorative orbs */}
        <div
          className="absolute top-[-10%] right-[-15%] w-[400px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-sm space-y-8"
        >
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full gradient-golden" />
          <h1 className="font-heading text-4xl text-foreground">YogaFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">Welcome back to your practice</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <Button
          className="w-full h-12 gap-3 bg-card border-2 border-primary/20 text-foreground font-semibold shadow-md hover:bg-secondary hover:border-primary/30 transition-all"
          onClick={handleGoogleSignIn}
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

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
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
              autoComplete="current-password"
              className="h-12 rounded-lg border-input bg-card shadow-sm"
            />
          </div>

          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-lg gradient-golden text-white font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Get started
          </Link>
        </p>
        </motion.div>
      </div>
    </div>
  )
}
