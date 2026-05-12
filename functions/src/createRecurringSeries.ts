import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { RRule } from 'rrule'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface SessionDefaults {
  title: string
  startTime: string
  endTime: string
  location?: string
}

interface CreateSeriesInput {
  rrule: string
  type: 'private' | 'group'
  linkedId: string
  sessionDefaults: SessionDefaults
}

export const createRecurringSeries = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.')
  }

  const { rrule: rruleStr, type, linkedId, sessionDefaults } = request.data as CreateSeriesInput

  if (!rruleStr || !type || !linkedId || !sessionDefaults) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  const uid = auth.uid
  const now = new Date()
  const horizon = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  // Create series document
  const seriesRef = db.collection('series').doc()
  const seriesData = {
    instructorId: uid,
    rrule: rruleStr,
    type,
    linkedId,
    sessionDefaults,
    generatedUntil: admin.firestore.Timestamp.fromDate(now),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  // Parse RRULE and generate dates
  let rule: RRule
  try {
    // Ensure the RRULE string has proper prefix for parsing
    const ruleString = rruleStr.startsWith('DTSTART')
      ? rruleStr
      : `DTSTART:${formatRRuleDate(now)}\nRRULE:${rruleStr}`
    rule = RRule.fromString(ruleString)
  } catch (err) {
    throw new HttpsError('invalid-argument', `Invalid RRULE string: ${err}`)
  }

  const dates = rule.between(now, horizon, true)

  // Get default roster for group classes
  let defaultRoster: string[] = []
  if (type === 'group') {
    const classDoc = await db.collection('groupClasses').doc(linkedId).get()
    if (classDoc.exists) {
      defaultRoster = classDoc.data()?.defaultRoster || []
    }
  }

  // Batch write all sessions (and attendance for group)
  const batch = db.batch()

  // Write series document
  batch.set(seriesRef, seriesData)

  let sessionsCreated = 0
  let lastDate = now

  for (const date of dates) {
    const sessionDate = new Date(date)
    sessionDate.setHours(0, 0, 0, 0)

    const sessionRef = db.collection('sessions').doc()
    const sessionData: Record<string, unknown> = {
      instructorId: uid,
      type,
      clientId: type === 'private' ? linkedId : null,
      groupClassId: type === 'group' ? linkedId : null,
      title: sessionDefaults.title,
      date: admin.firestore.Timestamp.fromDate(sessionDate),
      startTime: sessionDefaults.startTime,
      endTime: sessionDefaults.endTime,
      location: sessionDefaults.location || '',
      status: 'scheduled',
      paymentStatus: 'unpaid',
      notes: '',
      seriesId: seriesRef.id,
      isException: false,
      cancelledAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    batch.set(sessionRef, sessionData)
    sessionsCreated++

    // Create attendance records for group classes
    if (type === 'group' && defaultRoster.length > 0) {
      for (const clientId of defaultRoster) {
        const attendanceRef = db.collection('attendance').doc()
        batch.set(attendanceRef, {
          instructorId: uid,
          sessionId: sessionRef.id,
          clientId,
          attended: false,
          paymentStatus: 'unpaid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }

    if (date > lastDate) {
      lastDate = date
    }
  }

  // Update generatedUntil on the series
  batch.update(seriesRef, {
    generatedUntil: admin.firestore.Timestamp.fromDate(lastDate),
  })

  await batch.commit()

  return { seriesId: seriesRef.id, sessionsCreated }
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
