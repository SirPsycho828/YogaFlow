import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore'
import { format, isToday, startOfDay } from 'date-fns'
import {
  CalendarIcon,
  WifiOff,
  CalendarOff,
  CalendarX,
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { SessionCard } from '@/components/sessions/SessionCard'
import { NowDivider } from '@/components/today/NowDivider'
import { FAB } from '@/components/today/FAB'
import { NotesSheet } from '@/components/sessions/NotesSheet'
import { PrepSheet } from '@/components/sessions/PrepSheet'
import { GroupPrepSheet } from '@/components/sessions/GroupPrepSheet'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { Session, Attendance, GroupClass } from '@/types'

// Returns a Firestore Timestamp at midnight local time for the given Date
function toMidnightTimestamp(date: Date): Timestamp {
  const d = startOfDay(date)
  return Timestamp.fromDate(d)
}

// Returns the current HH:mm string
function currentHHmm(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function TodayPage() {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelled, setShowCancelled] = useState(false)

  // Maps for group session extra data
  const [attendanceCounts, setAttendanceCounts] = useState<Map<string, number>>(new Map())
  const [groupClasses, setGroupClasses] = useState<Map<string, GroupClass>>(new Map())

  // Sheet state
  const [notesSession, setNotesSession] = useState<Session | null>(null)
  const [prepSession, setPrepSession] = useState<Session | null>(null)

  // Subscribe to sessions for selected date
  useEffect(() => {
    if (!user) return

    setLoading(true)
    const midnight = toMidnightTimestamp(selectedDate)

    const q = query(
      collection(db, 'sessions'),
      where('instructorId', '==', user.uid),
      where('date', '==', midnight),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session)
      // Sort by startTime ascending
      docs.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
      setSessions(docs)
      setLoading(false)
    })

    return unsubscribe
  }, [user, selectedDate])

  // Fetch attendance counts for group sessions
  useEffect(() => {
    if (sessions.length === 0) return
    const groupSessions = sessions.filter((s) => s.type === 'group')
    if (groupSessions.length === 0) return

    const sessionIds = groupSessions.map((s) => s.id)
    const chunks: string[][] = []
    for (let i = 0; i < sessionIds.length; i += 30) {
      chunks.push(sessionIds.slice(i, i + 30))
    }

    Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, 'attendance'), where('sessionId', 'in', chunk)))
      )
    ).then((results) => {
      const counts = new Map<string, number>()
      results.forEach((snap) => {
        snap.docs.forEach((d) => {
          const sid = (d.data() as Attendance).sessionId
          counts.set(sid, (counts.get(sid) ?? 0) + 1)
        })
      })
      setAttendanceCounts(counts)
    })
  }, [sessions])

  // Fetch group class data (for maxCapacity)
  useEffect(() => {
    if (sessions.length === 0) return
    const groupSessions = sessions.filter((s) => s.type === 'group' && s.groupClassId)
    if (groupSessions.length === 0) return

    const classIds = [...new Set(groupSessions.map((s) => s.groupClassId as string))]
    const missing = classIds.filter((id) => !groupClasses.has(id))
    if (missing.length === 0) return

    const chunks: string[][] = []
    for (let i = 0; i < missing.length; i += 30) {
      chunks.push(missing.slice(i, i + 30))
    }

    Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, 'groupClasses'), where('__name__', 'in', chunk)))
      )
    ).then((results) => {
      setGroupClasses((prev) => {
        const next = new Map(prev)
        results.forEach((snap) => {
          snap.docs.forEach((d) => {
            next.set(d.id, { id: d.id, ...d.data() } as GroupClass)
          })
        })
        return next
      })
    })
  }, [sessions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link: ?action=addNotes&sessionId=X → open NotesSheet on mount
  useEffect(() => {
    const action = searchParams.get('action')
    const sessionId = searchParams.get('sessionId')
    if (action === 'addNotes' && sessionId && sessions.length > 0) {
      const target = sessions.find((s) => s.id === sessionId)
      if (target) {
        setNotesSession(target)
        // Clear the params so re-render doesn't re-trigger
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, sessions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derived values
  const viewingToday = isToday(selectedDate)
  const todayMidnight = startOfDay(new Date())
  const isPastDate = !viewingToday && startOfDay(selectedDate) < todayMidnight
  const isFutureDate = !viewingToday && startOfDay(selectedDate) > todayMidnight

  const visibleSessions = useMemo(() => {
    if (showCancelled) return sessions
    return sessions.filter((s) => s.status !== 'cancelled')
  }, [sessions, showCancelled])

  const hasCancelled = sessions.some((s) => s.status === 'cancelled')

  // Day summary counts (exclude cancelled)
  const privateSessions = sessions.filter((s) => s.type === 'private' && s.status !== 'cancelled')
  const groupSessionsAll = sessions.filter((s) => s.type === 'group' && s.status !== 'cancelled')
  const totalActive = privateSessions.length + groupSessionsAll.length

  const summaryParts: string[] = []
  if (privateSessions.length > 0) summaryParts.push(`${privateSessions.length} private`)
  if (groupSessionsAll.length > 0) summaryParts.push(`${groupSessionsAll.length} group`)

  // Now divider placement: index of the last session that starts at/before current time.
  // The divider is rendered AFTER that session. -1 means all sessions are future (divider goes first).
  const nowDividerAfterIndex = useMemo(() => {
    if (!viewingToday) return null
    const now = currentHHmm()
    let idx = -1
    for (let i = 0; i < visibleSessions.length; i++) {
      if (visibleSessions[i].startTime <= now) {
        idx = i
      }
    }
    return idx
  }, [visibleSessions, viewingToday])

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setSelectedDate(date)
      setCalendarOpen(false)
    }
  }

  function handleAddNotes(session: Session) {
    setNotesSession(session)
  }

  function handlePrep(session: Session) {
    setPrepSession(session)
  }

  function buildMetaLine(session: Session): string | undefined {
    if (session.type !== 'group') return undefined
    const count = attendanceCounts.get(session.id) ?? 0
    const gc = session.groupClassId ? groupClasses.get(session.groupClassId) : undefined
    if (gc) return `Group (${count}/${gc.maxCapacity})`
    return count > 0 ? `Group (${count})` : 'Group'
  }

  const dateHeadingLabel = viewingToday
    ? `Today — ${format(selectedDate, 'EEEE, MMMM d')}`
    : format(selectedDate, 'EEEE, MMMM d')

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Today</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <WifiOff className="h-4 w-4 text-muted-foreground" aria-label="Offline" />
          )}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Pick date">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Date context line */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{dateHeadingLabel}</p>
        {!loading && totalActive > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalActive} {totalActive === 1 ? 'session' : 'sessions'}
            {summaryParts.length > 0 ? ` — ${summaryParts.join(', ')}` : ''}
          </p>
        )}
      </div>

      {/* Back to Today chip */}
      {!viewingToday && (
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="h-3 w-3" />
          Back to Today
        </button>
      )}

      {/* Show/Hide cancelled toggle */}
      {!loading && hasCancelled && (
        <div>
          <button
            type="button"
            onClick={() => setShowCancelled((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
          </button>
        </div>
      )}

      {/* Loading state — 3 skeleton cards */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && visibleSessions.length === 0 && (
        <>
          {viewingToday && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarOff className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium">No sessions today</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enjoy your day off, or add a session.
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  const fab = document.querySelector<HTMLButtonElement>('[aria-label="Add session"]')
                  fab?.click()
                }}
              >
                Add Session
              </Button>
            </div>
          )}
          {isFutureDate && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium">Nothing scheduled</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap + to add a session for this day.
              </p>
            </div>
          )}
          {isPastDate && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarX className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium">No sessions on this day.</h2>
            </div>
          )}
        </>
      )}

      {/* Session timeline */}
      {!loading && visibleSessions.length > 0 && (
        <div className="space-y-2">
          {/* All-future: divider before the first session */}
          {viewingToday && nowDividerAfterIndex === -1 && <NowDivider />}

          {visibleSessions.map((session, index) => (
            <div key={session.id}>
              <SessionCard
                session={session}
                metaLine={buildMetaLine(session)}
                showAddNotes={session.status === 'completed' && !session.notes}
                onAddNotes={handleAddNotes}
                onPrep={handlePrep}
              />
              {/* Divider after the last past session (not after the final session) */}
              {viewingToday &&
                nowDividerAfterIndex !== null &&
                nowDividerAfterIndex >= 0 &&
                index === nowDividerAfterIndex &&
                index < visibleSessions.length - 1 && (
                  <NowDivider />
                )}
            </div>
          ))}
        </div>
      )}

      {/* Notes sheet */}
      {notesSession && (
        <NotesSheet
          session={notesSession}
          open={!!notesSession}
          onClose={() => setNotesSession(null)}
        />
      )}

      {/* Prep sheets */}
      {prepSession && prepSession.type === 'private' && (
        <PrepSheet
          session={prepSession}
          open={!!prepSession}
          onClose={() => setPrepSession(null)}
        />
      )}
      {prepSession && prepSession.type === 'group' && (
        <GroupPrepSheet
          session={prepSession}
          open={!!prepSession}
          onClose={() => setPrepSession(null)}
        />
      )}

      {/* FAB — always visible */}
      <FAB selectedDate={selectedDate} />
    </div>
  )
}
