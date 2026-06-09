import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GuidanceTipProps {
  id: string
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function GuidanceTip({ id, children, icon, className }: GuidanceTipProps) {
  const storageKey = `ux-tip-${id}`
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(storageKey) === 'true'
  )

  if (dismissed) return null

  function handleDismiss() {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/8 px-3 py-2.5 text-sm',
            className,
          )}
        >
          <span className="mt-0.5 shrink-0 text-accent-foreground">
            {icon ?? <Lightbulb className="h-4 w-4" />}
          </span>
          <p className="flex-1 text-xs text-muted-foreground leading-relaxed">{children}</p>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss tip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
