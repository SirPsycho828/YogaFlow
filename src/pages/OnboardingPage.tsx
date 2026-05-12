import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Sparkles } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function OnboardingPage() {
  const { user, instructor, refreshInstructor } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(
    instructor?.displayName || user?.displayName || ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'instructors', user.uid), {
        displayName: displayName.trim(),
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      })
      await refreshInstructor()
      navigate('/today', { replace: true })
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative orbs */}
      <div
        className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[10%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Welcome header */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full gradient-golden">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-3xl text-foreground">Welcome to YogaFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let&apos;s set up your instructor profile
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-1.5 w-8 rounded-full gradient-golden" />
          <div className="h-1.5 w-8 rounded-full bg-muted" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-xs font-medium tracking-wide text-muted-foreground">
              What should we call you?
            </Label>
            <Input
              id="display-name"
              type="text"
              placeholder="e.g. Sarah"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              className="h-12 rounded-lg border-input bg-card shadow-sm text-center text-lg"
            />
            <p className="text-xs text-center text-muted-foreground">
              Your clients will see this name
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-lg gradient-golden text-white font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
            disabled={isSubmitting || !displayName.trim()}
          >
            {isSubmitting ? 'Setting up...' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  )
}
