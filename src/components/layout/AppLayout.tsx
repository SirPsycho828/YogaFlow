import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { VerificationBanner } from './VerificationBanner'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="mx-auto max-w-lg px-4 pt-3">
        <VerificationBanner />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
