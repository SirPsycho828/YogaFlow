import { useEffect, useRef, useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Session } from '@/types'

interface NotesSheetProps {
  session: Session
  open: boolean
  onClose: () => void
}

export function NotesSheet({ session, open, onClose }: NotesSheetProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Populate textarea when sheet opens
  useEffect(() => {
    if (open) {
      setText(session.notes ?? '')
    }
  }, [open, session.notes])

  // Auto-focus textarea when sheet opens
  useEffect(() => {
    if (open) {
      // Small delay allows the sheet animation to begin before focusing
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const savedText = session.notes ?? ''
  const hasUnsavedChanges = text !== savedText

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (hasUnsavedChanges) {
        setShowDiscard(true)
      } else {
        onClose()
      }
    }
  }

  async function handleSave() {
    setSaving(true)
    // Optimistic close
    onClose()
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        notes: text,
        updatedAt: serverTimestamp(),
      })
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setShowDiscard(false)
    onClose()
  }

  function handleKeepEditing() {
    setShowDiscard(false)
  }

  const dateLabel = format(session.date.toDate(), 'EEE, MMM d')

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex flex-col max-h-[90vh] rounded-t-xl px-0 pb-0"
        >
          <SheetHeader className="px-4 pb-2">
            <SheetTitle className="text-base">{session.title}</SheetTitle>
            <SheetDescription className="text-xs">{dateLabel}</SheetDescription>
          </SheetHeader>

          {/* Scrollable textarea area */}
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How did it go?"
              className="min-h-[120px] w-full resize-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
            />
          </div>

          <SheetFooter className="px-4 pb-6 pt-2 border-t border-border">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Discard confirmation dialog */}
      <AlertDialog open={showDiscard} onOpenChange={(o) => { if (!o) setShowDiscard(false) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard notes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes won't be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepEditing}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
