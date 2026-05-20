import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck, Calendar, Users, UsersRound, Settings } from 'lucide-react'

const tabs = [
  { to: '/today', icon: CalendarCheck, label: 'Today' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/classes', icon: UsersRound, label: 'Classes' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/today'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-3 py-2 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full gradient-studio"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
