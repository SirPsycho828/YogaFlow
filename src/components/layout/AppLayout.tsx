import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { VerificationBanner } from './VerificationBanner'
import { PageTransition } from './PageTransition'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background pb-20 pt-[env(safe-area-inset-top)]">
      <main className="mx-auto max-w-lg px-4 pt-3">
        <VerificationBanner />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
