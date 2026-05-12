export { createRecurringSeries } from './createRecurringSeries'
export { editRecurringSeries } from './editRecurringSeries'
export { deleteRecurringSeries } from './deleteRecurringSeries'
export { extendRecurringSeries } from './extendRecurringSeries'

// Business logic functions
export { createPackage } from './createPackage'
export { deductCredit } from './deductCredit'
export { markSessionComplete } from './markSessionComplete'
export { cancelSession } from './cancelSession'
export { deleteClient } from './deleteClient'

// Firestore triggers
export { onSessionPaymentUpdate, onAttendancePaymentUpdate, onSessionCreate } from './triggers'

// Scheduled functions
export { sendNoteReminders } from './sendNoteReminders'
