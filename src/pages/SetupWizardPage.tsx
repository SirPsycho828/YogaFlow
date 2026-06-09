import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles,
  UserPlus,
  CalendarPlus,
  PartyPopper,
  ChevronRight,
  SkipForward,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { scheduleTour } from '@/components/tour/TourProvider'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/sessions/DatePicker'
import { TimePicker } from '@/components/sessions/TimePicker'
import { cn } from '@/lib/utils'

const STEPS = ['Welcome', 'Client', 'Session', 'Done'] as const

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 22 * 60)
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function SetupWizardPage() {
  const { user, instructor, refreshInstructor } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Client form
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const createdClientRef = useRef<{ id: string; name: string } | null>(null)

  // Session form
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [endTimeManual, setEndTimeManual] = useState(false)
  const [sessionCreated, setSessionCreated] = useState(false)

  const displayName = instructor?.displayName || user?.displayName || 'there'

  async function handleAddClient() {
    if (!user || !clientName.trim()) return
    setIsSubmitting(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        instructorId: user.uid,
        name: clientName.trim(),
        email: clientEmail.trim(),
        phone: clientPhone.trim(),
        healthNotes: '',
        status: 'active',
        unpaidCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      createdClientRef.current = { id: docRef.id, name: clientName.trim() }
      toast.success('Client added!')
      setStep(2)
    } catch {
      toast.error('Failed to add client. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartTimeChange(time: string) {
    setStartTime(time)
    if (!endTimeManual && time) {
      setEndTime(addMinutes(time, 60))
    }
  }

  async function handleCreateSession() {
    if (!user || !createdClientRef.current || !sessionDate || !startTime || !endTime) return
    setIsSubmitting(true)
    try {
      const d = new Date(sessionDate)
      d.setHours(0, 0, 0, 0)
      await addDoc(collection(db, 'sessions'), {
        instructorId: user.uid,
        type: 'private',
        clientId: createdClientRef.current.id,
        groupClassId: null,
        title: createdClientRef.current.name,
        date: Timestamp.fromDate(d),
        startTime,
        endTime,
        location: '',
        status: 'scheduled',
        paymentStatus: 'unpaid',
        notes: '',
        seriesId: null,
        isException: false,
        cancelledAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setSessionCreated(true)
      toast.success('Session scheduled!')
      setStep(3)
    } catch {
      toast.error('Failed to create session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleFinish() {
    if (!user) return
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'instructors', user.uid), {
        setupWizardComplete: true,
        updatedAt: serverTimestamp(),
      })
      await refreshInstructor()
      scheduleTour()
      navigate('/today', { replace: true })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkipAll() {
    if (!user) return
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'instructors', user.uid), {
        setupWizardComplete: true,
        updatedAt: serverTimestamp(),
      })
      await refreshInstructor()
      scheduleTour()
      navigate('/today', { replace: true })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sessionFormValid = sessionDate && startTime && endTime && startTime < endTime

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center bg-background px-4 overflow-hidden">
      <div className="relative w-full max-w-sm space-y-8">
        {/* Progress indicator */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'gradient-studio' : 'bg-muted',
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <>
                <div className="text-center">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full gradient-studio shadow-md">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-heading text-3xl text-foreground">
                    Welcome, {displayName}!
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Let's get your practice started. We'll add your first client
                    and schedule a session — it only takes a minute.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => setStep(1)}
                    className="w-full h-12 rounded-lg border-0 bg-foreground text-background font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                  >
                    Let's Go
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={handleSkipAll}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip setup, I'll explore on my own
                  </button>
                </div>
              </>
            )}

            {/* Step 1: Add Client */}
            {step === 1 && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h2 className="font-heading text-xl text-foreground">
                      Add Your First Client
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Who do you teach? Add one client to get started.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-name" className="text-xs font-medium tracking-wide text-muted-foreground">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wiz-name"
                      placeholder="e.g. Sarah Johnson"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      autoFocus
                      className="h-12 rounded-lg border-input bg-card shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-email" className="text-xs font-medium tracking-wide text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="wiz-email"
                      type="email"
                      placeholder="client@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="h-12 rounded-lg border-input bg-card shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-phone" className="text-xs font-medium tracking-wide text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      id="wiz-phone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="h-12 rounded-lg border-input bg-card shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleAddClient}
                    disabled={!clientName.trim() || isSubmitting}
                    className="w-full h-12 rounded-lg gradient-studio text-primary-foreground font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Client'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip for now
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Schedule Session */}
            {step === 2 && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarPlus className="h-5 w-5 text-primary" />
                    <h2 className="font-heading text-xl text-foreground">
                      Schedule a Session
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When's your next session with{' '}
                    <span className="font-medium text-foreground">
                      {createdClientRef.current?.name}
                    </span>
                    ?
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <DatePicker value={sessionDate} onChange={setSessionDate} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TimePicker
                      label="Start Time *"
                      value={startTime}
                      onChange={handleStartTimeChange}
                    />
                    <TimePicker
                      label="End Time *"
                      value={endTime}
                      onChange={(t) => { setEndTime(t); setEndTimeManual(true) }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleCreateSession}
                    disabled={!sessionFormValid || isSubmitting}
                    className="w-full h-12 rounded-lg gradient-studio text-primary-foreground font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg border-0"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip for now
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <>
                <div className="text-center">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full gradient-studio shadow-md">
                    <PartyPopper className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-heading text-3xl text-foreground">
                    You're All Set!
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {createdClientRef.current && sessionCreated
                      ? `Great start! ${createdClientRef.current.name} is added and your first session is on the calendar.`
                      : createdClientRef.current
                        ? `${createdClientRef.current.name} is added. You can schedule sessions anytime from the Today page.`
                        : "You're ready to go. Add clients and sessions whenever you're ready."}
                  </p>
                </div>
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg border-0 bg-foreground text-background font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                >
                  {isSubmitting ? 'Loading...' : 'Take a Quick Tour'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
