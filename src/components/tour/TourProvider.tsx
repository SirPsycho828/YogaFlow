import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride'
import { TourTooltip } from './TourTooltip'

const TOUR_COMPLETED_KEY = 'yogaflow-tour-completed'
const TOUR_PENDING_KEY = 'yogaflow-tour-pending'

const steps: Step[] = [
  {
    target: '[data-tour="nav-today"]',
    title: 'Your Day at a Glance',
    content: 'See all of today\'s sessions in one place. Track what\'s done and what\'s coming up next.',
    placement: 'top',
  },
  {
    target: '[data-tour="fab"]',
    title: 'Quick Add',
    content: 'Tap here anytime to schedule a new private session or group class.',
    placement: 'left',
  },
  {
    target: '[data-tour="nav-calendar"]',
    title: 'Your Calendar',
    content: 'Browse sessions by date. Green dots are private sessions, blue dots are group classes.',
    placement: 'top',
  },
  {
    target: '[data-tour="nav-clients"]',
    title: 'Your Clients',
    content: 'Manage client profiles, health notes, and session packages all in one place.',
    placement: 'top',
  },
  {
    target: '[data-tour="nav-classes"]',
    title: 'Group Classes',
    content: 'Create recurring group classes, manage rosters, and track attendance.',
    placement: 'top',
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'Your Settings',
    content: 'Manage your profile, notification preferences, and replay this tour anytime.',
    placement: 'top',
  },
]

interface TourContextType {
  startTour: () => void
}

const TourContext = createContext<TourContextType | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Auto-start: check for pending flag on mount
  useEffect(() => {
    const pending = localStorage.getItem(TOUR_PENDING_KEY)
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY)

    if (pending === 'true' && completed !== 'true') {
      const timer = setTimeout(() => {
        localStorage.removeItem(TOUR_PENDING_KEY)
        setStepIndex(0)
        setRun(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const startTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    setStepIndex(0)
    setRun(true)
  }, [])

  function handleEvent(data: EventData) {
    const { status, type, index, action } = data

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false)
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
      localStorage.removeItem(TOUR_PENDING_KEY)
      return
    }

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as typeof EVENTS.STEP_AFTER)) {
      setStepIndex(index + (action === 'prev' ? -1 : 1))
    }
  }

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      <Joyride
        continuous
        run={run}
        stepIndex={stepIndex}
        steps={steps}
        onEvent={handleEvent}
        tooltipComponent={TourTooltip}
        scrollToFirstStep={false}
        options={{
          skipBeacon: true,
          skipScroll: true,
          overlayClickAction: false,
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          spotlightPadding: 4,
          zIndex: 10000,
        }}
      />
    </TourContext.Provider>
  )
}

/** Set the pending flag so the tour auto-starts on next mount of TourProvider */
export function scheduleTour() {
  localStorage.setItem(TOUR_PENDING_KEY, 'true')
}
