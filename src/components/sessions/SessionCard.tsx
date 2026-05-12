import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import type { Session } from '@/types'

interface SessionCardProps {
  session: Session
  showDate?: boolean
  /** Extra info line rendered below the status badge (e.g. "Group (5/8)") */
  metaLine?: string
  /** Show "Add Notes" hint for completed sessions with no notes */
  showAddNotes?: boolean
  /** Called when user taps "Add Notes" on a completed session with no notes */
  onAddNotes?: (session: Session) => void
  /** Called when user taps "Prep" on a scheduled session */
  onPrep?: (session: Session) => void
}

export function SessionCard({
  session,
  showDate = false,
  metaLine,
  showAddNotes = false,
  onAddNotes,
  onPrep,
}: SessionCardProps) {
  const isCancelled = session.status === 'cancelled'

  const dateObj = session.date.toDate()
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Group sessions link to the attendance page
  const linkTarget =
    session.type === 'group'
      ? `/sessions/${session.id}/attendance`
      : `/sessions/${session.id}`

  const showAddNotesButton =
    showAddNotes && session.status === 'completed' && !session.notes && onAddNotes
  const showPrepButton = session.status === 'scheduled' && onPrep

  return (
    <div className={cn('relative', isCancelled && 'opacity-60')}>
      <Link
        to={linkTarget}
        className={cn(
          'flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50 active:bg-secondary',
          (showAddNotesButton || showPrepButton) && 'pb-3',
        )}
      >
        {/* Left column: time */}
        <div className="shrink-0 w-[72px] text-right">
          {showDate && (
            <p className="text-xs text-muted-foreground mb-0.5">{dateLabel}</p>
          )}
          <p className="text-base font-semibold text-foreground leading-tight">
            {formatTime(session.startTime)}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            {formatTime(session.endTime)}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-border shrink-0" />

        {/* Right column: details */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-foreground truncate',
              isCancelled && 'line-through',
            )}
          >
            {session.title}
          </p>
          {session.location && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {session.location}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={session.status} />
            {metaLine && (
              <span className="text-xs text-muted-foreground">{metaLine}</span>
            )}
          </div>

          {/* Action row: Add Notes or Prep */}
          {(showAddNotesButton || showPrepButton) && (
            <div className="mt-2 flex items-center gap-2">
              {showAddNotesButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAddNotes(session)
                  }}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  + Add Notes
                </button>
              )}
              {showPrepButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onPrep(session)
                  }}
                  className="inline-flex items-center rounded border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Prep
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
