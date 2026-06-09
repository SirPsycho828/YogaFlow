import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { isNotificationSupported, requestNotificationPermission } from '@/lib/messaging'
import { Switch } from '@/components/ui/switch'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { PageHeader } from '@/components/ui/page-header'
import { User, Bell, Smartphone, LogOut, Mail, ChevronRight, RotateCcw, Wand2 } from 'lucide-react'
import { useTour } from '@/components/tour/TourProvider'

export function SettingsPage() {
  const { user, instructor, signOut, refreshInstructor } = useAuth()
  const { startTour } = useTour()
  const navigate = useNavigate()
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    instructor?.notificationsEnabled ?? false
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const browserPermissionDenied =
    isNotificationSupported() && Notification.permission === 'denied'

  async function handleNotificationToggle(checked: boolean) {
    if (!user) return
    setIsUpdating(true)
    try {
      if (checked) {
        const granted = await requestNotificationPermission(user.uid)
        setNotificationsEnabled(granted)
      } else {
        await updateDoc(doc(db, 'instructors', user.uid), {
          notificationsEnabled: false,
        })
        setNotificationsEnabled(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="py-6 space-y-6">
      <PageHeader title="Settings" />

      {/* Account Section */}
      <section className="space-y-1">
        <h2 className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <User className="h-4 w-4" />
          Account
        </h2>
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {/* Profile card */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <InitialsAvatar
              name={instructor?.displayName || user?.displayName || user?.email || '?'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {instructor?.displayName || user?.displayName || '—'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {instructor?.email || user?.email || '—'}
              </p>
            </div>
          </div>
          {/* Sign Out */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">Sign Out</span>
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      {isNotificationSupported() && (
        <section className="space-y-1">
          <h2 className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Bell className="h-4 w-4" />
            Notifications
          </h2>
          <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">Session Reminders</span>
                {browserPermissionDenied && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Blocked in browser settings
                  </p>
                )}
              </div>
              <Switch
                id="session-reminders"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={isUpdating || browserPermissionDenied}
              />
            </div>
          </div>
        </section>
      )}

      {/* App Section */}
      <section className="space-y-1">
        <h2 className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          App
        </h2>
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {/* Replay Tour */}
          <button
            onClick={startTour}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">Replay App Tour</span>
              <p className="text-xs text-muted-foreground mt-0.5">Walk through the app features again</p>
            </div>
          </button>
          {/* Restart Setup Wizard */}
          <button
            onClick={async () => {
              if (!user) return
              await updateDoc(doc(db, 'instructors', user.uid), {
                setupWizardComplete: false,
                updatedAt: serverTimestamp(),
              })
              await refreshInstructor()
              navigate('/setup')
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
          >
            <Wand2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">Restart Setup Wizard</span>
              <p className="text-xs text-muted-foreground mt-0.5">Walk through the initial setup again</p>
            </div>
          </button>
          {/* Version */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Version</span>
            <span className="text-sm text-muted-foreground">v1.0</span>
          </div>
          {/* Contact Support */}
          <a
            href="mailto:support@yogaflow.app"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Contact Support</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </section>
    </div>
  )
}
