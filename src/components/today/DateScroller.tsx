import { useRef, useEffect } from 'react'
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateScrollerProps {
  selectedDate: Date
  onSelect: (date: Date) => void
}

export function DateScroller({ selectedDate, onSelect }: DateScrollerProps) {
  const todayRef = useRef<HTMLButtonElement>(null)

  // Generate 15 days before and after today
  const dates = Array.from({ length: 31 }, (_, i) => addDays(subDays(new Date(), 15), i))

  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="mb-4 -mx-4">
      <div
        className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {dates.map((date) => {
          const selected = isSameDay(date, selectedDate)
          const today = isToday(date)

          return (
            <button
              key={date.toISOString()}
              ref={today ? todayRef : undefined}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                'flex shrink-0 flex-col items-center rounded-xl px-3 py-2 transition-all duration-150',
                selected
                  ? 'gradient-studio text-primary-foreground shadow-md'
                  : 'bg-card hover:bg-secondary',
                today && !selected && 'ring-1 ring-primary/30',
              )}
            >
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wider',
                selected ? 'text-white/80' : 'text-muted-foreground',
              )}>
                {format(date, 'EEE')}
              </span>
              <span className={cn(
                'text-lg font-semibold leading-tight',
                selected ? 'text-white' : 'text-foreground',
              )}>
                {format(date, 'd')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
