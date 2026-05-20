import { BadgeStatus } from '@/components/ui/badge-status'
import { cn } from '@/lib/utils'

type Status = 'scheduled' | 'completed' | 'cancelled'

const labelMap: Record<Status, string> = {
  scheduled: 'Upcoming',
  completed: 'Done',
  cancelled: 'Cancelled',
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <BadgeStatus variant={status} className={cn('uppercase', className)}>
      {labelMap[status]}
    </BadgeStatus>
  )
}
