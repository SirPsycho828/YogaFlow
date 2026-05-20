import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  { q: 'Is YogaFlow really free?', a: 'Yes! YogaFlow is free to use for solo yoga instructors. We may introduce premium features in the future, but the core scheduling and client management tools will always be free.' },
  { q: 'Does it work offline?', a: 'Yes. YogaFlow works offline so you can manage sessions even without internet. Your data syncs automatically when you reconnect.' },
  { q: 'Can I use it for group classes?', a: 'Absolutely. Create group classes with rosters, track attendance, and manage capacity all in one place.' },
  { q: 'Is my data secure?', a: 'Your data is stored securely on Google Cloud infrastructure with encryption at rest and in transit. We never share your data with third parties.' },
  { q: 'Can I access it on my phone?', a: "YogaFlow is a progressive web app — install it on your phone's home screen and it works just like a native app." },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl text-foreground">
          Questions & answers
        </h2>
        <div className="mt-12 space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="reveal rounded-xl border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    open === i && 'rotate-180',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
