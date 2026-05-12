import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface CancelSessionInput {
  sessionId: string
}

async function refundCreditToClient(
  uid: string,
  clientId: string,
  type: 'private' | 'group'
): Promise<boolean> {
  // Find the most recent package: active first, then recently depleted
  const activePackages = await db
    .collection('packages')
    .where('instructorId', '==', uid)
    .where('clientId', '==', clientId)
    .where('type', '==', type)
    .where('status', '==', 'active')
    .get()

  let packageRef: FirebaseFirestore.DocumentReference

  if (!activePackages.empty) {
    packageRef = activePackages.docs[0].ref
  } else {
    // Look for recently depleted package
    const depletedPackages = await db
      .collection('packages')
      .where('instructorId', '==', uid)
      .where('clientId', '==', clientId)
      .where('type', '==', type)
      .where('status', '==', 'depleted')
      .get()

    if (depletedPackages.empty) {
      return false
    }

    // Use the most recently updated one
    const sorted = depletedPackages.docs.sort((a, b) => {
      const aTime = a.data().updatedAt?.toMillis?.() || 0
      const bTime = b.data().updatedAt?.toMillis?.() || 0
      return bTime - aTime
    })

    packageRef = sorted[0].ref
  }

  // Refund the credit
  await db.runTransaction(async (transaction) => {
    const freshPackage = await transaction.get(packageRef)
    const packageData = freshPackage.data()

    if (!packageData) return

    const newRemainingCredits = packageData.remainingCredits + 1
    const packageUpdate: Record<string, unknown> = {
      remainingCredits: newRemainingCredits,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // If package was depleted, reactivate it
    if (packageData.status === 'depleted') {
      packageUpdate.status = 'active'
    }

    transaction.update(packageRef, packageUpdate)
  })

  return true
}

export const cancelSession = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { sessionId } = request.data as CancelSessionInput

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

  if (sessionData.status !== 'scheduled') {
    throw new HttpsError('failed-precondition', 'Only scheduled sessions can be cancelled.')
  }

  // Cancel the session
  await sessionRef.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  let creditsRefunded = 0

  if (sessionData.type === 'private') {
    // Refund if payment was already made
    if (sessionData.paymentStatus === 'paid') {
      const refunded = await refundCreditToClient(uid, sessionData.clientId, 'private')
      if (refunded) {
        creditsRefunded++
        // Set session paymentStatus back to unpaid
        await sessionRef.update({ paymentStatus: 'unpaid' })
      }
    }

    // Decrement unpaidCount since cancelled sessions should not count as unpaid
    if (sessionData.paymentStatus === 'unpaid') {
      await db.collection('clients').doc(sessionData.clientId).update({
        unpaidCount: admin.firestore.FieldValue.increment(-1),
      })
    }
  } else if (sessionData.type === 'group') {
    // Query attendance for this session
    const attendanceSnapshot = await db
      .collection('attendance')
      .where('sessionId', '==', sessionId)
      .get()

    for (const attendanceDoc of attendanceSnapshot.docs) {
      const attendanceData = attendanceDoc.data()

      if (attendanceData.paymentStatus === 'paid') {
        const refunded = await refundCreditToClient(
          uid,
          attendanceData.clientId,
          'group'
        )
        if (refunded) {
          creditsRefunded++
          await attendanceDoc.ref.update({ paymentStatus: 'unpaid' })
        }
      }

      // Decrement unpaidCount for all attendance records since session is cancelled
      if (attendanceData.paymentStatus === 'unpaid') {
        await db.collection('clients').doc(attendanceData.clientId).update({
          unpaidCount: admin.firestore.FieldValue.increment(-1),
        })
      }
    }
  }

  return { success: true, creditsRefunded }
})
