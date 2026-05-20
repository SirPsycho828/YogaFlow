import { CalendarCheck, Clock } from 'lucide-react'
import { getGreeting } from '@/lib/utils'

interface GreetingHeroProps {
  displayName: string
  sessionCount: number
  totalMinutes: number
}

export function GreetingHero({ displayName, sessionCount, totalMinutes }: GreetingHeroProps) {
  const firstName = displayName.split(' ')[0]

  return (
    <div className="mb-5">
      <h1 className="font-heading text-2xl text-foreground">
        {getGreeting()}, {firstName}
      </h1>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        </div>
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5">
            <Clock className="h-4 w-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              {totalMinutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
