import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Vinyasa Instructor, Austin',
    quote: 'YogaFlow replaced my spreadsheet, my calendar app, and my payment tracker. Everything I need is in one place.',
  },
  {
    name: 'David Chen',
    role: 'Studio Owner, Portland',
    quote: "The scheduling is intuitive and my clients love the organization. I can't imagine going back to pen and paper.",
  },
  {
    name: 'Priya Sharma',
    role: 'Private Yoga Teacher, NYC',
    quote: "Finally, a tool built for yoga instructors, not generic businesses. It understands how I actually work.",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl text-foreground">
          Loved by instructors
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
          Join yoga teachers who simplified their practice management
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="reveal rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <InitialsAvatar name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
