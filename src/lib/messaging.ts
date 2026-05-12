import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { toast } from 'sonner'
import app from './firebase'

let messaging: ReturnType<typeof getMessaging> | null = null

function getMessagingInstance() {
  if (!messaging) {
    messaging = getMessaging(app)
  }
  return messaging
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export async function requestNotificationPermission(uid: string): Promise<boolean> {
  if (!isNotificationSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const token = await getToken(getMessagingInstance(), {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })

    await updateDoc(doc(db, 'instructors', uid), {
      fcmToken: token,
      notificationsEnabled: true,
    })

    return true
  } catch {
    return false
  }
}

export function setupForegroundMessages() {
  if (!isNotificationSupported()) return

  try {
    onMessage(getMessagingInstance(), (payload: MessagePayload) => {
      const { title, body } = payload.notification || {}
      const sessionId = payload.data?.sessionId

      toast(title || 'YogaFlow', {
        description: body,
        duration: 8000,
        action: sessionId
          ? {
              label: 'Add Notes',
              onClick: () => {
                window.location.href = `/?action=addNotes&sessionId=${sessionId}`
              },
            }
          : undefined,
      })
    })
  } catch {
    // Messaging not supported
  }
}
