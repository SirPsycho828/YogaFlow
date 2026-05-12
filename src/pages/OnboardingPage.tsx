import { useState, type FormEvent } from 'react'
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
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome to YogaFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display-name">Your Name</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="e.g. Sarah"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isSubmitting || !displayName.trim()}
          >
            {isSubmitting ? 'Setting up…' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  )
}
