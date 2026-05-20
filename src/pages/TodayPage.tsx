import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore'
import { isToday, startOfDay } from 'date-fns'
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
import { GreetingHero } from '@/components/today/GreetingHero'
import { DateScroller } from '@/components/today/DateScroller'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getSessionDuration } from '@/lib/utils'
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
  const { user, instructor } = useAuth()
  const isOnline = useOnlineStatus()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
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
  const activeSessions = sessions.filter(s => s.status !== 'cancelled')
  const totalActive = activeSessions.length
  const totalMinutes = activeSessions.reduce(
    (sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0
  )

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

  return (
    <div className="py-6 space-y-4">
      {/* Greeting hero */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <GreetingHero
            displayName={instructor?.displayName || user?.displayName || 'there'}
            sessionCount={totalActive}
            totalMinutes={totalMinutes}
          />
        </div>
        {!isOnline && (
          <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" aria-label="Offline" />
        )}
      </div>

      {/* Date scroller */}
      <DateScroller
        selectedDate={selectedDate}
        onSelect={(date) => setSelectedDate(date)}
      />

      {/* Back to Today chip */}
      {!viewingToday && (
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary hover:text-primary hover:bg-primary/10 transition-colors"
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

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && visibleSessions.length === 0 && (
        <>
          {viewingToday && (
            <EmptyState
              icon={CalendarOff}
              heading="No sessions today"
              description="Enjoy your day off, or add a session."
              actionLabel="Add Session"
              onAction={() => {
                const fab = document.querySelector<HTMLButtonElement>('[aria-label="Add session"]')
                fab?.click()
              }}
            />
          )}
          {isFutureDate && (
            <EmptyState
              icon={CalendarIcon}
              heading="Nothing scheduled"
              description="Tap + to add a session for this day."
            />
          )}
          {isPastDate && (
            <EmptyState
              icon={CalendarX}
              heading="No sessions on this day"
              description=""
            />
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
