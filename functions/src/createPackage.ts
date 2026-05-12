import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface CreatePackageInput {
  clientId: string
  type: 'private' | 'group'
  totalCredits: number
}

export const createPackage = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { clientId, type, totalCredits } = request.data as CreatePackageInput

  if (!clientId || !type || !totalCredits) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  if (type !== 'private' && type !== 'group') {
    throw new HttpsError('invalid-argument', 'Type must be "private" or "group".')
  }

  if (totalCredits <= 0) {
    throw new HttpsError('invalid-argument', 'totalCredits must be greater than 0.')
  }

  const uid = auth.uid

  // Verify client belongs to this instructor
  const clientDoc = await db.collection('clients').doc(clientId).get()
  if (!clientDoc.exists) {
    throw new HttpsError('not-found', 'Client not found.')
  }
  if (clientDoc.data()?.instructorId !== uid) {
    throw new HttpsError('permission-denied', 'Client does not belong to this instructor.')
  }

  // Check for existing active package of same type
  const existingPackages = await db
    .collection('packages')
    .where('clientId', '==', clientId)
    .where('type', '==', type)
    .where('status', '==', 'active')
    .get()

  if (!existingPackages.empty) {
    throw new HttpsError(
      'already-exists',
      `Client already has an active ${type} package.`
    )
  }

  // Create the package
  const packageRef = db.collection('packages').doc()
  const packageData = {
    instructorId: uid,
    clientId,
    type,
    totalCredits,
    remainingCredits: totalCredits,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await packageRef.set(packageData)

  return { id: packageRef.id, ...packageData }
})
