import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface DeductCreditInput {
  clientId: string
  sessionId: string
  type: 'private' | 'group'
}

export const deductCredit = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { clientId, sessionId, type } = request.data as DeductCreditInput

  if (!clientId || !sessionId || !type) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  const uid = auth.uid

  // Find active package for this client + type
  const packagesSnapshot = await db
    .collection('packages')
    .where('instructorId', '==', uid)
    .where('clientId', '==', clientId)
    .where('type', '==', type)
    .where('status', '==', 'active')
    .get()

  if (packagesSnapshot.empty) {
    return { paid: false, reason: 'no_active_package' }
  }

  const packageDoc = packagesSnapshot.docs[0]
  const packageRef = packageDoc.ref

  // Use a transaction for atomicity
  const result = await db.runTransaction(async (transaction) => {
    const freshPackage = await transaction.get(packageRef)
    const packageData = freshPackage.data()

    if (!packageData || packageData.remainingCredits <= 0) {
      return { paid: false, reason: 'no_credits' }
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

    // Update payment status on session or attendance
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

    return { paid: true, remainingCredits: newRemainingCredits }
  })

  return result
})
