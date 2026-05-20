import { cn } from '@/lib/utils'

const levels = [
  { value: 'beginner', label: 'Just starting out', description: 'Less than 1 year teaching' },
  { value: 'intermediate', label: 'Growing my practice', description: '1-3 years teaching' },
  { value: 'experienced', label: 'Seasoned instructor', description: '3+ years teaching' },
] as const

interface StepExperienceProps {
  value: string
  onChange: (value: string) => void
}

export function StepExperience({ value, onChange }: StepExperienceProps) {
  return (
    <div className="space-y-3">
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          className={cn(
            'w-full rounded-xl border p-4 text-left transition-all duration-150',
            value === level.value
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border bg-card hover:border-primary/30',
          )}
        >
          <p className="font-medium text-foreground">{level.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{level.description}</p>
        </button>
      ))}
    </div>
  )
}
