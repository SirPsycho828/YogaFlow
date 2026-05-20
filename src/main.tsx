import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
})

// Console branding
if (typeof window !== 'undefined') {
  console.log(
    '%c' + [
      '╦ ╦╔═╗╔═╗╔═╗',
      '╚╦╝║ ║║ ╦╠═╣',
      ' ╩ ╚═╝╚═╝╩ ╩  flow',
    ].join('\n'),
    'color: #C4956A; font-family: monospace; font-size: 14px; font-weight: bold;'
  )
  console.log(
    '%cBreathe in. Schedule out.',
    'color: #8E6B4A; font-size: 12px; font-style: italic;'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
