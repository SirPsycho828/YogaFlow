import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { MapPin, Plus, X, Search } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { SessionCard } from '@/components/sessions/SessionCard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { GroupClass, Session, Client } from '@/types'

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [groupClass, setGroupClass] = useState<GroupClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Roster clients resolved
  const [rosterClients, setRosterClients] = useState<Map<string, Client>>(new Map())

  // Upcoming sessions
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])

  // Add student inline picker state
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [allClients, setAllClients] = useState<Client[]>([])
  const [addSearch, setAddSearch] = useState('')
  const [addingClientId, setAddingClientId] = useState<string | null>(null)

  // Remove confirmation state
  const [removeTarget, setRemoveTarget] = useState<Client | null>(null)

  // Subscribe to groupClass
  useEffect(() => {
    if (!id || !user) return
    const unsubscribe = onSnapshot(doc(db, 'groupClasses', id), (snap) => {
      if (!snap.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const data = { id: snap.id, ...snap.data() } as GroupClass
      if (data.instructorId !== user.uid) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setGroupClass(data)
      setLoading(false)
    })
    return unsubscribe
  }, [id, user])

  // Resolve roster client names when roster changes
  useEffect(() => {
    if (!groupClass) return
    const roster = groupClass.defaultRoster
    if (roster.length === 0) {
      setRosterClients(new Map())
      return
    }
    Promise.all(roster.map((cid) => getDoc(doc(db, 'clients', cid)))).then((snaps) => {
      const map = new Map<string, Client>()
      snaps.forEach((snap) => {
        if (snap.exists()) {
          map.set(snap.id, { id: snap.id, ...snap.data() } as Client)
        }
      })
      setRosterClients(map)
    })
  }, [groupClass?.defaultRoster.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Load upcoming sessions
  useEffect(() => {
    if (!id) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'sessions'),
      where('groupClassId', '==', id),
      where('status', '==', 'scheduled'),
      where('date', '>=', Timestamp.fromDate(todayStart)),
      orderBy('date', 'asc'),
      limit(3)
    )
    getDocs(q).then((snap) => {
      setUpcomingSessions(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session)
      )
    })
  }, [id])

  // Load all active clients for add picker
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('name')
    )
    getDocs(q).then((snap) => {
      setAllClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client))
    })
  }, [user])

  async function handleRemoveClient(client: Client) {
    if (!groupClass || !user) return
    try {
      // Remove from defaultRoster
      await updateDoc(doc(db, 'groupClasses', groupClass.id), {
        defaultRoster: arrayRemove(client.id),
        updatedAt: serverTimestamp(),
      })

      // Delete future attendance records for this client
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // Get future sessions for this class
      const sessionsSnap = await getDocs(
        query(
          collection(db, 'sessions'),
          where('groupClassId', '==', groupClass.id),
          where('date', '>=', Timestamp.fromDate(todayStart))
        )
      )
      const futureSessionIds = sessionsSnap.docs.map((d) => d.id)

      if (futureSessionIds.length > 0) {
        const attendanceSnap = await getDocs(
          query(
            collection(db, 'attendance'),
            where('clientId', '==', client.id),
            where('sessionId', 'in', futureSessionIds)
          )
        )
        await Promise.all(attendanceSnap.docs.map((d) => deleteDoc(d.ref)))
      }

      toast.success(`${client.name} removed from ${groupClass.name}`)
      setRemoveTarget(null)
    } catch (err) {
      console.error('Failed to remove client:', err)
      toast.error('Failed to remove student. Please try again.')
    }
  }

  async function handleAddClient(client: Client) {
    if (!groupClass || !user) return
    setAddingClientId(client.id)
    try {
      // Add to defaultRoster
      await updateDoc(doc(db, 'groupClasses', groupClass.id), {
        defaultRoster: arrayUnion(client.id),
        updatedAt: serverTimestamp(),
      })

      // Create attendance records for all future sessions
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const sessionsSnap = await getDocs(
        query(
          collection(db, 'sessions'),
          where('groupClassId', '==', groupClass.id),
          where('date', '>=', Timestamp.fromDate(todayStart)),
          where('status', '==', 'scheduled')
        )
      )

      await Promise.all(
        sessionsSnap.docs.map((sessionDoc) =>
          addDoc(collection(db, 'attendance'), {
            instructorId: user.uid,
            sessionId: sessionDoc.id,
            clientId: client.id,
            attended: false,
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp(),
          })
        )
      )

      toast.success(`${client.name} added to ${groupClass.name}`)
      setShowAddPicker(false)
      setAddSearch('')
    } catch (err) {
      console.error('Failed to add client:', err)
      toast.error('Failed to add student. Please try again.')
    } finally {
      setAddingClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-24 rounded bg-secondary animate-pulse" />
        <div className="h-7 w-48 rounded bg-secondary animate-pulse" />
        <div className="h-24 rounded-xl border border-border bg-card shadow-sm animate-pulse" />
      </div>
    )
  }

  if (notFound || !groupClass) {
    return (
      <div className="py-6 space-y-4">
        <button
          type="button"
          onClick={() => navigate('/classes')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Classes
        </button>
        <p className="text-muted-foreground">Class not found.</p>
      </div>
    )
  }

  const rosterFull = groupClass.defaultRoster.length >= groupClass.maxCapacity

  // Clients not already in roster, filtered by search
  const eligibleClients = allClients.filter(
    (c) => !groupClass.defaultRoster.includes(c.id) &&
      c.name.toLowerCase().includes(addSearch.toLowerCase())
  )

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/classes')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Classes
        </button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => toast.info('Edit coming soon')}
        >
          Edit
        </Button>
      </div>

      {/* Class name */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">{groupClass.name}</h1>
      </div>

      {/* Info */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-medium">
            {groupClass.defaultRoster.length} / {groupClass.maxCapacity} students
          </span>
        </div>
        {groupClass.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{groupClass.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Recurrence</span>
          <span className="font-medium text-muted-foreground">
            {groupClass.seriesId ? 'Recurring' : 'One-time class'}
          </span>
        </div>
      </section>

      {/* Default Roster */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground font-heading">Enrolled Students</h2>

        {groupClass.defaultRoster.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        ) : (
          <div className="space-y-1">
            {groupClass.defaultRoster.map((clientId) => {
              const client = rosterClients.get(clientId)
              const displayName = client?.name ?? 'Loading...'
              return (
                <div
                  key={clientId}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/50 transition-colors"
                >
                  <InitialsAvatar name={displayName} className="h-8 w-8 text-xs shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{displayName}</span>
                  {client && (
                    <AlertDialog
                      open={removeTarget?.id === client.id}
                      onOpenChange={(open) => {
                        if (!open) setRemoveTarget(null)
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(client)}
                          className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {client.name} from {groupClass.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            They'll be removed from the roster and their upcoming attendance
                            records will be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleRemoveClient(client)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add Student button */}
        {!rosterFull && (
          <div className="space-y-2">
            {!showAddPicker ? (
              <button
                type="button"
                onClick={() => setShowAddPicker(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-3 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search clients..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPicker(false)
                      setAddSearch('')
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {eligibleClients.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      {allClients.length === 0
                        ? 'No active clients'
                        : 'All active clients are already enrolled'}
                    </div>
                  ) : (
                    eligibleClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        disabled={addingClientId === client.id}
                        onClick={() => handleAddClient(client)}
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

        {rosterFull && (
          <p className="text-xs text-muted-foreground">
            Class is at capacity ({groupClass.maxCapacity} students).
          </p>
        )}
      </section>

      {/* Upcoming Sessions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground font-heading">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} showDate />
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="border-t border-border pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              Cancel Class
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel {groupClass.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel all upcoming sessions and notify enrolled students.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Class</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => toast.info('Cancel coming soon')}
              >
                Cancel Class
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
