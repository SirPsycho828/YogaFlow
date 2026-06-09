import { Timestamp } from 'firebase/firestore'

export interface Instructor {
  uid: string
  email: string
  displayName: string
  onboardingComplete: boolean
  setupWizardComplete?: boolean
  fcmToken?: string
  notificationsEnabled?: boolean
  experienceLevel?: 'beginner' | 'intermediate' | 'experienced'
  classTypes?: string[]
  timezone?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Client {
  id: string
  instructorId: string
  name: string
  email: string
  phone: string
  healthNotes: string
  status: 'active' | 'archived'
  unpaidCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Session {
  id: string
  instructorId: string
  type: 'private' | 'group'
  clientId: string | null
  groupClassId: string | null
  title: string
  date: Timestamp
  startTime: string // HH:mm format, local time
  endTime: string // HH:mm format, local time
  location: string
  status: 'scheduled' | 'completed' | 'cancelled'
  paymentStatus: 'paid' | 'unpaid'
  notes: string
  seriesId: string | null
  isException: boolean
  cancelledAt: Timestamp | null
  reminderSent?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface GroupClass {
  id: string
  instructorId: string
  name: string
  maxCapacity: number
  defaultRoster: string[] // array of clientIds
  location: string
  seriesId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Attendance {
  id: string
  instructorId: string
  sessionId: string
  clientId: string
  attended: boolean
  paymentStatus: 'paid' | 'unpaid'
  createdAt: Timestamp
}

export interface Series {
  id: string
  instructorId: string
  rrule: string // RRuleJS-compatible RRULE string
  type: 'private' | 'group'
  linkedId: string // clientId (private) or groupClassId (group)
  sessionDefaults: SessionDefaults
  generatedUntil: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SessionDefaults {
  title: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  location?: string
}

export interface Package {
  id: string
  instructorId: string
  clientId: string
  type: 'private' | 'group'
  totalCredits: number
  remainingCredits: number
  status: 'active' | 'depleted'
  createdAt: Timestamp
  updatedAt: Timestamp
}
