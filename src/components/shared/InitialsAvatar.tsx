import { cn } from '@/lib/utils'

interface InitialsAvatarProps {
  name: string
  className?: string
}

export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.[0] || '?'

  return (
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-golden text-sm font-semibold text-white', className)}>
      {initials.toUpperCase()}
    </div>
  )
}
