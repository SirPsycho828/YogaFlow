import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { isNotificationSupported, requestNotificationPermission } from '@/lib/messaging'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

export function SettingsPage() {
  const { user, instructor, signOut } = useAuth()
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
      <h1 className="text-2xl font-bold font-heading text-foreground">Settings</h1>

      {/* Profile Section */}
      <Card className="p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <InitialsAvatar
            name={instructor?.displayName || user?.displayName || user?.email || '?'}
            size="lg"
          />
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {instructor?.displayName || user?.displayName || '—'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {instructor?.email || user?.email || '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Notifications Section */}
      {isNotificationSupported() && (
        <Card className="p-4 space-y-3 rounded-xl shadow-sm">
          <h2 className="text-base font-semibold font-heading text-foreground">Notifications</h2>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="session-reminders" className="text-sm font-medium text-foreground">
                Session Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get reminded to add notes after sessions
              </p>
            </div>
            <Switch
              id="session-reminders"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
              disabled={isUpdating || browserPermissionDenied}
            />
          </div>
          {browserPermissionDenied && (
            <p className="text-xs text-muted-foreground">
              Notifications are blocked in your browser settings
            </p>
          )}
        </Card>
      )}

      {/* Sign Out */}
      <div>
        <Button
          variant="outline"
          className="w-full h-11 rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">YogaFlow v1.0</p>
    </div>
  )
}
