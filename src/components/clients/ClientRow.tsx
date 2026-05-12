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
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-[var(--duration-fast)] hover:shadow-md hover:border-primary/15"
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
        <span className="shrink-0 rounded-full bg-[hsl(var(--status-unpaid))]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--status-unpaid))]">
          {client.unpaidCount} unpaid
        </span>
      )}
    </Link>
  )
}
