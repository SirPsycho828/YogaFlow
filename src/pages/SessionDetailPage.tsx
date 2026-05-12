import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { MapPin, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/sessions/StatusBadge'
import { PaymentBadge } from '@/components/sessions/PaymentBadge'
import { formatTime } from '@/lib/utils'
import type { Session, Client } from '@/types'

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Subscribe to session document
  useEffect(() => {
    if (!id || !user) return

    const unsubscribe = onSnapshot(doc(db, 'sessions', id), (snapshot) => {
      if (!snapshot.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const data = { id: snapshot.id, ...snapshot.data() } as Session
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

  // Fetch client health notes for private sessions
  useEffect(() => {
    if (!session?.clientId) return

    getDoc(doc(db, 'clients', session.clientId)).then((snap) => {
      if (snap.exists()) {
        setClient({ id: snap.id, ...snap.data() } as Client)
      }
    })
  }, [session?.clientId])

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

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-24 rounded bg-secondary animate-pulse" />
        <div className="h-7 w-48 rounded bg-secondary animate-pulse" />
        <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
        <div className="h-24 rounded-lg border border-border bg-card animate-pulse" />
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
  const fullDate = format(dateObj, 'EEEE, MMMM d, yyyy')
  const timeRange = `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`

  const cancelledDate =
    session.cancelledAt
      ? format(session.cancelledAt.toDate(), 'MMMM d, yyyy')
      : null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(session.location)}`

  return (
    <div className="py-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/sessions/${session.id}/edit`)}
        >
          Edit
        </Button>
      </div>

      {/* Title + recurring label */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
          {session.seriesId && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              <Repeat className="h-3 w-3" />
              Recurring
            </span>
          )}
        </div>

        {/* Date and time */}
        <p className="text-sm font-medium text-foreground">{fullDate}</p>
        <p className="text-sm text-muted-foreground">{timeRange}</p>
      </div>

      {/* Location */}
      {session.location && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{session.location}</span>
        </a>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-2">
        <StatusBadge status={session.status} />
        <PaymentBadge status={session.paymentStatus} />
      </div>

      {/* Health notes (private sessions only, if non-empty) */}
      {session.type === 'private' && client?.healthNotes && (
        <section className="rounded-lg border border-accent bg-accent/30 p-4 space-y-1">
          <h2 className="text-xs font-semibold text-accent-foreground uppercase tracking-wide">
            Health Notes
          </h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {client.healthNotes}
          </p>
        </section>
      )}

      {/* Session notes */}
      {session.notes ? (
        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{session.notes}</p>
        </section>
      ) : session.status === 'completed' ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            // NotesSheet comes in Task 20
            toast.info('Notes editing coming soon')
          }}>
            Add Notes
          </Button>
        </section>
      ) : null}

      {/* Actions */}
      <div className="pt-2 space-y-3">
        {session.status === 'scheduled' && (
          <>
            <Button
              className="w-full"
              onClick={handleMarkComplete}
              disabled={completing}
            >
              {completing ? 'Saving...' : 'Mark Complete'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                onClick={() => {
                  // Cancel dialog comes in Task 19
                  toast.info('Session cancellation coming soon')
                }}
              >
                Cancel Session
              </button>
            </div>
          </>
        )}

        {session.status === 'completed' && !session.notes && (
          /* Already shown in notes section above; nothing extra needed here */
          null
        )}

        {session.status === 'cancelled' && cancelledDate && (
          <p className="text-sm text-muted-foreground text-center">
            Cancelled on {cancelledDate}
          </p>
        )}

        {session.status === 'cancelled' && !cancelledDate && (
          <p className="text-sm text-muted-foreground text-center">
            This session was cancelled.
          </p>
        )}
      </div>
    </div>
  )
}
