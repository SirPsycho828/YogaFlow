import { useState } from 'react'
import { X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function VerificationBanner() {
  const { user, resendVerification } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  // Only show for email/password users who haven't verified
  // Google sign-in users are always verified
  if (!user || user.emailVerified || dismissed) return null

  const handleResend = async () => {
    setSending(true)
    try {
      await resendVerification()
      toast.success('Verification email sent')
    } catch {
      toast.error('Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
      <Mail className="h-4 w-4 shrink-0 text-accent-foreground" />
      <div className="flex-1 text-sm text-accent-foreground">
        <span>Verify your email. </span>
        <button
          className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Resend verification email'}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-accent-foreground hover:text-foreground hover:bg-accent/20"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
