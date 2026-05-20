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
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-foreground">{heading}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button
          className="mt-6 gradient-studio text-primary-foreground font-semibold shadow-sm hover:opacity-90 border-0"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
