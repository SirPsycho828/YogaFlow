import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-heading text-xl text-foreground">YogaFlow</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice management for yoga instructors
            </p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Product</p>
              <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="block hover:text-foreground transition-colors">How It Works</a>
              <Link to="/signup" className="block hover:text-foreground transition-colors">Get Started</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Legal</p>
              <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} YogaFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
