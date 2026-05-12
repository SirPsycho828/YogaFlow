import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

/**
 * Trigger: when a private session's paymentStatus changes,
 * update the client's unpaidCount accordingly.
 */
export const onSessionPaymentUpdate = onDocumentUpdated(
  'sessions/{sessionId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()

    if (!before || !after) return

    // Only handle private sessions
    if (after.type !== 'private') return

    const oldPaymentStatus = before.paymentStatus
    const newPaymentStatus = after.paymentStatus

    // No change in paymentStatus
    if (oldPaymentStatus === newPaymentStatus) return

    const clientId = after.clientId
    if (!clientId) return

    const clientRef = db.collection('clients').doc(clientId)

    if (oldPaymentStatus === 'unpaid' && newPaymentStatus === 'paid') {
      await clientRef.update({
        unpaidCount: admin.firestore.FieldValue.increment(-1),
      })
    } else if (oldPaymentStatus === 'paid' && newPaymentStatus === 'unpaid') {
      await clientRef.update({
        unpaidCount: admin.firestore.FieldValue.increment(1),
      })
    }
  }
)

/**
 * Trigger: when an attendance record's paymentStatus changes,
 * update the client's unpaidCount accordingly (for group sessions).
 */
export const onAttendancePaymentUpdate = onDocumentUpdated(
  'attendance/{attendanceId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()

    if (!before || !after) return

    const oldPaymentStatus = before.paymentStatus
    const newPaymentStatus = after.paymentStatus

    // No change in paymentStatus
    if (oldPaymentStatus === newPaymentStatus) return

    const clientId = after.clientId
    if (!clientId) return

    const clientRef = db.collection('clients').doc(clientId)

    if (oldPaymentStatus === 'unpaid' && newPaymentStatus === 'paid') {
      await clientRef.update({
        unpaidCount: admin.firestore.FieldValue.increment(-1),
      })
    } else if (oldPaymentStatus === 'paid' && newPaymentStatus === 'unpaid') {
      await clientRef.update({
        unpaidCount: admin.firestore.FieldValue.increment(1),
      })
    }
  }
)

/**
 * Trigger: when a new private session is created with unpaid status,
 * increment the client's unpaidCount.
 */
export const onSessionCreate = onDocumentCreated(
  'sessions/{sessionId}',
  async (event) => {
    const data = event.data?.data()

    if (!data) return

    // Only handle private sessions with unpaid status
    if (data.type !== 'private') return
    if (data.paymentStatus !== 'unpaid') return

    const clientId = data.clientId
    if (!clientId) return

    const clientRef = db.collection('clients').doc(clientId)
    await clientRef.update({
      unpaidCount: admin.firestore.FieldValue.increment(1),
    })
  }
)
