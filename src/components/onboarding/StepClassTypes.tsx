import { cn } from '@/lib/utils'

const classTypes = [
  'Vinyasa', 'Hatha', 'Yin', 'Restorative', 'Power', 'Ashtanga',
  'Prenatal', 'Hot Yoga', 'Meditation', 'Private Sessions', 'Other',
] as const

interface StepClassTypesProps {
  selected: string[]
  onChange: (types: string[]) => void
}

export function StepClassTypes({ selected, onChange }: StepClassTypesProps) {
  const toggle = (type: string) => {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {classTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => toggle(type)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150',
            selected.includes(type)
              ? 'gradient-studio text-primary-foreground border-transparent shadow-sm'
              : 'border-border bg-card text-foreground hover:border-primary/30',
          )}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
