import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="h-6 w-6" />
              <span className="font-heading text-xl font-semibold text-foreground">
                YogaFlow
              </span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Practice management built for yoga instructors who want to focus on teaching, not admin.
            </p>
          </div>
          <div className="flex gap-12 text-sm text-muted-foreground">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Product</p>
              <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="block hover:text-foreground transition-colors">How It Works</a>
              <Link to="/signup" className="block hover:text-foreground transition-colors">Get Started</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal</p>
              <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} YogaFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
