import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative orb */}
      <div
        className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full gradient-golden" />
          <h1 className="font-heading text-3xl text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Success Message */}
        {success && !error && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 text-center">
            <Mail className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Check your inbox</p>
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
              className="w-full h-12 rounded-lg gradient-golden text-white font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : null}

        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
