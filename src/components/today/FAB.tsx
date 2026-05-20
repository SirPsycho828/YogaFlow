import { Plus, User, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FABProps {
  selectedDate: Date
}

export function FAB({ selectedDate }: FABProps) {
  const navigate = useNavigate()
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Add session"
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+16px)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-golden text-white shadow-lg transition-transform active:scale-95 hover:opacity-90"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="min-w-[180px]">
        <DropdownMenuItem
          onClick={() => navigate(`/sessions/new?date=${dateStr}`)}
        >
          <User className="h-4 w-4" />
          Private Session
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(`/classes/new?date=${dateStr}`)}
        >
          <Users className="h-4 w-4" />
          Group Class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
