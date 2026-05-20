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
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Client Profiles',
    description:
      'Store contact info, health notes, and full session history for every client in one place.',
  },
  {
    icon: CalendarCheck,
    title: 'Session Scheduling',
    description:
      'Book private and group sessions with recurring schedules — weekly, biweekly, or monthly.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    description:
      'See your week and month at a glance with session dots and duration bars.',
  },
  {
    icon: CreditCard,
    title: 'Packages & Payments',
    description:
      'Sell session packages, track credits, and know who has paid — no spreadsheets needed.',
  },
  {
    icon: FileText,
    title: 'Session Notes',
    description:
      'Add notes after sessions and review prep before the next one. Your teaching journal, built in.',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description:
      'Full offline support means your schedule is always accessible — even without signal.',
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
  const [scrolled, setScrolled] = useState(false)
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    <div ref={revealRef} className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="font-heading text-xl font-semibold text-foreground">
              YogaFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-9 items-center rounded-lg gradient-studio px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border px-4 pb-5 pt-3 space-y-3">
            <a
              href="#features"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
            <div className="flex gap-3 pt-3 border-t border-border">
              <Link
                to="/login"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-lg gradient-studio text-sm font-semibold text-primary-foreground"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section — Full-Bleed with Dark Overlay */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/feature-meditation.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1210]/70 via-[#1A1210]/50 to-[#1A1210]/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center hero-stagger">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Built for solo yoga instructors
          </div>

          <h1 className="mt-8 font-heading text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Your Practice,{' '}
            <span className="text-[#C4956A]">Beautifully Organized</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 sm:text-xl">
            Track clients, schedule sessions, manage payments — everything you need to run
            your yoga business, right from your phone.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg gradient-studio px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:opacity-90 hover:shadow-xl sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/25 bg-white/10 backdrop-blur-sm px-8 text-base font-medium text-white transition-all hover:bg-white/20 sm:w-auto"
            >
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-sm text-white/50">
            Free to use. No credit card required.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/30 p-1">
            <div className="h-2 w-1.5 mx-auto rounded-full bg-white/50 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative -mt-12 z-20 reveal">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="glass-card rounded-2xl px-6 py-8 sm:px-10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground sm:text-3xl font-heading">500+</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Active Instructors</p>
              </div>
              <div className="border-x border-border">
                <p className="text-2xl font-bold text-foreground sm:text-3xl font-heading">10k+</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Sessions Booked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground sm:text-3xl font-heading">4.9</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 reveal">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Features
            </p>
            <h2 className="mt-3 font-heading text-3xl text-foreground sm:text-4xl lg:text-5xl">
              Everything You Need to Run Your Practice
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Built specifically for solo yoga instructors. No bloat, no complexity — just the
              tools you actually use.
            </p>
          </div>

          {/* Feature showcase with image */}
          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 reveal">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/images/hero-yoga-studio.jpg"
                alt="Yoga instructor in a downward dog pose in a professional studio"
                className="h-full w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
            <div className="space-y-6">
              {features.slice(0, 3).map((feature) => (
                <div
                  key={feature.title}
                  className="group flex gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-card hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg gradient-studio">
                    <feature.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Second row — reversed */}
          <div className="mt-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 reveal">
            <div className="order-2 lg:order-1 space-y-6">
              {features.slice(3).map((feature) => (
                <div
                  key={feature.title}
                  className="group flex gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-card hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg gradient-studio">
                    <feature.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2 overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/images/feature-group-class.jpg"
                alt="Yoga instructor connecting with a student in a sunlit brick studio"
                className="h-full w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32 reveal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              How It Works
            </p>
            <h2 className="mt-3 font-heading text-3xl text-foreground sm:text-4xl lg:text-5xl">
              Up and Running in Minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              No complex setup. No training required.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="reveal relative text-center">
                {/* Connecting line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border" />
                )}
                <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full gradient-studio text-lg font-bold text-primary-foreground shadow-md">
                  {step.number}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground font-heading">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      {/* Final CTA */}
      <section className="py-24 sm:py-32 reveal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src="/images/feature-yoga-practice.jpg"
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#3D2B1F]/90 to-[#3D2B1F]/75" />
            </div>

            <div className="relative px-6 py-20 text-center sm:px-12 sm:py-24">
              <h2 className="font-heading text-3xl text-white sm:text-4xl lg:text-5xl">
                Ready to Simplify Your Practice?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/75">
                Join yoga instructors who manage their entire practice from their phone.
              </p>
              <Link
                to="/signup"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <p className="mt-4 text-sm text-white/50">
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
