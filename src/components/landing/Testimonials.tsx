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
    <section className="py-24 sm:py-32 bg-secondary/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Testimonials
          </p>
          <h2 className="mt-3 font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground">
            Loved by Instructors
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Join yoga teachers who simplified their practice management
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="reveal glass-card rounded-2xl p-6"
            >
              {/* Star rating */}
              <div className="flex gap-0.5 text-accent mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4">
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
