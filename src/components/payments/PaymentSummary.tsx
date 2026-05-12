import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import type { Package } from '@/types'

interface PaymentSummaryProps {
  clientId: string
  unpaidCount: number
  onCreatePackage: () => void
}

export function PaymentSummary({ clientId, unpaidCount, onCreatePackage }: PaymentSummaryProps) {
  const { user } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (!user || !clientId) return

    const q = query(
      collection(db, 'packages'),
      where('clientId', '==', clientId),
      where('status', '==', 'active')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Package))
    })

    return unsubscribe
  }, [clientId, user])

  const privatePackage = packages.find((p) => p.type === 'private') ?? null
  const groupPackage = packages.find((p) => p.type === 'group') ?? null

  return (
    <div className="space-y-2">
      {/* Private package */}
      {privatePackage ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Private</span>
          <span className="font-medium text-foreground">
            {privatePackage.remainingCredits} of {privatePackage.totalCredits} credits remaining
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Private</span>
          <button
            type="button"
            onClick={onCreatePackage}
            className="text-primary text-xs hover:underline underline-offset-4"
          >
            No active package — Create one
          </button>
        </div>
      )}

      {/* Group package */}
      {groupPackage ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Group</span>
          <span className="font-medium text-foreground">
            {groupPackage.remainingCredits} of {groupPackage.totalCredits} credits remaining
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Group</span>
          <button
            type="button"
            onClick={onCreatePackage}
            className="text-primary text-xs hover:underline underline-offset-4"
          >
            No active package — Create one
          </button>
        </div>
      )}

      {/* Unpaid count */}
      <div className="pt-1 border-t border-border">
        {unpaidCount > 0 ? (
          <p className="text-sm font-medium text-red-600">
            {unpaidCount} unpaid {unpaidCount === 1 ? 'session' : 'sessions'}
          </p>
        ) : (
          <p className="text-sm text-green-700">All sessions paid</p>
        )}
      </div>
    </div>
  )
}
