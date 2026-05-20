import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepExperience } from '@/components/onboarding/StepExperience'
import { StepClassTypes } from '@/components/onboarding/StepClassTypes'
import { cn } from '@/lib/utils'

const stepTitles = [
  { heading: "What's your name?", sub: 'How should we greet you?' },
  { heading: 'Your experience', sub: 'How long have you been teaching?' },
  { heading: 'What do you teach?', sub: 'Select the types of classes you offer' },
]

export function OnboardingPage() {
  const { user, instructor, refreshInstructor } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState(
    instructor?.displayName || user?.displayName || ''
  )
  const [experienceLevel, setExperienceLevel] = useState('')
  const [classTypes, setClassTypes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'instructors', user.uid), {
        displayName: displayName.trim(),
        experienceLevel,
        classTypes,
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

  const { heading, sub } = stepTitles[step - 1]

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center bg-background px-4 overflow-hidden">
      <div className="relative w-full max-w-sm space-y-8">
        {/* Welcome header */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full gradient-studio shadow-md">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl text-foreground">Welcome to YogaFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let&apos;s set up your instructor profile
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                s <= step ? 'gradient-studio' : 'bg-muted',
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Step heading */}
            <div>
              <h2 className="font-heading text-xl text-foreground">{heading}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            </div>

            {/* Step 1: Display name */}
            {step === 1 && (
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
                  autoComplete="name"
                  autoFocus
                  className="h-12 rounded-lg border-input bg-card shadow-sm text-center text-lg"
                />
                <p className="text-xs text-center text-muted-foreground">
                  Your clients will see this name
                </p>
              </div>
            )}

            {/* Step 2: Experience level */}
            {step === 2 && (
              <StepExperience value={experienceLevel} onChange={setExperienceLevel} />
            )}

            {/* Step 3: Class types */}
            {step === 3 && (
              <StepClassTypes selected={classTypes} onChange={setClassTypes} />
            )}

            {/* Navigation */}
            <div className="space-y-3">
              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!displayName.trim()}
                  className="w-full h-12 rounded-lg border-0 bg-foreground text-background font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                >
                  Continue
                </Button>
              )}

              {step === 2 && (
                <>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!experienceLevel}
                    className="w-full h-12 rounded-lg border-0 bg-foreground text-background font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                  >
                    Continue
                  </Button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || classTypes.length === 0}
                    className="w-full h-12 rounded-lg gradient-studio text-primary-foreground font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
                  >
                    {isSubmitting ? 'Setting up...' : 'Get Started'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
