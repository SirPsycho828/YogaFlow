import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NextStepCardProps {
  title: string
  description: string
  to: string
  actionLabel?: string
  icon?: LucideIcon
  className?: string
}

export function NextStepCard({ title, description, to, actionLabel, icon: Icon, className }: NextStepCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-4 rounded-xl border-l-4 border-l-accent bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-l-primary active:bg-secondary/50',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        <span className="hidden sm:inline">{actionLabel ?? 'Go'}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  )
}
