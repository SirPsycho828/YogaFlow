import { BadgeStatus } from '@/components/ui/badge-status'
import { getSessionDuration } from '@/lib/utils'

interface DurationBadgeProps {
  startTime: string
  endTime: string
}

export function DurationBadge({ startTime, endTime }: DurationBadgeProps) {
  const mins = getSessionDuration(startTime, endTime)
  return <BadgeStatus variant="duration">{mins} min</BadgeStatus>
}
