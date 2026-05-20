import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { Search, UserPlus } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientRow } from '@/components/clients/ClientRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/ui/page-header'
import type { Client } from '@/types'

export function ClientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', showArchived ? 'archived' : 'active'),
      orderBy('name')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      setClients(data)
      setLoading(false)
    })

    return unsubscribe
  }, [user, showArchived])

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="py-6 space-y-4">
      <PageHeader
        title="Clients"
        actions={
          <Button size="sm" className="gradient-golden text-white border-0 font-semibold shadow-md hover:opacity-90 hover:shadow-lg rounded-lg" onClick={() => navigate('/clients/new')}>
            <UserPlus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-12 rounded-lg border-input bg-card shadow-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[68px] rounded-xl border border-border bg-card shadow-sm animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          heading={search ? 'No clients found' : showArchived ? 'No archived clients' : 'No clients yet'}
          description={
            search
              ? 'Try a different name.'
              : showArchived
              ? 'Archived clients will appear here.'
              : 'Add your first client to get started.'
          }
          actionLabel={!search && !showArchived ? 'Add Client' : undefined}
          onAction={!search && !showArchived ? () => navigate('/clients/new') : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <ClientRow key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Archived toggle */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {showArchived ? 'Show active clients' : 'Show archived clients'}
        </button>
      </div>
    </div>
  )
}
