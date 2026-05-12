import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import { RRule } from 'rrule'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

export const extendRecurringSeries = onSchedule('every day 02:00', async () => {
  const now = new Date()
  const horizon = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  // Query all series where generatedUntil < horizon
  const seriesQuery = await db
    .collection('series')
    .where('generatedUntil', '<', admin.firestore.Timestamp.fromDate(horizon))
    .get()

  for (const seriesSnap of seriesQuery.docs) {
    const seriesData = seriesSnap.data()
    const seriesId = seriesSnap.id
    const rruleStr = seriesData.rrule as string
    const type = seriesData.type as 'private' | 'group'
    const linkedId = seriesData.linkedId as string
    const sessionDefaults = seriesData.sessionDefaults as {
      title: string
      startTime: string
      endTime: string
      location?: string
    }
    const generatedUntil = (seriesData.generatedUntil as admin.firestore.Timestamp).toDate()
    const instructorId = seriesData.instructorId as string

    // Parse RRULE
    let rule: RRule
    try {
      const ruleString = rruleStr.startsWith('DTSTART')
        ? rruleStr
        : `DTSTART:${formatRRuleDate(generatedUntil)}\nRRULE:${rruleStr}`
      rule = RRule.fromString(ruleString)
    } catch {
      console.error(`Failed to parse RRULE for series ${seriesId}: ${rruleStr}`)
      continue
    }

    // Generate dates between generatedUntil and horizon
    const dates = rule.between(generatedUntil, horizon, false) // exclusive of start

    if (dates.length === 0) continue

    // Check for existing sessions on these dates to avoid duplicates
    const existingQuery = await db
      .collection('sessions')
      .where('seriesId', '==', seriesId)
      .where('status', '==', 'scheduled')
      .get()

    const existingDates = new Set(
      existingQuery.docs.map((doc) => {
        const d = doc.data().date.toDate() as Date
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )

    // Get default roster for group classes
    let defaultRoster: string[] = []
    if (type === 'group') {
      const classDoc = await db.collection('groupClasses').doc(linkedId).get()
      if (classDoc.exists) {
        defaultRoster = classDoc.data()?.defaultRoster || []
      }
    }

    const batch = db.batch()
    let sessionsCreated = 0
    let lastDate = generatedUntil

    for (const date of dates) {
      const sessionDate = new Date(date)
      sessionDate.setHours(0, 0, 0, 0)

      // Skip if a session already exists for this date
      const dateKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}-${sessionDate.getDate()}`
      if (existingDates.has(dateKey)) continue

      const sessionRef = db.collection('sessions').doc()
      const sessionDoc: Record<string, unknown> = {
        instructorId,
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
        seriesId,
        isException: false,
        cancelledAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      batch.set(sessionRef, sessionDoc)
      sessionsCreated++

      if (type === 'group' && defaultRoster.length > 0) {
        for (const clientId of defaultRoster) {
          const attendanceRef = db.collection('attendance').doc()
          batch.set(attendanceRef, {
            instructorId,
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

    if (sessionsCreated > 0) {
      batch.update(seriesSnap.ref, {
        generatedUntil: admin.firestore.Timestamp.fromDate(lastDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      await batch.commit()
      console.log(`Extended series ${seriesId}: created ${sessionsCreated} sessions`)
    }
  }
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
