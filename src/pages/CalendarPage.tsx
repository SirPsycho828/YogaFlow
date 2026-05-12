import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import {
  format,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { SessionCard } from '@/components/sessions/SessionCard'
import { FAB } from '@/components/today/FAB'
import { cn } from '@/lib/utils'
import type { Session } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStartTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(startOfDay(date))
}

function toEndTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(endOfDay(date))
}

/** Group sessions by their date key (yyyy-MM-dd local) */
function groupByDate(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = format(s.date.toDate(), 'yyyy-MM-dd')
    const arr = map.get(key) ?? []
    arr.push(s)
    map.set(key, arr)
  }
  return map
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** 6-px colored dot representing a session type */
function SessionDot({ type }: { type: 'private' | 'group' }) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 rounded-full',
        type === 'private' ? 'bg-emerald-500' : 'bg-blue-500',
      )}
    />
  )
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

interface MonthGridProps {
  anchor: Date // first day of the displayed month
  selectedDay: Date
  sessionsByDate: Map<string, Session[]>
  onSelectDay: (d: Date) => void
}

function MonthGrid({ anchor, selectedDay, sessionsByDate, onSelectDay }: MonthGridProps) {
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  // Grid start: Monday of the week containing the first day of the month
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  // Grid end: Sunday of the week containing the last day of the month
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const daySessions = sessionsByDate.get(key) ?? []
          const activeSessions = daySessions.filter((s) => s.status !== 'cancelled')
          const inMonth = day.getMonth() === anchor.getMonth()
          const todayDay = isToday(day)
          const selected = isSameDay(day, selectedDay)

          // Up to 3 dots; if more than 3, show "N+" label instead
          const dotSessions = activeSessions.slice(0, 3)
          const extraCount = activeSessions.length > 3 ? activeSessions.length : 0

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex flex-col items-center pt-1 pb-1.5 rounded-lg transition-colors',
                !inMonth && 'opacity-40',
                selected && !todayDay && 'ring-2 ring-primary ring-inset',
                'active:bg-secondary/60 hover:bg-secondary/40',
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium leading-none',
                  todayDay && 'bg-primary text-primary-foreground',
                  !todayDay && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Session indicators */}
              <div className="mt-0.5 flex items-center gap-0.5 min-h-[10px]">
                {extraCount > 0 ? (
                  <span className="text-[9px] leading-none text-muted-foreground font-medium">
                    {extraCount}+
                  </span>
                ) : (
                  dotSessions.map((s, i) => <SessionDot key={i} type={s.type} />)
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

interface WeekGridProps {
  anchor: Date // any date within the displayed week
  selectedDay: Date
  sessionsByDate: Map<string, Session[]>
  onSelectDay: (d: Date) => void
  onSelectSession: (s: Session) => void
}

function WeekGrid({ anchor, selectedDay, sessionsByDate, onSelectDay, onSelectSession }: WeekGridProps) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const daySessions = sessionsByDate.get(key) ?? []
        const todayDay = isToday(day)
        const selected = isSameDay(day, selectedDay)

        return (
          <div key={key} className="flex flex-col gap-1">
            {/* Day header */}
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex flex-col items-center rounded-lg py-1 transition-colors active:bg-secondary/60',
                selected && !todayDay && 'ring-2 ring-primary ring-inset',
              )}
            >
              <span className="text-[10px] text-muted-foreground leading-tight">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none',
                  todayDay && 'bg-primary text-primary-foreground',
                  !todayDay && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
            </button>

            {/* Session bars */}
            <div className="flex flex-col gap-0.5 px-0.5">
              {daySessions.map((s) => {
                const isCancelled = s.status === 'cancelled'
                // Compute approximate height based on duration
                const [sh, sm] = s.startTime.split(':').map(Number)
                const [eh, em] = s.endTime.split(':').map(Number)
                const durationMins = (eh * 60 + em) - (sh * 60 + sm)
                const minHeight = 24
                const heightPx = Math.max(minHeight, Math.round((durationMins / 60) * 48))

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSession(s)
                    }}
                    style={{ height: `${heightPx}px` }}
                    className={cn(
                      'w-full rounded text-[9px] text-white font-medium overflow-hidden flex items-start p-0.5 leading-tight transition-opacity active:opacity-70',
                      !isCancelled && s.type === 'private' && 'bg-emerald-600',
                      !isCancelled && s.type === 'group' && 'bg-blue-600',
                      isCancelled && 'bg-muted text-muted-foreground border border-dashed border-border opacity-50',
                    )}
                  >
                    <span className="truncate block w-full">{s.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

interface DayDetailProps {
  day: Date
  sessions: Session[]
  loading: boolean
}

function DayDetail({ day, sessions, loading }: DayDetailProps) {
  const todayDay = isToday(day)
  const label = todayDay
    ? `Today — ${format(day, 'EEEE, MMMM d')}`
    : format(day, 'EEEE, MMMM d')

  const sorted = [...sessions].sort((a, b) =>
    a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0,
  )

  return (
    <div className="mt-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarX className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No sessions</p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export function CalendarPage() {
  const { user } = useAuth()

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  // anchor is the "current" month (month view) or any day in the "current" week (week view)
  const [anchor, setAnchor] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingGrid, setLoadingGrid] = useState(true)

  // Compute the date range for the current view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === 'month') {
      const ms = startOfMonth(anchor)
      const me = endOfMonth(anchor)
      return {
        rangeStart: startOfWeek(ms, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(me, { weekStartsOn: 1 }),
      }
    } else {
      return {
        rangeStart: startOfWeek(anchor, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    }
  }, [viewMode, anchor])

  // Real-time Firestore subscription for the visible range
  useEffect(() => {
    if (!user) return

    setLoadingGrid(true)

    const q = query(
      collection(db, 'sessions'),
      where('instructorId', '==', user.uid),
      where('date', '>=', toStartTimestamp(rangeStart)),
      where('date', '<=', toEndTimestamp(rangeEnd)),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session)
      setSessions(docs)
      setLoadingGrid(false)
    })

    return unsubscribe
  }, [user, rangeStart, rangeEnd])

  const sessionsByDate = useMemo(() => groupByDate(sessions), [sessions])

  // Sessions for the selected day
  const selectedDaySessions = useMemo(() => {
    const key = format(selectedDay, 'yyyy-MM-dd')
    return sessionsByDate.get(key) ?? []
  }, [sessionsByDate, selectedDay])

  // Navigation header label
  const navLabel =
    viewMode === 'month'
      ? format(anchor, 'MMMM yyyy')
      : (() => {
          const ws = startOfWeek(anchor, { weekStartsOn: 1 })
          const we = endOfWeek(anchor, { weekStartsOn: 1 })
          return ws.getMonth() === we.getMonth()
            ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
            : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
        })()

  // Determine if "today" is outside the current view (show "Today" pill)
  const todayOutOfView = useMemo(() => {
    const today = new Date()
    if (viewMode === 'month') {
      return today.getMonth() !== anchor.getMonth() || today.getFullYear() !== anchor.getFullYear()
    } else {
      const ws = startOfWeek(anchor, { weekStartsOn: 1 })
      const we = endOfWeek(anchor, { weekStartsOn: 1 })
      return today < ws || today > we
    }
  }, [viewMode, anchor])

  function goBack() {
    if (viewMode === 'month') {
      setAnchor((a) => subMonths(a, 1))
    } else {
      setAnchor((a) => subWeeks(a, 1))
    }
  }

  function goForward() {
    if (viewMode === 'month') {
      setAnchor((a) => addMonths(a, 1))
    } else {
      setAnchor((a) => addWeeks(a, 1))
    }
  }

  function goToToday() {
    const today = new Date()
    setAnchor(today)
    setSelectedDay(today)
  }

  function handleSelectDay(day: Date) {
    setSelectedDay(day)
    // When clicking a day outside the current month in month view, navigate to that month
    if (viewMode === 'month' && day.getMonth() !== anchor.getMonth()) {
      setAnchor(startOfMonth(day))
    }
  }

  function handleSelectSession(s: Session) {
    // Navigate to session detail — use window.location to avoid importing useNavigate here
    // Actually we need useNavigate; it's hoisted at the top of the page component
    window.location.href =
      s.type === 'group' ? `/sessions/${s.id}/attendance` : `/sessions/${s.id}`
  }

  return (
    <div className="py-4 space-y-3 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Calendar</h1>

        {/* View mode toggle (segmented) */}
        <div className="flex rounded-lg bg-secondary p-0.5 text-sm">
          {(['month', 'week'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1 rounded-md font-medium capitalize transition-colors',
                viewMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Navigation row ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Previous"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="flex-1 text-center text-sm font-medium text-foreground">
          {navLabel}
        </span>

        {/* "Today" pill — visible only when today is out of view */}
        {todayOutOfView && (
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 rounded-full border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            Today
          </button>
        )}

        <button
          type="button"
          onClick={goForward}
          aria-label="Next"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── Grid ── */}
      {viewMode === 'month' ? (
        <MonthGrid
          anchor={anchor}
          selectedDay={selectedDay}
          sessionsByDate={sessionsByDate}
          onSelectDay={handleSelectDay}
        />
      ) : (
        <WeekGrid
          anchor={anchor}
          selectedDay={selectedDay}
          sessionsByDate={sessionsByDate}
          onSelectDay={handleSelectDay}
          onSelectSession={handleSelectSession}
        />
      )}

      {/* ── Day detail panel ── */}
      <DayDetail
        day={selectedDay}
        sessions={selectedDaySessions}
        loading={loadingGrid}
      />

      {/* ── FAB ── */}
      <FAB selectedDate={selectedDay} />
    </div>
  )
}
