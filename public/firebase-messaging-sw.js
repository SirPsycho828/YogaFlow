importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'placeholder',
  projectId: 'placeholder',
  messagingSenderId: 'placeholder',
  appId: 'placeholder',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `notes-${payload.data?.sessionId}`,
    data: payload.data,
  }
  self.registration.showNotification(title || 'YogaFlow', options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const sessionId = event.notification.data?.sessionId
  const url = sessionId ? `/?action=addNotes&sessionId=${sessionId}` : '/'
  event.waitUntil(clients.openWindow(url))
})
