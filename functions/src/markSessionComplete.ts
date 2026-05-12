import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface MarkSessionCompleteInput {
  sessionId: string
}

async function attemptCreditDeduction(
  uid: string,
  clientId: string,
  sessionId: string,
  type: 'private' | 'group'
): Promise<boolean> {
  // Find active package for this client + type
  const packagesSnapshot = await db
    .collection('packages')
    .where('instructorId', '==', uid)
    .where('clientId', '==', clientId)
    .where('type', '==', type)
    .where('status', '==', 'active')
    .get()

  if (packagesSnapshot.empty) {
    return false
  }

  const packageDoc = packagesSnapshot.docs[0]
  const packageRef = packageDoc.ref

  const result = await db.runTransaction(async (transaction) => {
    const freshPackage = await transaction.get(packageRef)
    const packageData = freshPackage.data()

    if (!packageData || packageData.remainingCredits <= 0) {
      return false
    }

    const newRemainingCredits = packageData.remainingCredits - 1

    // Update the package
    const packageUpdate: Record<string, unknown> = {
      remainingCredits: newRemainingCredits,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (newRemainingCredits === 0) {
      packageUpdate.status = 'depleted'
    }
    transaction.update(packageRef, packageUpdate)

    // Update payment status
    if (type === 'private') {
      const sessionRef = db.collection('sessions').doc(sessionId)
      transaction.update(sessionRef, { paymentStatus: 'paid' })
    } else {
      // For group: find attendance record for this sessionId + clientId
      const attendanceSnapshot = await db
        .collection('attendance')
        .where('sessionId', '==', sessionId)
        .where('clientId', '==', clientId)
        .get()

      if (!attendanceSnapshot.empty) {
        const attendanceRef = attendanceSnapshot.docs[0].ref
        transaction.update(attendanceRef, { paymentStatus: 'paid' })
      }
    }

    // Decrement unpaidCount on client
    const clientRef = db.collection('clients').doc(clientId)
    transaction.update(clientRef, {
      unpaidCount: admin.firestore.FieldValue.increment(-1),
    })

    return true
  })

  return result
}

export const markSessionComplete = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { sessionId } = request.data as MarkSessionCompleteInput

  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'Missing sessionId.')
  }

  const uid = auth.uid

  // Read session and verify ownership
  const sessionRef = db.collection('sessions').doc(sessionId)
  const sessionDoc = await sessionRef.get()

  if (!sessionDoc.exists) {
    throw new HttpsError('not-found', 'Session not found.')
  }

  const sessionData = sessionDoc.data()!
  if (sessionData.instructorId !== uid) {
    throw new HttpsError('permission-denied', 'Session does not belong to this instructor.')
  }

  // Mark session as completed
  await sessionRef.update({
    status: 'completed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  let paymentsProcessed = 0

  if (sessionData.type === 'private') {
    // Attempt credit deduction for the private client
    const success = await attemptCreditDeduction(uid, sessionData.clientId, sessionId, 'private')
    if (success) {
      paymentsProcessed++
    }
  } else if (sessionData.type === 'group') {
    // Query attendance records where attended == true
    const attendanceSnapshot = await db
      .collection('attendance')
      .where('sessionId', '==', sessionId)
      .where('attended', '==', true)
      .get()

    for (const attendanceDoc of attendanceSnapshot.docs) {
      const attendanceData = attendanceDoc.data()
      const success = await attemptCreditDeduction(
        uid,
        attendanceData.clientId,
        sessionId,
        'group'
      )
      if (success) {
        paymentsProcessed++
      }
    }
  }

  return { status: 'completed', paymentsProcessed }
})
