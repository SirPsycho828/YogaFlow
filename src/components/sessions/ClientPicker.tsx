import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { ChevronDown, Search } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import type { Client } from '@/types'

interface ClientPickerProps {
  value: string | null
  onChange: (clientId: string, clientName: string) => void
}

export function ClientPicker({ value, onChange }: ClientPickerProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'clients'),
      where('instructorId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('name')
    )
    getDocs(q)
      .then((snapshot) => {
        setClients(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Client)
        )
      })
      .finally(() => setLoading(false))
  }, [user])

  // Focus the search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setSearch('')
    }
  }, [open])

  const selectedClient = clients.find((c) => c.id === value)

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(client: Client) {
    onChange(client.id, client.name)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selectedClient ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedClient ? selectedClient.name : 'Select client...'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {/* Search */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="h-10 border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        {/* List */}
        <div className="max-h-60 overflow-y-auto py-1">
          {loading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : clients.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center space-y-1">
              <p className="text-muted-foreground">No clients yet</p>
              <a
                href="/clients/new"
                className="text-primary text-sm hover:underline"
                onClick={() => setOpen(false)}
              >
                Add a client
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No clients match "{search}"
            </div>
          ) : (
            filtered.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                  client.id === value ? 'bg-accent/50 font-medium' : ''
                }`}
              >
                {client.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
