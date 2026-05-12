import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { StatusBadge } from '@/components/sessions/StatusBadge'
import type { Session, Client, Package } from '@/types'

interface PrepSheetProps {
  session: Session
  open: boolean
  onClose: () => void
}

interface RecentSession {
  id: string
  date: import('firebase/firestore').Timestamp
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string
}

export function PrepSheet({ session, open, onClose }: PrepSheetProps) {
  const { user } = useAuth()

  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(true)

  const [activePackage, setActivePackage] = useState<Package | null>(null)
  const [packageLoading, setPackageLoading] = useState(true)
  const [unpaidCount, setUnpaidCount] = useState(0)

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    if (!open || !session.clientId || !user) return

    setClientLoading(true)
    setPackageLoading(true)
    setRecentLoading(true)

    // Load all in parallel
    Promise.all([
      // Client doc
      getDoc(doc(db, 'clients', session.clientId)),

      // Active package
      getDocs(
        query(
          collection(db, 'packages'),
          where('clientId', '==', session.clientId),
          where('type', '==', session.type),
          where('status', '==', 'active')
        )
      ),

      // Recent completed sessions
      getDocs(
        query(
          collection(db, 'sessions'),
          where('instructorId', '==', user.uid),
          where('clientId', '==', session.clientId),
          where('status', '==', 'completed'),
          orderBy('date', 'desc'),
          limit(3)
        )
      ),
    ]).then(([clientSnap, packageSnap, recentSnap]) => {
      // Client
      if (clientSnap.exists()) {
        setClient({ id: clientSnap.id, ...clientSnap.data() } as Client)
      }
      setClientLoading(false)

      // Package
      if (!packageSnap.empty) {
        setActivePackage({ id: packageSnap.docs[0].id, ...packageSnap.docs[0].data() } as Package)
      } else {
        setActivePackage(null)
      }
      setPackageLoading(false)

      // Recent sessions
      setRecentSessions(
        recentSnap.docs.map((d) => ({
          id: d.id,
          date: d.data().date,
          status: d.data().status,
          notes: d.data().notes ?? '',
        }))
      )
      setRecentLoading(false)
    }).catch(() => {
      setClientLoading(false)
      setPackageLoading(false)
      setRecentLoading(false)
    })
  }, [open, session.clientId, session.type, user])

  // Fetch unpaid sessions count for this client
  useEffect(() => {
    if (!open || !session.clientId || !user) return

    getDocs(
      query(
        collection(db, 'sessions'),
        where('instructorId', '==', user.uid),
        where('clientId', '==', session.clientId),
        where('paymentStatus', '==', 'unpaid'),
        where('status', '==', 'completed')
      )
    ).then((snap) => {
      setUnpaidCount(snap.size)
    })
  }, [open, session.clientId, user])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setClient(null)
      setActivePackage(null)
      setRecentSessions([])
      setClientLoading(true)
      setPackageLoading(true)
      setRecentLoading(true)
      setUnpaidCount(0)
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className="flex flex-col h-[75vh] rounded-t-xl px-0 pb-0"
      >
        <SheetHeader className="px-4 pb-2 border-b border-border">
          <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Session Prep
          </SheetTitle>
          <SheetDescription className="sr-only">
            Preparation details for {session.title}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* 1. Client header */}
          {clientLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse shrink-0" />
              <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
            </div>
          ) : client ? (
            <Link
              to={`/clients/${client.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={onClose}
            >
              <InitialsAvatar name={client.name} />
              <span className="text-lg font-semibold text-foreground">{client.name}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Client not found</p>
          )}

          {/* 2. Health notes */}
          {clientLoading ? (
            <div className="rounded-lg h-16 bg-secondary animate-pulse" />
          ) : (
            <section className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-1">
              <h2 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Health Notes
              </h2>
              {client?.healthNotes ? (
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.healthNotes}</p>
              ) : (
                <p className="text-sm text-amber-700/60">No health notes on file</p>
              )}
            </section>
          )}

          {/* 3. Payment status */}
          {packageLoading ? (
            <div className="h-10 rounded bg-secondary animate-pulse" />
          ) : (
            <section className="space-y-1">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Payment
              </h2>
              {activePackage ? (
                <p className="text-sm text-foreground">
                  {activePackage.remainingCredits} of {activePackage.totalCredits}{' '}
                  {session.type === 'group' ? 'group' : 'private'} credits remaining
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No active package</p>
              )}
              {unpaidCount > 0 && (
                <p className="text-sm font-medium text-red-600">
                  {unpaidCount} unpaid {unpaidCount === 1 ? 'session' : 'sessions'}
                </p>
              )}
            </section>
          )}

          {/* 4. Recent sessions */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Sessions
            </h2>
            {recentLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded bg-secondary animate-pulse" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed sessions yet</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => {
                  const dateLabel = format(s.date.toDate(), 'MMM d')
                  const notesPreview = s.notes
                    ? s.notes.length > 80
                      ? `${s.notes.slice(0, 80)}…`
                      : s.notes
                    : null
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-foreground w-14 shrink-0">
                        {dateLabel}
                      </span>
                      <StatusBadge status={s.status} />
                      <p className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
                        {notesPreview ?? (
                          <span className="italic">No notes</span>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
