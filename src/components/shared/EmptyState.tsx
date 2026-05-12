import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, heading, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-foreground">{heading}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button
          className="mt-6 gradient-golden text-white font-semibold shadow-sm hover:opacity-90 border-0"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
