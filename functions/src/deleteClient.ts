import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface DeleteClientInput {
  clientId: string
}

async function deleteInBatches(
  query: FirebaseFirestore.Query
): Promise<number> {
  let totalDeleted = 0

  while (true) {
    const snapshot = await query.limit(500).get()
    if (snapshot.empty) break

    const batch = db.batch()
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref)
    }
    await batch.commit()
    totalDeleted += snapshot.size

    if (snapshot.size < 500) break
  }

  return totalDeleted
}

export const deleteClient = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { clientId } = request.data as DeleteClientInput

  if (!clientId) {
    throw new HttpsError('invalid-argument', 'Missing clientId.')
  }

  const uid = auth.uid

  // Verify client belongs to this instructor
  const clientRef = db.collection('clients').doc(clientId)
  const clientDoc = await clientRef.get()

  if (!clientDoc.exists) {
    throw new HttpsError('not-found', 'Client not found.')
  }

  if (clientDoc.data()?.instructorId !== uid) {
    throw new HttpsError('permission-denied', 'Client does not belong to this instructor.')
  }

  // Delete all related sessions
  const sessionsQuery = db
    .collection('sessions')
    .where('clientId', '==', clientId)
  const sessionsDeleted = await deleteInBatches(sessionsQuery)

  // Delete all related attendance records
  const attendanceQuery = db
    .collection('attendance')
    .where('clientId', '==', clientId)
  const attendanceDeleted = await deleteInBatches(attendanceQuery)

  // Delete all related packages
  const packagesQuery = db
    .collection('packages')
    .where('clientId', '==', clientId)
  const packagesDeleted = await deleteInBatches(packagesQuery)

  // Remove from group class rosters
  const groupClassesSnapshot = await db
    .collection('groupClasses')
    .where('defaultRoster', 'array-contains', clientId)
    .get()

  if (!groupClassesSnapshot.empty) {
    // Chunk into batches of 500
    const docs = groupClassesSnapshot.docs
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500)
      const batch = db.batch()
      for (const doc of chunk) {
        batch.update(doc.ref, {
          defaultRoster: admin.firestore.FieldValue.arrayRemove(clientId),
        })
      }
      await batch.commit()
    }
  }

  // Delete the client document
  await clientRef.delete()

  return {
    success: true,
    deletedCounts: {
      sessions: sessionsDeleted,
      attendance: attendanceDeleted,
      packages: packagesDeleted,
    },
  }
})
