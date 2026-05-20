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
    <section id="faq" className="py-24 sm:py-32 bg-secondary/30">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground">
            Questions & Answers
          </h2>
        </div>
        <div className="mt-14 space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="reveal glass-card rounded-xl">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
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
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
