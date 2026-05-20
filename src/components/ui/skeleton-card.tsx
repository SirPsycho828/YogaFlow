import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  lines?: number
  className?: string
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-start gap-3">
        <div className="skeleton h-10 w-[72px] rounded-md" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn('skeleton h-3 rounded-full', i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-1/3')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
