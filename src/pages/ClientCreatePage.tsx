import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ClientCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    healthNotes: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        instructorId: user.uid,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        healthNotes: form.healthNotes.trim(),
        status: 'active',
        unpaidCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast.success('Client added')
      navigate(`/clients/${docRef.id}`)
    } catch (err) {
      console.error('Failed to create client:', err)
      toast.error('Failed to add client. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clients
        </button>
      </div>

      <h1 className="text-2xl font-bold font-heading text-foreground">New Client</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium tracking-wide text-muted-foreground">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
            autoFocus
            className="h-12 rounded-lg border-input bg-card shadow-sm"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-medium tracking-wide text-muted-foreground">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 000 0000"
            value={form.phone}
            onChange={handleChange}
            className="h-12 rounded-lg border-input bg-card shadow-sm"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium tracking-wide text-muted-foreground">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="client@example.com"
            value={form.email}
            onChange={handleChange}
            className="h-12 rounded-lg border-input bg-card shadow-sm"
          />
        </div>

        {/* Health Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="healthNotes" className="text-xs font-medium tracking-wide text-muted-foreground">Health Notes</Label>
          <Textarea
            id="healthNotes"
            name="healthNotes"
            placeholder="Injuries, limitations, goals..."
            value={form.healthNotes}
            onChange={handleChange}
            rows={4}
            className="rounded-lg border-input bg-card shadow-sm"
          />
        </div>

        <Button
          type="submit"
          className="w-full gradient-studio text-primary-foreground border-0 font-semibold shadow-md hover:opacity-90 hover:shadow-lg rounded-lg"
          disabled={submitting || !form.name.trim()}
        >
          {submitting ? 'Adding...' : 'Add Client'}
        </Button>
      </form>
    </div>
  )
}
