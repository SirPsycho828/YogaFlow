import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useCallable } from '@/hooks/useCallable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatTime } from '@/lib/utils'
import type { Session } from '@/types'

interface CancelDialogProps {
  session: Session
  open: boolean
  onClose: () => void
}

interface CancelSessionInput {
  sessionId: string
}

interface CancelSessionOutput {
  success: boolean
  creditsRefunded: number
}

export function CancelDialog({ session, open, onClose }: CancelDialogProps) {
  const navigate = useNavigate()
  const { call, loading } = useCallable<CancelSessionInput, CancelSessionOutput>('cancelSession')

  const dateObj = session.date.toDate()
  const dateStr = format(dateObj, 'MMMM d, yyyy')
  const timeStr = formatTime(session.startTime)

  const isPrivate = session.type === 'private'
  const isPaid = session.paymentStatus === 'paid'

  const title = isPrivate
    ? `Cancel session with ${session.title}?`
    : `Cancel ${session.title}?`

  const description = `This session on ${dateStr} at ${timeStr} will be marked as cancelled.`

  const refundNote = isPrivate && isPaid
    ? ' 1 credit will be refunded to their package.'
    : ''

  async function handleCancel() {
    const result = await call({ sessionId: session.id })
    if (result) {
      const creditsMsg =
        result.creditsRefunded > 0
          ? ` — ${result.creditsRefunded} credit${result.creditsRefunded !== 1 ? 's' : ''} refunded`
          : ''
      toast.success(`Session cancelled${creditsMsg}`)
      onClose()
      navigate('/today')
    } else {
      toast.error('Failed to cancel session. Please try again.')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}{refundNote}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep Session</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
