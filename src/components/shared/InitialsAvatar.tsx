import { cn } from '@/lib/utils'
import { getAvatarColor } from '@/lib/utils'

interface InitialsAvatarProps {
  name: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const

export function InitialsAvatar({ name, size = 'default', className }: InitialsAvatarProps) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.[0] || '?'

  const colorClass = getAvatarColor(name)

  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
      colorClass,
      sizeClasses[size],
      className,
    )}>
      {initials.toUpperCase()}
    </div>
  )
}
