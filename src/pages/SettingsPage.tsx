import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  const { signOut } = useAuth()

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
