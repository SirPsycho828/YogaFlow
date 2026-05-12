import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface DeleteSeriesInput {
  seriesId: string
  deleteMode: 'single' | 'future' | 'all'
  sessionId?: string
}

export const deleteRecurringSeries = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { seriesId, deleteMode, sessionId } = request.data as DeleteSeriesInput

  if (!seriesId || !deleteMode) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  const uid = auth.uid

  // Verify series ownership
  const seriesDoc = await db.collection('series').doc(seriesId).get()
  if (!seriesDoc.exists || seriesDoc.data()?.instructorId !== uid) {
    throw new HttpsError('not-found', 'Series not found.')
  }

  const seriesData = seriesDoc.data()!
  const rruleStr = seriesData.rrule as string

  if (deleteMode === 'single') {
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId required for single delete.')
    }

    // Cancel the single session
    await db.collection('sessions').doc(sessionId).update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { cancelled: 1 }
  }

  if (deleteMode === 'future') {
    const now = new Date()

    // Query all future scheduled sessions in this series
    const futureQuery = await db
      .collection('sessions')
      .where('seriesId', '==', seriesId)
      .where('status', '==', 'scheduled')
      .get()

    const futureSessions = futureQuery.docs.filter((doc) => {
      const docDate = doc.data().date.toDate() as Date
      return docDate >= now
    })

    const batch = db.batch()
    for (const sessionSnap of futureSessions) {
      batch.update(sessionSnap.ref, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    // Update the series RRULE to add UNTIL clause
    const untilStr = formatUntilDate(now)
    let updatedRRule = rruleStr
    if (!rruleStr.includes('UNTIL=')) {
      updatedRRule = `${rruleStr};UNTIL=${untilStr}`
    }

    batch.update(db.collection('series').doc(seriesId), {
      rrule: updatedRRule,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await batch.commit()

    return { cancelled: futureSessions.length }
  }

  // deleteMode === 'all'
  // Cancel all non-completed sessions
  const allQuery = await db
    .collection('sessions')
    .where('seriesId', '==', seriesId)
    .get()

  const batch = db.batch()
  let cancelledCount = 0

  for (const sessionSnap of allQuery.docs) {
    const data = sessionSnap.data()
    if (data.status !== 'completed') {
      batch.update(sessionSnap.ref, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      cancelledCount++
    }
  }

  // Delete the series document
  batch.delete(db.collection('series').doc(seriesId))

  await batch.commit()

  return { cancelled: cancelledCount, seriesDeleted: true }
})

function formatUntilDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}T235959Z`
}
