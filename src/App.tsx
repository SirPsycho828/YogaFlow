import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, AuthOnlyRoute } from '@/components/layout/ProtectedRoute'
import { setupForegroundMessages } from '@/lib/messaging'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { TodayPage } from '@/pages/TodayPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientCreatePage } from '@/pages/ClientCreatePage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ClientEditPage } from '@/pages/ClientEditPage'
import { ClassesPage } from '@/pages/ClassesPage'
import { ClassCreatePage } from '@/pages/ClassCreatePage'
import { ClassDetailPage } from '@/pages/ClassDetailPage'
import { GroupSessionPage } from '@/pages/GroupSessionPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SessionCreatePage } from '@/pages/SessionCreatePage'
import { SessionDetailPage } from '@/pages/SessionDetailPage'
import { SessionEditPage } from '@/pages/SessionEditPage'
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt'
import { IOSInstallBanner } from '@/components/pwa/IOSInstallBanner'

export default function App() {
  useEffect(() => {
    setupForegroundMessages()
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/onboarding"
            element={
              <AuthOnlyRoute>
                <OnboardingPage />
              </AuthOnlyRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<TodayPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/new" element={<ClientCreatePage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientEditPage />} />
            <Route path="/sessions/new" element={<SessionCreatePage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/sessions/:id/edit" element={<SessionEditPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/classes/new" element={<ClassCreatePage />} />
            <Route path="/classes/:id" element={<ClassDetailPage />} />
            <Route path="/sessions/:id/attendance" element={<GroupSessionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-center" />
        <UpdatePrompt />
        <IOSInstallBanner />
      </AuthProvider>
    </BrowserRouter>
  )
}
