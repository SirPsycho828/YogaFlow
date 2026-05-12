import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const sendNoteReminders = onSchedule('every 5 minutes', async () => {
  const db = admin.firestore()
  const now = new Date()

  // Get today's date at midnight UTC
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)

  // Query completed sessions from today with no notes and reminder not sent
  const sessionsSnap = await db
    .collection('sessions')
    .where('status', '==', 'completed')
    .where('date', '==', admin.firestore.Timestamp.fromDate(todayStart))
    .where('notes', '==', '')
    .get()

  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data()

    // Skip if reminder already sent
    if (session.reminderSent) continue

    // Fetch instructor and check FCM token
    const instructorDoc = await db.doc(`instructors/${session.instructorId}`).get()
    const instructor = instructorDoc.data()
    if (!instructor?.fcmToken || !instructor?.notificationsEnabled) continue

    // Calculate end time in UTC and check if 5-10 minutes have passed
    // endTime is stored as HH:mm local time; treated as UTC for v1
    const [h, m] = session.endTime.split(':').map(Number)
    const endDate = new Date(todayStart)
    endDate.setUTCHours(h, m, 0, 0)

    const minutesSinceEnd = (now.getTime() - endDate.getTime()) / 60000
    if (minutesSinceEnd < 5 || minutesSinceEnd > 10) continue

    // Send notification
    try {
      await admin.messaging().send({
        token: instructor.fcmToken,
        notification: {
          title: 'How did it go?',
          body: `${session.title} ended 5 minutes ago`,
        },
        data: {
          sessionId: sessionDoc.id,
          action: 'addNotes',
        },
        webpush: {
          fcmOptions: {
            link: `/?action=addNotes&sessionId=${sessionDoc.id}`,
          },
        },
      })

      // Mark reminder sent
      await sessionDoc.ref.update({ reminderSent: true })
    } catch (err: unknown) {
      const fcmErr = err as { code?: string }
      // Token invalid — clear it
      if (fcmErr.code === 'messaging/registration-token-not-registered') {
        await db.doc(`instructors/${session.instructorId}`).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        })
      }
    }
  }
})
