import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
import { CancelDialog } from '@/components/sessions/CancelDialog'
import type { Session } from '@/types'

interface RecurringCancelPromptProps {
  session: Session
  open: boolean
  onClose: () => void
}

interface DeleteRecurringSeriesInput {
  seriesId: string
  deleteMode: 'future'
  fromDate: string // ISO date string
}

interface DeleteRecurringSeriesOutput {
  success: boolean
  deletedCount: number
}

export function RecurringCancelPrompt({ session, open, onClose }: RecurringCancelPromptProps) {
  const navigate = useNavigate()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { call, loading } = useCallable<DeleteRecurringSeriesInput, DeleteRecurringSeriesOutput>(
    'deleteRecurringSeries'
  )

  async function handleDeleteFuture() {
    if (!session.seriesId) return

    const fromDate = session.date.toDate().toISOString()
    const result = await call({ seriesId: session.seriesId, deleteMode: 'future', fromDate })

    if (result) {
      const count = result.deletedCount
      toast.success(
        `Session cancelled — ${count} future session${count !== 1 ? 's' : ''} removed`
      )
      onClose()
      navigate('/')
    } else {
      toast.error('Failed to cancel recurring sessions. Please try again.')
    }
  }

  function handleThisOnly() {
    setShowCancelDialog(true)
  }

  function handleCancelDialogClose() {
    setShowCancelDialog(false)
    onClose()
  }

  return (
    <>
      <AlertDialog open={open && !showCancelDialog} onOpenChange={(o) => { if (!o) onClose() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel recurring session</AlertDialogTitle>
            <AlertDialogDescription>
              This is a recurring session. What would you like to cancel?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep All</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              onClick={handleThisOnly}
              disabled={loading}
            >
              This session only
            </AlertDialogAction>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteFuture}
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'This and all future sessions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCancelDialog && (
        <CancelDialog
          session={session}
          open={showCancelDialog}
          onClose={handleCancelDialogClose}
        />
      )}
    </>
  )
}
