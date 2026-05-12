import { cn } from '@/lib/utils'

interface PaymentBadgeProps {
  status: 'paid' | 'unpaid'
  onToggle?: () => void
  className?: string
}

export function PaymentBadge({ status, onToggle, className }: PaymentBadgeProps) {
  const isPaid = status === 'paid'

  const baseClasses = cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
    isPaid
      ? 'bg-[hsl(var(--status-paid))]/10 text-[hsl(var(--status-paid))]'
      : 'bg-[hsl(var(--status-unpaid))]/10 text-[hsl(var(--status-unpaid))]',
    onToggle && 'cursor-pointer select-none transition-opacity hover:opacity-80',
    className,
  )

  if (onToggle) {
    return (
      <button type="button" className={baseClasses} onClick={onToggle}>
        {isPaid ? 'Paid' : 'Unpaid'}
      </button>
    )
  }

  return <span className={baseClasses}>{isPaid ? 'Paid' : 'Unpaid'}</span>
}
