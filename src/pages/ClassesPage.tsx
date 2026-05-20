import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { UsersRound, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/ui/page-header'
import type { GroupClass, Session } from '@/types'

interface ClassCardProps {
  groupClass: GroupClass
  onClick: () => void
}

function ClassCard({ groupClass, onClick }: ClassCardProps) {
  const [nextSession, setNextSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'sessions'),
      where('groupClassId', '==', groupClass.id),
      where('status', '==', 'scheduled'),
      where('date', '>=', Timestamp.fromDate(todayStart)),
      orderBy('date', 'asc'),
      limit(1)
    )
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        setNextSession({ id: snap.docs[0].id, ...snap.docs[0].data() } as Session)
      } else {
        setNextSession(null)
      }
    })
  }, [groupClass.id])

  const studentCount = groupClass.defaultRoster.length
  const capacity = groupClass.maxCapacity

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm hover:shadow-md hover:border-primary/15 active:bg-secondary transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{groupClass.name}</h3>
        <span className="shrink-0 text-sm text-muted-foreground">
          {studentCount}/{capacity} students
        </span>
      </div>

      {groupClass.location && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{groupClass.location}</span>
        </div>
      )}

      {nextSession !== undefined && (
        <p className="text-xs text-muted-foreground">
          {nextSession === null
            ? 'No upcoming sessions'
            : `Next: ${format(nextSession.date.toDate(), 'EEE, MMM d')}`}
        </p>
      )}
    </button>
  )
}

export function ClassesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<GroupClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'groupClasses'),
      where('instructorId', '==', user.uid),
      orderBy('name', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as GroupClass)
      )
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
        <div className="h-24 rounded-xl border border-border bg-card shadow-sm animate-pulse" />
        <div className="h-24 rounded-xl border border-border bg-card shadow-sm animate-pulse" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-5">
      <PageHeader
        title="Classes"
        actions={
          <Button size="sm" className="gradient-studio text-primary-foreground border-0 font-semibold shadow-md hover:opacity-90 hover:shadow-lg rounded-lg" onClick={() => navigate('/classes/new')}>
            Create Class
          </Button>
        }
      />

      {/* Empty state */}
      {classes.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          heading="No classes yet"
          description="Create a group class to manage rosters and track attendance."
          actionLabel="Create Class"
          onAction={() => navigate('/classes/new')}
        />
      ) : (
        <div className="space-y-3">
          {classes.map((gc) => (
            <ClassCard
              key={gc.id}
              groupClass={gc}
              onClick={() => navigate(`/classes/${gc.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
