import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import type { Session, Attendance, Client, GroupClass } from '@/types'

interface GroupPrepSheetProps {
  session: Session
  open: boolean
  onClose: () => void
}

interface RosterEntry {
  attendance: Attendance
  client: Client | null
}

export function GroupPrepSheet({ session, open, onClose }: GroupPrepSheetProps) {
  const [groupClass, setGroupClass] = useState<GroupClass | null>(null)
  const [classLoading, setClassLoading] = useState(true)

  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [rosterLoading, setRosterLoading] = useState(true)

  const [paidCount, setPaidCount] = useState(0)
  const [unpaidCount, setUnpaidCount] = useState(0)

  useEffect(() => {
    if (!open) return

    setClassLoading(true)
    setRosterLoading(true)

    // Fetch group class info
    if (session.groupClassId) {
      getDoc(doc(db, 'groupClasses', session.groupClassId)).then((snap) => {
        if (snap.exists()) {
          setGroupClass({ id: snap.id, ...snap.data() } as GroupClass)
        }
        setClassLoading(false)
      })
    } else {
      setClassLoading(false)
    }

    // Subscribe to attendance records
    const q = query(
      collection(db, 'attendance'),
      where('sessionId', '==', session.id)
    )

    const unsubscribe = onSnapshot(q, async (snap) => {
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance)

      // Payment counts
      const paid = records.filter((r) => r.paymentStatus === 'paid').length
      setPaidCount(paid)
      setUnpaidCount(records.length - paid)

      // Batch-fetch client docs for each unique clientId
      const clientIds = [...new Set(records.map((r) => r.clientId))]
      const clientDocs = await Promise.all(
        clientIds.map((cid) => getDoc(doc(db, 'clients', cid)))
      )
      const clientMap = new Map<string, Client>()
      clientDocs.forEach((snap) => {
        if (snap.exists()) {
          clientMap.set(snap.id, { id: snap.id, ...snap.data() } as Client)
        }
      })

      const entries: RosterEntry[] = records.map((att) => ({
        attendance: att,
        client: clientMap.get(att.clientId) ?? null,
      }))

      // Sort: clients WITH health notes first, then alphabetical within each group
      entries.sort((a, b) => {
        const aHasNotes = !!(a.client?.healthNotes)
        const bHasNotes = !!(b.client?.healthNotes)
        if (aHasNotes !== bHasNotes) return aHasNotes ? -1 : 1
        const aName = a.client?.name ?? ''
        const bName = b.client?.name ?? ''
        return aName.localeCompare(bName)
      })

      setRoster(entries)
      setRosterLoading(false)
    })

    return unsubscribe
  }, [open, session.id, session.groupClassId])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setGroupClass(null)
      setRoster([])
      setClassLoading(true)
      setRosterLoading(true)
      setPaidCount(0)
      setUnpaidCount(0)
    }
  }, [open])

  const enrolledCount = roster.length
  const capacity = groupClass?.maxCapacity

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className="flex flex-col h-[75vh] rounded-t-xl px-0 pb-0"
      >
        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Class Prep
          </SheetTitle>
          <SheetDescription className="sr-only">
            Preparation details for {session.title}
          </SheetDescription>

          {/* 1. Class header */}
          <div className="mt-1 space-y-0.5">
            <p className="text-lg font-semibold text-foreground">{session.title}</p>
            {classLoading ? (
              <div className="h-4 w-20 rounded bg-secondary animate-pulse" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {capacity != null
                  ? `${enrolledCount}/${capacity} students`
                  : `${enrolledCount} enrolled`}
              </p>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* 2. Roster with health notes */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Roster
            </h2>
            {rosterLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded bg-secondary animate-pulse" />
                ))}
              </div>
            ) : roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students enrolled.</p>
            ) : (
              <div className="space-y-1">
                {roster.map(({ attendance, client }) => {
                  const name = client?.name ?? 'Unknown'
                  const healthPreview = client?.healthNotes
                    ? client.healthNotes.length > 40
                      ? `${client.healthNotes.slice(0, 40)}…`
                      : client.healthNotes
                    : null

                  return (
                    <div
                      key={attendance.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/30 transition-colors"
                    >
                      {client ? (
                        <Link
                          to={`/clients/${client.id}`}
                          className="shrink-0"
                          onClick={onClose}
                        >
                          <InitialsAvatar name={name} className="h-9 w-9 text-xs" />
                        </Link>
                      ) : (
                        <InitialsAvatar name={name} className="h-9 w-9 text-xs shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        {client ? (
                          <Link
                            to={`/clients/${client.id}`}
                            className="text-sm font-medium text-foreground hover:underline truncate block"
                            onClick={onClose}
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        )}
                        {healthPreview && (
                          <p className="text-xs text-amber-700 truncate">{healthPreview}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 3. Payment overview */}
          <section className="space-y-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Overview
            </h2>
            <p className="text-sm text-foreground">
              <span className="text-green-700 font-medium">{paidCount} paid</span>
              {unpaidCount > 0 && (
                <>
                  ,{' '}
                  <span className="text-red-600 font-medium">{unpaidCount} unpaid</span>
                </>
              )}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
