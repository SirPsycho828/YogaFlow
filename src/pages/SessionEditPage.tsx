import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import { Repeat } from 'lucide-react'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientPicker } from '@/components/sessions/ClientPicker'
import { DatePicker } from '@/components/sessions/DatePicker'
import { TimePicker } from '@/components/sessions/TimePicker'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import type { Session } from '@/types'

// Compare two HH:mm strings — true if a < b
function timeLessThan(a: string, b: string): boolean {
  return a < b
}

export function SessionEditPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [original, setOriginal] = useState<Session | null>(null)

  // Form state — pre-filled once session loads
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState<string>('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [location, setLocation] = useState<string>('')

  // Series dialog state
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false)
  // Pending form data held while dialog is open
  const [pendingSubmit, setPendingSubmit] = useState(false)

  useEffect(() => {
    if (!id || !user) return

    async function fetchSession() {
      try {
        const snapshot = await getDoc(doc(db, 'sessions', id!))
        if (!snapshot.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const data = { id: snapshot.id, ...snapshot.data() } as Session
        if (data.instructorId !== user!.uid) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setOriginal(data)
        // Pre-fill form fields
        setClientId(data.clientId)
        setClientName(data.title)
        setDate(data.date.toDate())
        setStartTime(data.startTime)
        setEndTime(data.endTime)
        setLocation(data.location)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load session:', err)
        setNotFound(true)
        setLoading(false)
      }
    }

    fetchSession()
  }, [id, user])

  function handleClientChange(id: string, name: string) {
    setClientId(id)
    setClientName(name)
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

  async function doSave(isSingleOnly: boolean) {
    if (!original || !user) return

    setSubmitting(true)
    try {
      // Build an object of only changed fields
      const changes: Record<string, unknown> = {}

      if (clientId !== original.clientId) changes.clientId = clientId
      // Update title when client changes (title mirrors client name for private sessions)
      if (clientName !== original.title) changes.title = clientName

      const sessionDate = new Date(date!)
      sessionDate.setHours(0, 0, 0, 0)
      const newDateTimestamp = Timestamp.fromDate(sessionDate)
      // Compare by seconds to avoid object reference inequality
      if (newDateTimestamp.seconds !== original.date.seconds) {
        changes.date = newDateTimestamp
      }

      if (startTime !== original.startTime) changes.startTime = startTime
      if (endTime !== original.endTime) changes.endTime = endTime

      const trimmedLocation = location.trim()
      if (trimmedLocation !== original.location) changes.location = trimmedLocation

      // Mark as exception if part of a series and being edited individually
      if (original.seriesId && isSingleOnly && !original.isException) {
        changes.isException = true
      }

      if (Object.keys(changes).length === 0) {
        // Nothing changed — just go back
        navigate(`/sessions/${original.id}`)
        return
      }

      await updateDoc(doc(db, 'sessions', original.id), {
        ...changes,
        updatedAt: serverTimestamp(),
      })

      toast.success('Session updated')
      navigate(`/sessions/${original.id}`)
    } catch (err) {
      console.error('Failed to update session:', err)
      toast.error('Failed to update session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!original) return

    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    // If this session belongs to a series, ask the user first
    if (original.seriesId) {
      setPendingSubmit(true)
      setSeriesDialogOpen(true)
      return
    }

    await doSave(true)
  }

  function handleSeriesDialogThisOnly() {
    setSeriesDialogOpen(false)
    setPendingSubmit(false)
    doSave(true)
  }

  async function handleSeriesDialogFuture() {
    setSeriesDialogOpen(false)
    setPendingSubmit(false)

    if (!original || !original.seriesId) return

    setSubmitting(true)
    try {
      // Build updates from changed fields
      const updates: Record<string, string> = {}
      if (clientName !== original.title) updates.title = clientName
      if (startTime !== original.startTime) updates.startTime = startTime
      if (endTime !== original.endTime) updates.endTime = endTime
      const trimmedLocation = location.trim()
      if (trimmedLocation !== original.location) updates.location = trimmedLocation

      if (Object.keys(updates).length === 0) {
        navigate(`/sessions/${original.id}`)
        return
      }

      const editSeries = httpsCallable(functions, 'editRecurringSeries')
      await editSeries({
        seriesId: original.seriesId,
        editMode: 'future',
        sessionId: original.id,
        updates,
      })

      toast.success('Future sessions updated')
      navigate(`/sessions/${original.id}`)
    } catch (err) {
      console.error('Failed to edit series:', err)
      toast.error('Failed to update future sessions. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
        <div className="h-10 w-48 rounded bg-secondary animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !original) {
    return (
      <div className="py-6 space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/sessions/${original.id}`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Edit Session</h1>
          {original.seriesId && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />
              Part of recurring series
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground">
              Client <span className="text-destructive">*</span>
            </Label>
            <ClientPicker value={clientId} onChange={handleClientChange} />
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
              onChange={setStartTime}
            />
            <TimePicker
              label="End Time *"
              value={endTime}
              onChange={setEndTime}
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => navigate(`/sessions/${original.id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-golden text-white border-0 font-semibold shadow-md hover:opacity-90 hover:shadow-lg rounded-lg"
              disabled={submitting || pendingSubmit}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Series edit dialog */}
      <AlertDialog open={seriesDialogOpen} onOpenChange={setSeriesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit recurring session</AlertDialogTitle>
            <AlertDialogDescription>
              This session is part of a recurring series. How would you like to
              apply your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleSeriesDialogThisOnly}>
              Edit this session only
            </AlertDialogAction>
            <AlertDialogAction
              variant="outline"
              onClick={handleSeriesDialogFuture}
            >
              Edit this and all future sessions
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setPendingSubmit(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
