import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (needRefresh) {
      toast('Update available', {
        action: {
          label: 'Refresh',
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
      })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
