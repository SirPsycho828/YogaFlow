import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Testimonials } from '@/components/landing/Testimonials'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'
import {
  Users,
  CalendarCheck,
  Calendar,
  CreditCard,
  FileText,
  WifiOff,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Client Profiles',
    description:
      'Store contact info, health notes, and full session history for every client in one place.',
    span: 'col-span-1',
  },
  {
    icon: CalendarCheck,
    title: 'Session Scheduling',
    description:
      'Book private and group sessions with recurring schedules — weekly, biweekly, or monthly.',
    span: 'col-span-1 md:col-span-2',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    description:
      'See your week and month at a glance with session dots and duration bars.',
    span: 'col-span-1 md:col-span-2',
  },
  {
    icon: CreditCard,
    title: 'Packages & Payments',
    description:
      'Sell session packages, track credits, and know who has paid — no spreadsheets needed.',
    span: 'col-span-1',
  },
  {
    icon: FileText,
    title: 'Session Notes',
    description:
      'Add notes after sessions and review prep before the next one. Your teaching journal, built in.',
    span: 'col-span-1',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description:
      'Full offline support means your schedule is always accessible — even without signal.',
    span: 'col-span-1',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up in seconds with Google or email. No credit card required.',
  },
  {
    number: '02',
    title: 'Add Your Clients',
    description: 'Import your roster or add clients one by one with their details and preferences.',
  },
  {
    number: '03',
    title: 'Start Scheduling',
    description: 'Book sessions, set up recurring classes, and let YogaFlow handle the rest.',
  },
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = revealRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={revealRef} className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-heading text-xl text-foreground">
            YogaFlow
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-9 items-center rounded-md gradient-golden px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="sm:hidden p-2 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-3">
            <a
              href="#features"
              className="block text-sm text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block text-sm text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <div className="flex gap-3 pt-2">
              <Link
                to="/login"
                className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-border text-sm font-medium text-foreground"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex-1 inline-flex h-10 items-center justify-center rounded-md gradient-golden text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Decorative gradient orb */}
        <div
          className="absolute top-20 right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 hero-stagger">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left column: text content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Signature gradient bar */}
              <div className="mx-auto lg:mx-0 mb-8 h-1 w-16 rounded-full gradient-golden" />

              <h1 className="font-heading text-4xl leading-[1.15] text-foreground sm:text-5xl md:text-6xl">
                Your Yoga Practice,{' '}
                <span className="gradient-golden-text">Beautifully Organized</span>
              </h1>

              <p className="mx-auto lg:mx-0 mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
                Track clients, schedule sessions, manage payments — everything a solo yoga instructor
                needs, right from your phone.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex h-12 w-full items-center justify-center rounded-md gradient-golden px-8 text-base font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border bg-card px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto"
                >
                  See How It Works
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free to use. No credit card required.
              </p>
            </div>

            {/* Right column: hero image (desktop only) */}
            <div className="hidden lg:block">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&auto=format&fit=crop"
                  alt="Yoga instructor meditating with a view of lush jungle canopy in Bali"
                  className="w-full h-auto object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 reveal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Everything You Need to Run Your Practice
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Built specifically for solo yoga instructors. No bloat, no complexity — just the tools
              you actually use.
            </p>
          </div>

          {/* Lifestyle photo */}
          <div className="mt-10 mb-12 overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1677741447985-da1d90c00742?w=1200&q=80&auto=format&fit=crop"
              alt="A yoga class in session at a warm, sunlit studio"
              className="w-full h-64 sm:h-80 object-cover"
              loading="lazy"
            />
          </div>

          {/* Bento grid */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 reveal-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`reveal group rounded-xl border border-border bg-card p-6 transition-all duration-[var(--duration-normal)] hover:shadow-md hover:border-primary/20 ${feature.span}`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-secondary/40 reveal">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Up and Running in Minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              No complex setup. No training required.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center sm:text-left">
                {/* Connecting line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-border" />
                )}
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full gradient-golden text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      {/* Final CTA */}
      <section className="py-20 sm:py-28 reveal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl gradient-golden px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* Decorative circles */}
            <div className="absolute top-[-20%] right-[-10%] h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-[-15%] left-[-5%] h-48 w-48 rounded-full bg-white/10" />

            <div className="relative">
              <h2 className="font-heading text-3xl text-white sm:text-4xl">
                Ready to Simplify Your Practice?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/80">
                Join yoga instructors who manage their entire practice from their phone.
              </p>
              <Link
                to="/signup"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-base font-semibold text-primary shadow-lg transition-all hover:bg-white/90"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <p className="mt-3 text-sm text-white/60">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
