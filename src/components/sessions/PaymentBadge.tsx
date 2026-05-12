import { cn } from '@/lib/utils'

interface PaymentBadgeProps {
  status: 'paid' | 'unpaid'
  onToggle?: () => void
  className?: string
}

export function PaymentBadge({ status, onToggle, className }: PaymentBadgeProps) {
  const isPaid = status === 'paid'

  const baseClasses = cn(
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
    isPaid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
    onToggle && 'cursor-pointer select-none',
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
