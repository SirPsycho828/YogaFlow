import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  label: string
}

// Generate times from 05:00 to 22:00 in 15-minute increments
function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = []
  for (let h = 5; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`

      const period = h < 12 ? 'AM' : 'PM'
      const displayHour = h % 12 === 0 ? 12 : h % 12
      const label = `${displayHour}:${mm} ${period}`

      slots.push({ value, label })
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs',
          'focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground'
        )}
      >
        <option value="" disabled>
          Select time...
        </option>
        {TIME_SLOTS.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.label}
          </option>
        ))}
      </select>
    </div>
  )
}
