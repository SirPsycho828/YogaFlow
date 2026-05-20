import { cn } from '@/lib/utils'

type BadgeVariant = 'scheduled' | 'completed' | 'cancelled' | 'paid' | 'unpaid' | 'info' | 'duration' | 'level'

const variantConfig: Record<BadgeVariant, { className: string }> = {
  scheduled: { className: 'bg-[hsl(var(--status-scheduled))]/10 text-[hsl(var(--status-scheduled))]' },
  completed: { className: 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]' },
  cancelled: { className: 'bg-muted text-muted-foreground' },
  paid: { className: 'bg-[hsl(var(--status-paid))]/10 text-[hsl(var(--status-paid))]' },
  unpaid: { className: 'bg-[hsl(var(--status-unpaid))]/10 text-[hsl(var(--status-unpaid))]' },
  info: { className: 'bg-secondary text-secondary-foreground' },
  duration: { className: 'bg-primary/10 text-primary' },
  level: { className: 'bg-accent/15 text-accent-foreground' },
}

interface BadgeStatusProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function BadgeStatus({ variant, children, className }: BadgeStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        variantConfig[variant].className,
        className,
      )}
    >
      {children}
    </span>
  )
}
