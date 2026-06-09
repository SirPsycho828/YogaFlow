import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordPage() {
  const { resetPassword, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setIsSubmitting(true)
    await resetPassword(email)
    setIsSubmitting(false)
    setSuccess(true)
  }

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm space-y-7"
      >
        {/* Brand header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-heading text-2xl text-foreground font-semibold">YogaFlow</span>
          </div>
          <h1 className="font-heading text-3xl text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Success Message */}
        {success && !error && (
          <div className="glass-card rounded-xl px-5 py-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-studio">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Check your email for a reset link.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We sent a password reset link to {email}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!success || error ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full h-12 rounded-lg gradient-studio text-primary-foreground font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : null}

        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-accent hover:text-accent/80 transition-colors">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
