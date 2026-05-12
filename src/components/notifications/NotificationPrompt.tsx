import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { requestNotificationPermission, isNotificationSupported } from '@/lib/messaging'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'yogaflow_notification_dismissed'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function shouldShow(): boolean {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return false
  if (Notification.permission === 'denied') return false

  const stored = localStorage.getItem(DISMISS_KEY)
  if (stored) {
    const dismissedAt = Number(stored)
    if (Date.now() - dismissedAt < DISMISS_TTL_MS) return false
  }

  return true
}

export function NotificationPrompt() {
  const { user } = useAuth()
  const [visible, setVisible] = useState<boolean>(() => shouldShow())
  const [enabling, setEnabling] = useState(false)

  if (!visible || !user) return null

  async function handleEnable() {
    if (!user) return
    setEnabling(true)
    await requestNotificationPermission(user.uid)
    setVisible(false)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-border bg-card shadow-lg p-4 space-y-3 max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-primary/10 p-2">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Get a reminder to add notes after each session?
          </p>
          <p className="text-xs text-muted-foreground">
            We'll nudge you 5 minutes after a session ends.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleEnable}
          disabled={enabling}
        >
          {enabling ? 'Enabling...' : 'Enable Reminders'}
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Not Now
        </button>
      </div>
    </div>
  )
}
