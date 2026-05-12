import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { RRule } from 'rrule'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface SessionDefaults {
  title?: string
  startTime?: string
  endTime?: string
  location?: string
}

interface EditSeriesInput {
  seriesId: string
  editMode: 'single' | 'future'
  sessionId: string
  updates: SessionDefaults
}

export const editRecurringSeries = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { seriesId, editMode, sessionId, updates } = request.data as EditSeriesInput

  if (!seriesId || !editMode || !sessionId || !updates) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  const uid = auth.uid

  // Verify series ownership
  const seriesDoc = await db.collection('series').doc(seriesId).get()
  if (!seriesDoc.exists || seriesDoc.data()?.instructorId !== uid) {
    throw new HttpsError('not-found', 'Series not found.')
  }

  if (editMode === 'single') {
    // Just update the single session and mark as exception
    const updateData: Record<string, unknown> = {
      ...updates,
      isException: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    await db.collection('sessions').doc(sessionId).update(updateData)
    return { updated: 1 }
  }

  // editMode === 'future'
  const seriesData = seriesDoc.data()!
  const rruleStr = seriesData.rrule as string
  const type = seriesData.type as 'private' | 'group'
  const linkedId = seriesData.linkedId as string

  // Get the edited session's date to determine the cutoff
  const sessionDoc = await db.collection('sessions').doc(sessionId).get()
  if (!sessionDoc.exists) {
    throw new HttpsError('not-found', 'Session not found.')
  }
  const sessionData = sessionDoc.data()!
  const cutoffDate = sessionData.date.toDate() as Date

  // Update series sessionDefaults with the new values
  const currentDefaults = seriesData.sessionDefaults as Record<string, string>
  const newDefaults = { ...currentDefaults, ...updates }

  await db.collection('series').doc(seriesId).update({
    sessionDefaults: newDefaults,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Query all future non-exception sessions in this series
  const futureSessionsQuery = await db
    .collection('sessions')
    .where('seriesId', '==', seriesId)
    .where('status', '==', 'scheduled')
    .where('isException', '==', false)
    .get()

  // Filter to sessions on or after the cutoff date
  const sessionsToDelete = futureSessionsQuery.docs.filter((doc) => {
    const docDate = doc.data().date.toDate() as Date
    return docDate >= cutoffDate
  })

  // Delete future sessions and their attendance records
  const batch = db.batch()
  for (const sessionSnap of sessionsToDelete) {
    // Delete attendance records for group sessions
    if (type === 'group') {
      const attendanceQuery = await db
        .collection('attendance')
        .where('sessionId', '==', sessionSnap.id)
        .get()
      for (const attDoc of attendanceQuery.docs) {
        batch.delete(attDoc.ref)
      }
    }
    batch.delete(sessionSnap.ref)
  }

  await batch.commit()

  // Regenerate sessions from the cutoff date using RRULE
  const now = new Date()
  const horizon = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
  const generateFrom = cutoffDate > now ? cutoffDate : now

  let rule: RRule
  try {
    const ruleString = rruleStr.startsWith('DTSTART')
      ? rruleStr
      : `DTSTART:${formatRRuleDate(generateFrom)}\nRRULE:${rruleStr}`
    rule = RRule.fromString(ruleString)
  } catch (err) {
    throw new HttpsError('internal', `Failed to parse RRULE: ${err}`)
  }

  const dates = rule.between(generateFrom, horizon, true)

  // Get default roster for group classes
  let defaultRoster: string[] = []
  if (type === 'group') {
    const classDoc = await db.collection('groupClasses').doc(linkedId).get()
    if (classDoc.exists) {
      defaultRoster = classDoc.data()?.defaultRoster || []
    }
  }

  const regenBatch = db.batch()
  let sessionsCreated = 0

  for (const date of dates) {
    const sessionDate = new Date(date)
    sessionDate.setHours(0, 0, 0, 0)

    const sessionRef = db.collection('sessions').doc()
    const sessionDoc: Record<string, unknown> = {
      instructorId: uid,
      type,
      clientId: type === 'private' ? linkedId : null,
      groupClassId: type === 'group' ? linkedId : null,
      title: newDefaults.title,
      date: admin.firestore.Timestamp.fromDate(sessionDate),
      startTime: newDefaults.startTime,
      endTime: newDefaults.endTime,
      location: newDefaults.location || '',
      status: 'scheduled',
      paymentStatus: 'unpaid',
      notes: '',
      seriesId,
      isException: false,
      cancelledAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    regenBatch.set(sessionRef, sessionDoc)
    sessionsCreated++

    if (type === 'group' && defaultRoster.length > 0) {
      for (const clientId of defaultRoster) {
        const attendanceRef = db.collection('attendance').doc()
        regenBatch.set(attendanceRef, {
          instructorId: uid,
          sessionId: sessionRef.id,
          clientId,
          attended: false,
          paymentStatus: 'unpaid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }
  }

  // Update generatedUntil
  if (dates.length > 0) {
    regenBatch.update(db.collection('series').doc(seriesId), {
      generatedUntil: admin.firestore.Timestamp.fromDate(dates[dates.length - 1]),
    })
  }

  await regenBatch.commit()

  return { deleted: sessionsToDelete.length, regenerated: sessionsCreated }
})

function formatRRuleDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${h}${min}${s}Z`
}
