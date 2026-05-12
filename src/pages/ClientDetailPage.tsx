import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCallable } from '@/hooks/useCallable'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PaymentSummary } from '@/components/payments/PaymentSummary'
import { PackageCreateSheet } from '@/components/payments/PackageCreateSheet'
import type { Client } from '@/types'

interface DeleteClientInput { clientId: string }
interface DeleteClientOutput { success: boolean }

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showPackageSheet, setShowPackageSheet] = useState(false)

  const { call: callDeleteClient, loading: deleting } = useCallable<DeleteClientInput, DeleteClientOutput>('deleteClient')

  useEffect(() => {
    if (!id || !user) return

    const unsubscribe = onSnapshot(doc(db, 'clients', id), (snapshot) => {
      if (!snapshot.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const data = { id: snapshot.id, ...snapshot.data() } as Client
      // Guard: only show if this client belongs to the current instructor
      if (data.instructorId !== user.uid) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setClient(data)
      setLoading(false)
    })

    return unsubscribe
  }, [id, user])

  async function handleArchive() {
    if (!client) return
    setArchiving(true)
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      })
      toast.success(`${client.name} archived`)
      navigate('/clients')
    } catch (err) {
      console.error('Failed to archive client:', err)
      toast.error('Failed to archive client. Please try again.')
    } finally {
      setArchiving(false)
    }
  }

  async function handleRestore() {
    if (!client) return
    setArchiving(true)
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        status: 'active',
        updatedAt: serverTimestamp(),
      })
      toast.success(`${client.name} restored`)
    } catch (err) {
      console.error('Failed to restore client:', err)
      toast.error('Failed to restore client. Please try again.')
    } finally {
      setArchiving(false)
    }
  }

  async function handleDelete() {
    if (!client) return
    const result = await callDeleteClient({ clientId: client.id })
    if (result?.success) {
      toast.success(`${client.name} deleted`)
      navigate('/clients')
    } else {
      toast.error('Failed to delete client. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
        <div className="h-10 w-48 rounded bg-secondary animate-pulse" />
        <div className="h-24 rounded-xl border border-border bg-card shadow-sm animate-pulse" />
        <div className="h-32 rounded-xl border border-border bg-card shadow-sm animate-pulse" />
      </div>
    )
  }

  if (notFound || !client) {
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

  const isArchived = client.status === 'archived'

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clients
        </button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/clients/${client.id}/edit`)}
        >
          Edit
        </Button>
      </div>

      {/* Client name + avatar */}
      <div className="flex items-center gap-4">
        <InitialsAvatar name={client.name} className="h-14 w-14 text-lg" />
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{client.name}</h1>
          {isArchived && (
            <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              Archived
            </span>
          )}
        </div>
      </div>

      {/* Contact section */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold font-heading text-foreground">Contact</h2>
        {!client.phone && !client.email ? (
          <p className="text-sm text-muted-foreground">No contact info</p>
        ) : (
          <div className="space-y-2">
            {client.phone && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">Phone</span>
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {client.email && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">Email</span>
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm text-primary underline-offset-4 hover:underline break-all"
                >
                  {client.email}
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Health Notes section */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-heading text-foreground">Health Notes</h2>
          <Link
            to={`/clients/${client.id}/edit`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Edit
          </Link>
        </div>
        {client.healthNotes ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.healthNotes}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No health notes</p>
        )}
      </section>

      {/* Payment summary */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-heading text-foreground">Payments</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPackageSheet(true)}
          >
            Create Package
          </Button>
        </div>
        <PaymentSummary
          clientId={client.id}
          unpaidCount={client.unpaidCount ?? 0}
          onCreatePackage={() => setShowPackageSheet(true)}
        />
      </section>

      <PackageCreateSheet
        clientId={client.id}
        open={showPackageSheet}
        onClose={() => setShowPackageSheet(false)}
      />

      {/* Session history placeholder */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold font-heading text-foreground">Session History</h2>
        <p className="text-sm text-muted-foreground">Session history coming soon</p>
      </section>

      {/* Actions */}
      <div className="border-t border-border pt-6 space-y-3">
        {isArchived ? (
          /* Restore */
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRestore}
            disabled={archiving}
          >
            {archiving ? 'Restoring...' : 'Restore Client'}
          </Button>
        ) : (
          /* Archive */
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={archiving}>
                Archive Client
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive {client.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  They'll be hidden from your client list. Sessions, notes, and payment history are
                  preserved. You can restore them anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="w-full text-center text-sm text-destructive hover:text-destructive/80 transition-colors py-1"
            >
              Delete Client
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {client.name} permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all their sessions, notes, attendance records, and payment history.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
