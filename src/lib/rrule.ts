export function buildRRule(date: Date, frequency: string, until?: Date): string {
  const dayMap: Record<number, string> = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  }
  const day = dayMap[date.getDay()]

  let rule = ''
  switch (frequency) {
    case 'weekly':
      rule = `FREQ=WEEKLY;INTERVAL=1;BYDAY=${day}`
      break
    case 'biweekly':
      rule = `FREQ=WEEKLY;INTERVAL=2;BYDAY=${day}`
      break
    case 'monthly': {
      const weekNum = Math.ceil(date.getDate() / 7)
      rule = `FREQ=MONTHLY;INTERVAL=1;BYDAY=${weekNum}${day}`
      break
    }
  }

  if (until) {
    const y = until.getFullYear()
    const m = String(until.getMonth() + 1).padStart(2, '0')
    const d = String(until.getDate()).padStart(2, '0')
    rule += `;UNTIL=${y}${m}${d}T235959Z`
  }

  return rule
}
