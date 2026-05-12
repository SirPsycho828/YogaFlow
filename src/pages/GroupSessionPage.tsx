import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { Search, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { PaymentBadge } from '@/components/sessions/PaymentBadge'
import { StatusBadge } from '@/components/sessions/StatusBadge'
import { formatTime } from '@/lib/utils'
import type { Session, Attendance, Client, GroupClass } from '@/types'

export function GroupSessionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [groupClass, setGroupClass] = useState<GroupClass | null>(null)
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([])
  const [clientsMap, setClientsMap] = useState<Map<string, Client>>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Drop-in picker
  const [showDropIn, setShowDropIn] = useState(false)
  const [dropInSearch, setDropInSearch] = useState('')
  const [allClients, setAllClients] = useState<Client[]>([])
  const [addingDropIn, setAddingDropIn] = useState<string | null>(null)

  // Subscribe to session
  useEffect(() => {
    if (!id || !user) return
    const unsubscribe = onSnapshot(doc(db, 'sessions', id), (snap) => {
      if (!snap.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const data = { id: snap.id, ...snap.data() } as Session
      if (data.instructorId !== user.uid) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setSession(data)
      setLoading(false)
    })
    return unsubscribe
  }, [id, user])

  // Fetch groupClass
  useEffect(() => {
    if (!session?.groupClassId) return
    getDoc(doc(db, 'groupClasses', session.groupClassId)).then((snap) => {
      if (snap.exists()) {
        setGroupClass({ id: snap.id, ...snap.data() } as GroupClass)
      }
    })
  }, [session?.groupClassId])

  // Subscribe to attendance records
  useEffect(() => {
    if (!id) return
    const q = query(
      collection(db, 'attendance'),
      where('sessionId', '==', id)
    )
    const unsubscribe = onSnapshot(q, (snap) => {
      setAttendanceList(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance)
      )
    })
    return unsubscribe
  }, [id])

  // Resolve client names
  useEffect(() => {
    const clientIds = attendanceList.map((a) => a.clientId)
    if (clientIds.length === 0) return

    const missing = clientIds.filter((cid) => !clientsMap.has(cid))
    if (missing.length === 0) return

    Promise.all(missing.map((cid) => getDoc(doc(db, 'clients', cid)))).then((snaps) => {
      setClientsMap((prev) => {
        const next = new Map(prev)
        snaps.forEach((snap) => {
          if (snap.exists()) {
            next.set(snap.id, { id: snap.id, ...snap.data() } as Client)
          }
        })
        return next
      })
    })
  }, [attendanceList]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load all active clients for drop-in picker
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', 'active')
    )
    getDocs(q).then((snap) => {
      setAllClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client))
    })
  }, [user])

  async function toggleAttendance(record: Attendance) {
    try {
      await updateDoc(doc(db, 'attendance', record.id), {
        attended: !record.attended,
      })
    } catch (err) {
      console.error('Failed to toggle attendance:', err)
      toast.error('Failed to update attendance.')
    }
  }

  async function handleMarkComplete() {
    if (!session) return
    setCompleting(true)
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      })
      toast.success('Session completed')
    } catch (err) {
      console.error('Failed to complete session:', err)
      toast.error('Failed to update session. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  async function handleAddDropIn(client: Client) {
    if (!id || !user) return
    setAddingDropIn(client.id)
    try {
      await addDoc(collection(db, 'attendance'), {
        instructorId: user.uid,
        sessionId: id,
        clientId: client.id,
        attended: true, // drop-ins are assumed attending
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
      })
      toast.success(`${client.name} added as drop-in`)
      setShowDropIn(false)
      setDropInSearch('')
    } catch (err) {
      console.error('Failed to add drop-in:', err)
      toast.error('Failed to add drop-in. Please try again.')
    } finally {
      setAddingDropIn(null)
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-24 rounded bg-secondary animate-pulse" />
        <div className="h-7 w-48 rounded bg-secondary animate-pulse" />
        <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
        <div className="h-16 rounded-lg border border-border bg-card animate-pulse" />
        <div className="h-16 rounded-lg border border-border bg-card animate-pulse" />
      </div>
    )
  }

  if (notFound || !session) {
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

  const dateObj = session.date.toDate()
  const fullDate = format(dateObj, 'EEE, MMM d, yyyy')
  const timeRange = `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`

  const attendedCount = attendanceList.filter((a) => a.attended).length
  const paidCount = attendanceList.filter((a) => a.paymentStatus === 'paid').length
  const unpaidCount = attendanceList.length - paidCount

  const atCapacity = groupClass
    ? attendanceList.length >= groupClass.maxCapacity
    : false

  // Drop-in eligible: active clients not already in attendance list
  const attendingIds = new Set(attendanceList.map((a) => a.clientId))
  const dropInEligible = allClients.filter(
    (c) =>
      !attendingIds.has(c.id) &&
      c.name.toLowerCase().includes(dropInSearch.toLowerCase())
  )

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <StatusBadge status={session.status} />
      </div>

      {/* Title */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
        <p className="text-sm font-medium text-foreground">{fullDate}</p>
        <p className="text-sm text-muted-foreground">{timeRange}</p>
      </div>

      {/* Summary bar */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-4 text-sm">
        <span className="font-medium text-foreground">
          {attendedCount}/{attendanceList.length} attended
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-green-700">{paidCount} paid</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-red-600">{unpaidCount} unpaid</span>
      </div>

      {/* Attendance list */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Attendance</h2>

        {attendanceList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled in this session.</p>
        ) : (
          <div className="space-y-1">
            {attendanceList.map((record) => {
              const client = clientsMap.get(record.clientId)
              const name = client?.name ?? 'Loading...'
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/30 transition-colors"
                >
                  {/* Avatar — tappable to client page */}
                  {client ? (
                    <Link
                      to={`/clients/${client.id}`}
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InitialsAvatar name={name} className="h-9 w-9 text-xs" />
                    </Link>
                  ) : (
                    <InitialsAvatar name={name} className="h-9 w-9 text-xs shrink-0" />
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    {client ? (
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-sm font-medium text-foreground hover:underline truncate block"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{name}</span>
                    )}
                  </div>

                  {/* Payment badge */}
                  <PaymentBadge status={record.paymentStatus} />

                  {/* Attendance checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleAttendance(record)}
                    aria-label={record.attended ? 'Mark absent' : 'Mark attended'}
                    className={`h-7 w-7 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                      record.attended
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input bg-background hover:border-primary/50'
                    }`}
                  >
                    {record.attended && (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Drop-in */}
        {!atCapacity && (
          <div className="pt-1 space-y-2">
            {!showDropIn ? (
              <button
                type="button"
                onClick={() => setShowDropIn(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Drop-in
              </button>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-3 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search clients..."
                    value={dropInSearch}
                    onChange={(e) => setDropInSearch(e.target.value)}
                    className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropIn(false)
                      setDropInSearch('')
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {dropInEligible.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      No eligible clients found
                    </div>
                  ) : (
                    dropInEligible.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        disabled={addingDropIn === client.id}
                        onClick={() => handleAddDropIn(client)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <InitialsAvatar
                          name={client.name}
                          className="h-8 w-8 text-xs shrink-0"
                        />
                        <span className="text-sm text-foreground">{client.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {atCapacity && (
          <p className="text-xs text-muted-foreground pt-1">
            Session is at capacity.
          </p>
        )}
      </section>

      {/* Actions */}
      {session.status === 'scheduled' && (
        <div className="pt-2">
          <Button
            className="w-full"
            onClick={handleMarkComplete}
            disabled={completing}
          >
            {completing ? 'Saving...' : 'Mark Complete'}
          </Button>
        </div>
      )}
    </div>
  )
}
