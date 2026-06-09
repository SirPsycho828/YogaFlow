import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { buildRRule } from '@/lib/rrule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientPicker } from '@/components/sessions/ClientPicker'
import { DatePicker } from '@/components/sessions/DatePicker'
import { TimePicker } from '@/components/sessions/TimePicker'

// Add 60 minutes to an HH:mm string, clamped to 22:00
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const clampedTotal = Math.min(total, 22 * 60)
  const newH = Math.floor(clampedTotal / 60)
  const newM = clampedTotal % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Compare two HH:mm strings — true if a < b
function timeLessThan(a: string, b: string): boolean {
  return a < b
}

export function SessionCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Parse query params
  const initialClientId = searchParams.get('clientId') ?? null
  const initialDateParam = searchParams.get('date')
  const initialDate = initialDateParam
    ? new Date(initialDateParam)
    : new Date()

  const [clientId, setClientId] = useState<string | null>(initialClientId)
  const [clientName, setClientName] = useState<string>('')
  const [noClients, setNoClients] = useState(false)
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [endTimeManual, setEndTimeManual] = useState(false)
  const [location, setLocation] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Recurrence state
  const [repeat, setRepeat] = useState(false)
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [untilEnabled, setUntilEnabled] = useState(false)
  const [untilDate, setUntilDate] = useState<Date | undefined>(undefined)

  function handleClientChange(id: string, name: string) {
    setClientId(id)
    setClientName(name)
  }

  function handleStartTimeChange(time: string) {
    setStartTime(time)
    if (!endTimeManual && time) {
      setEndTime(addMinutes(time, 60))
    }
  }

  function handleEndTimeChange(time: string) {
    setEndTime(time)
    setEndTimeManual(true)
  }

  function validate(): string | null {
    if (!clientId) return 'Please select a client.'
    if (!date) return 'Please select a date.'
    if (!startTime) return 'Please select a start time.'
    if (!endTime) return 'Please select an end time.'
    if (!timeLessThan(startTime, endTime))
      return 'End time must be after start time.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    setSubmitting(true)
    try {
      if (repeat) {
        // Build RRULE and call Cloud Function
        const rruleStr = buildRRule(date!, frequency, untilEnabled ? untilDate : undefined)
        const createSeries = httpsCallable(functions, 'createRecurringSeries')
        const result = await createSeries({
          rrule: rruleStr,
          type: 'private',
          linkedId: clientId,
          sessionDefaults: {
            title: clientName,
            startTime,
            endTime,
            location: location.trim(),
          },
        })
        const data = result.data as { sessionsCreated: number }
        toast.success(`Recurring sessions created (${data.sessionsCreated} sessions)`)
        navigate('/today')
      } else {
        // Single session creation
        const sessionDate = new Date(date!)
        sessionDate.setHours(0, 0, 0, 0)

        const newSession = await addDoc(collection(db, 'sessions'), {
          instructorId: user.uid,
          type: 'private',
          clientId: clientId,
          groupClassId: null,
          title: clientName,
          date: Timestamp.fromDate(sessionDate),
          startTime,
          endTime,
          location: location.trim(),
          status: 'scheduled',
          paymentStatus: 'unpaid',
          notes: '',
          seriesId: null,
          isException: false,
          cancelledAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        toast.success('Session created')
        navigate(`/sessions/${newSession.id}`)
      }
    } catch (err) {
      console.error('Failed to create session:', err)
      toast.error('Failed to create session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/today')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Today
        </button>
      </div>

      <h1 className="text-2xl font-heading font-bold text-foreground">New Session</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground">
            Client <span className="text-destructive">*</span>
          </Label>
          <ClientPicker
            value={clientId}
            onChange={handleClientChange}
            onLoaded={(clients) => setNoClients(clients.length === 0)}
          />
          {noClients && (
            <p className="text-sm text-muted-foreground">
              No clients yet.{' '}
              <a href="/clients/new" className="text-primary hover:underline">
                Add a client
              </a>{' '}
              before scheduling a session.
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground">
            Date <span className="text-destructive">*</span>
          </Label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {/* Times row */}
        <div className="grid grid-cols-2 gap-3">
          <TimePicker
            label="Start Time *"
            value={startTime}
            onChange={handleStartTimeChange}
          />
          <TimePicker
            label="End Time *"
            value={endTime}
            onChange={handleEndTimeChange}
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs font-medium tracking-wide text-muted-foreground">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="Studio, online, client's home..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-12 rounded-lg border-input bg-card shadow-sm"
          />
        </div>

        {/* Repeat toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="repeat-toggle" className="cursor-pointer text-xs font-medium tracking-wide text-muted-foreground">
              Repeat
            </Label>
            {/* Native checkbox styled as a switch */}
            <button
              id="repeat-toggle"
              type="button"
              role="switch"
              aria-checked={repeat}
              onClick={() => setRepeat((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                repeat ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  repeat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {repeat && (
            <div className="space-y-3 pl-1">
              {/* Frequency */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground">Frequency</Label>
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as typeof frequency)
                  }
                  className="flex h-12 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Every month</option>
                </select>
              </div>

              {/* End condition */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground">Ends</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="until"
                      checked={!untilEnabled}
                      onChange={() => setUntilEnabled(false)}
                      className="accent-primary"
                    />
                    No end date
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="until"
                      checked={untilEnabled}
                      onChange={() => setUntilEnabled(true)}
                      className="accent-primary"
                    />
                    Until date
                  </label>
                </div>

                {untilEnabled && (
                  <div className="pt-1">
                    <DatePicker value={untilDate} onChange={setUntilDate} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gradient-studio text-primary-foreground border-0 font-semibold shadow-md hover:opacity-90 hover:shadow-lg rounded-lg"
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Session'}
        </Button>
      </form>
    </div>
  )
}
