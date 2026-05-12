import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Client } from '@/types'

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [original, setOriginal] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    healthNotes: '',
  })

  useEffect(() => {
    if (!id || !user) return

    async function fetchClient() {
      try {
        const snapshot = await getDoc(doc(db, 'clients', id!))
        if (!snapshot.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const data = { id: snapshot.id, ...snapshot.data() } as Client
        if (data.instructorId !== user!.uid) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setOriginal(data)
        setForm({
          name: data.name,
          phone: data.phone,
          email: data.email,
          healthNotes: data.healthNotes,
        })
        setLoading(false)
      } catch (err) {
        console.error('Failed to load client:', err)
        setNotFound(true)
        setLoading(false)
      }
    }

    fetchClient()
  }, [id, user])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!original) return

    // Build an object of only changed fields
    const changes: Record<string, string> = {}
    if (form.name.trim() !== original.name) changes.name = form.name.trim()
    if (form.phone.trim() !== original.phone) changes.phone = form.phone.trim()
    if (form.email.trim() !== original.email) changes.email = form.email.trim()
    if (form.healthNotes.trim() !== original.healthNotes)
      changes.healthNotes = form.healthNotes.trim()

    if (Object.keys(changes).length === 0) {
      // Nothing changed — just go back
      navigate(`/clients/${original.id}`)
      return
    }

    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'clients', original.id), {
        ...changes,
        updatedAt: serverTimestamp(),
      })
      toast.success('Client updated')
      navigate(`/clients/${original.id}`)
    } catch (err) {
      console.error('Failed to update client:', err)
      toast.error('Failed to update client. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
        <div className="h-10 w-48 rounded bg-secondary animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !original) {
    return (
      <div className="py-6 space-y-4">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clients
        </button>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/clients/${original.id}`)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {original.name}
        </button>
      </div>

      <h1 className="text-2xl font-bold text-foreground">Edit Client</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">
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
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 000 0000"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="client@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* Health Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="healthNotes">Health Notes</Label>
          <Textarea
            id="healthNotes"
            name="healthNotes"
            placeholder="Injuries, limitations, goals..."
            value={form.healthNotes}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/clients/${original.id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={submitting || !form.name.trim()}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
