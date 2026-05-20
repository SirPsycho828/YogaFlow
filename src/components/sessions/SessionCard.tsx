import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { DurationBadge } from '@/components/today/DurationBadge'
import { BadgeStatus } from '@/components/ui/badge-status'
import type { Session } from '@/types'

interface SessionCardProps {
  session: Session
  showDate?: boolean
  metaLine?: string
  showAddNotes?: boolean
  onAddNotes?: (session: Session) => void
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

  const linkTarget =
    session.type === 'group'
      ? `/sessions/${session.id}/attendance`
      : `/sessions/${session.id}`

  const showAddNotesButton =
    showAddNotes && session.status === 'completed' && !session.notes && onAddNotes
  const showPrepButton = session.status === 'scheduled' && onPrep

  return (
    <div className={cn('relative', isCancelled && 'opacity-50')}>
      <Link
        to={linkTarget}
        className={cn(
          'flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-[var(--duration-fast)] hover:shadow-md hover:border-primary/15',
          (showAddNotesButton || showPrepButton) && 'pb-3',
        )}
      >
        {/* Left column: time */}
        <div className="shrink-0 w-[72px] text-right">
          {showDate && (
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground mb-0.5">{dateLabel}</p>
          )}
          <p className="text-base font-semibold text-foreground leading-tight tabular-nums">
            {formatTime(session.startTime)}
          </p>
          <p className="text-xs text-muted-foreground leading-tight tabular-nums">
            {formatTime(session.endTime)}
          </p>
        </div>

        {/* Divider — gradient accent */}
        <div className="w-0.5 self-stretch rounded-full shrink-0 gradient-golden opacity-40" />

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
            <DurationBadge startTime={session.startTime} endTime={session.endTime} />
            {metaLine && (
              <BadgeStatus variant="info">{metaLine}</BadgeStatus>
            )}
          </div>

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
                  className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
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
