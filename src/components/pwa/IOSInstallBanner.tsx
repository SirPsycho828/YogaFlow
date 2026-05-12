import { useState, useEffect } from 'react'
import { X, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function IOSInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone
    const dismissed = localStorage.getItem('yogaflow-ios-install-dismissed')
    if (isIOS && !isStandalone && !dismissed) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem('yogaflow-ios-install-dismissed', 'true')
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install YogaFlow</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the share button <Share className="inline h-3 w-3" />, then "Add to Home Screen"
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
