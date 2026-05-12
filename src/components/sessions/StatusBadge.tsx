import { cn } from '@/lib/utils'

type Status = 'scheduled' | 'completed' | 'cancelled'

const statusConfig: Record<Status, { label: string; className: string }> = {
  scheduled: {
    label: 'Upcoming',
    className: 'bg-blue-50 text-blue-700',
  },
  completed: {
    label: 'Done',
    className: 'bg-green-50 text-green-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500',
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
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
