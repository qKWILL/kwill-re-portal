'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  TeamMemberCard,
  type PortalTeamCard,
} from '@/components/team/TeamMemberCard'
import { TeamMemberRow } from '@/components/team/TeamMemberRow'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'

export type PortalTeamRow = PortalTeamCard & {
  user_id: string | null
  tags: string[]
}

export default function TeamClient({
  members,
  currentUserId,
  isAdmin,
  currentView,
}: {
  members: PortalTeamRow[]
  currentUserId: string
  isAdmin: boolean
  currentView: ViewMode
}) {
  const pathname = usePathname()
  const [view, setViewState] = useState<ViewMode>(currentView)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('all')

  const setView = useCallback(
    (next: ViewMode) => {
      setViewState(next)
      const params = new URLSearchParams(window.location.search)
      if (next === 'list') params.set('view', 'list')
      else params.delete('view')
      const query = params.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [pathname],
  )

  const allTags = useMemo(() => {
    const set = new Set<string>()
    members.forEach((m) => (m.tags ?? []).forEach((t) => set.add(t)))
    return ['all', ...Array.from(set).sort()]
  }, [members])

  const ordered = useMemo(() => {
    const selfIdx = members.findIndex((m) => m.user_id === currentUserId)
    if (selfIdx < 0) return members
    const copy = [...members]
    const [self] = copy.splice(selfIdx, 1)
    return [self, ...copy]
  }, [members, currentUserId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ordered.filter((m) => {
      if (tag !== 'all' && !(m.tags ?? []).includes(tag)) return false
      if (!q) return true
      const hay = `${m.name} ${m.role} ${(m.tags ?? []).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [ordered, tag, search])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        {allTags.length > 1 ? (
          <AnimatedTabs
            filters={allTags}
            activeFilter={tag}
            onFilterChange={setTag}
            formatLabel={(f) =>
              f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)
            }
          />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-none w-48 hidden sm:block border border-neutral-200 focus:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300 text-neutral-900 text-sm"
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-sm">No matching members.</p>
        </div>
      ) : view === 'list' ? (
        <div className="border-t border-neutral-100">
          {filtered.map((m) => {
            const isSelf = m.user_id === currentUserId
            const canEdit = isAdmin || isSelf
            const interactive = isAdmin || isSelf
            return (
              <TeamMemberRow
                key={m.id}
                member={m}
                canEdit={canEdit}
                interactive={interactive}
                hasAccount={!!m.user_id}
              />
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filtered.map((m) => {
            const isSelf = m.user_id === currentUserId
            const canEdit = isAdmin || isSelf
            const interactive = isAdmin || isSelf
            return (
              <TeamMemberCard
                key={m.id}
                member={m}
                canEdit={canEdit}
                interactive={interactive}
                hasAccount={!!m.user_id}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
