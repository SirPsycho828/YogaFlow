import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { Search, Check } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/sessions/DatePicker'
import { TimePicker } from '@/components/sessions/TimePicker'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import type { Client } from '@/types'

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const clamped = Math.min(total, 22 * 60)
  const newH = Math.floor(clamped / 60)
  const newM = clamped % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function ClassCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Class fields
  const [name, setName] = useState('')
  const [maxCapacity, setMaxCapacity] = useState<number>(10)
  const [location, setLocation] = useState('')

  // Roster multi-select
  const [allClients, setAllClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [rosterIds, setRosterIds] = useState<Set<string>>(new Set())
  const [rosterSearch, setRosterSearch] = useState('')

  // Session fields
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [endTimeManual, setEndTimeManual] = useState(false)

  // Recurrence (stub)
  const [repeat, setRepeat] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // Load active clients
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('name')
    )
    getDocs(q)
      .then((snap) => {
        setAllClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client))
      })
      .finally(() => setClientsLoading(false))
  }, [user])

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

  function toggleRoster(clientId: string) {
    setRosterIds((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else if (next.size < maxCapacity) {
        next.add(clientId)
      }
      return next
    })
  }

  const filteredClients = allClients.filter((c) =>
    c.name.toLowerCase().includes(rosterSearch.toLowerCase())
  )

  const atCapacity = rosterIds.size >= maxCapacity

  function validate(): string | null {
    if (!name.trim()) return 'Class name is required.'
    if (!maxCapacity || maxCapacity < 2) return 'Max capacity must be at least 2.'
    if (!date) return 'Please select a date.'
    if (!startTime) return 'Please select a start time.'
    if (!endTime) return 'Please select an end time.'
    if (startTime >= endTime) return 'End time must be after start time.'
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

    if (repeat) {
      toast.info('Recurring classes coming soon')
    }

    setSubmitting(true)
    try {
      const rosterArray = Array.from(rosterIds)

      // 1. Create groupClass document
      const classRef = await addDoc(collection(db, 'groupClasses'), {
        instructorId: user.uid,
        name: name.trim(),
        maxCapacity,
        defaultRoster: rosterArray,
        location: location.trim(),
        seriesId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // 2. Create session document
      const sessionDate = new Date(date!)
      sessionDate.setHours(0, 0, 0, 0)

      const sessionRef = await addDoc(collection(db, 'sessions'), {
        instructorId: user.uid,
        type: 'group',
        clientId: null,
        groupClassId: classRef.id,
        title: name.trim(),
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

      // 3. Create attendance documents for each roster client
      await Promise.all(
        rosterArray.map((clientId) =>
          addDoc(collection(db, 'attendance'), {
            instructorId: user.uid,
            sessionId: sessionRef.id,
            clientId,
            attended: false,
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp(),
          })
        )
      )

      toast.success('Class created')
      navigate(`/classes/${classRef.id}`)
    } catch (err) {
      console.error('Failed to create class:', err)
      toast.error('Failed to create class. Please try again.')
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
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-bold text-foreground">New Class</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Class Name */}
        <div className="space-y-1.5">
          <Label htmlFor="class-name">
            Class Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="class-name"
            placeholder="e.g. Morning Vinyasa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Max Capacity */}
        <div className="space-y-1.5">
          <Label htmlFor="max-capacity">
            Max Capacity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="max-capacity"
            type="number"
            min={2}
            value={maxCapacity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              setMaxCapacity(isNaN(val) ? 2 : val)
            }}
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Studio, online..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Default Roster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Default Roster</Label>
            <span className="text-sm text-muted-foreground">
              {rosterIds.size} / {maxCapacity} students
            </span>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search clients..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Client list */}
          <div className="rounded-md border border-input bg-background max-h-52 overflow-y-auto divide-y divide-border">
            {clientsLoading ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Loading clients...
              </div>
            ) : allClients.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No active clients
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No clients match "{rosterSearch}"
              </div>
            ) : (
              filteredClients.map((client) => {
                const selected = rosterIds.has(client.id)
                const disabled = !selected && atCapacity
                return (
                  <button
                    key={client.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleRoster(client.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? 'bg-primary/5'
                        : disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <InitialsAvatar name={client.name} className="h-8 w-8 text-xs shrink-0" />
                    <span className="flex-1 text-sm text-foreground">{client.name}</span>
                    {selected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {atCapacity && (
            <p className="text-xs text-muted-foreground">
              Class is at capacity. Increase max capacity to add more students.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-2">
          <p className="text-sm font-medium text-foreground mb-4">First Session</p>

          {/* Date */}
          <div className="space-y-1.5 mb-4">
            <Label>
              Date <span className="text-destructive">*</span>
            </Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Times */}
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
        </div>

        {/* Repeat toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="repeat-toggle" className="cursor-pointer">
            Repeat
          </Label>
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
          <p className="text-sm text-muted-foreground -mt-2">
            Recurring schedule coming soon. A single session will be created.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Class'}
        </Button>
      </form>
    </div>
  )
}
