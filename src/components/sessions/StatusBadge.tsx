import { cn } from '@/lib/utils'

type Status = 'scheduled' | 'completed' | 'cancelled'

const statusConfig: Record<Status, { label: string; className: string }> = {
  scheduled: {
    label: 'Upcoming',
    className: 'bg-[hsl(var(--status-scheduled))]/10 text-[hsl(var(--status-scheduled))]',
  },
  completed: {
    label: 'Done',
    className: 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground',
  },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
