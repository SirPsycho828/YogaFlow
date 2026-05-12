import { Link } from 'react-router-dom'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import type { Client } from '@/types'

interface ClientRowProps {
  client: Client
}

export function ClientRow({ client }: ClientRowProps) {
  return (
    <Link
      to={`/clients/${client.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/50"
    >
      <InitialsAvatar name={client.name} />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate">{client.name}</p>
        {(client.phone || client.email) && (
          <p className="text-xs text-muted-foreground truncate">
            {client.phone || client.email}
          </p>
        )}
      </div>
      {client.unpaidCount > 0 && (
        <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          {client.unpaidCount} unpaid
        </span>
      )}
    </Link>
  )
}
