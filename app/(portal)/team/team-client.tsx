'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import {
  TeamMemberCard,
  type PortalTeamCard,
} from '@/components/team/TeamMemberCard'
import { TeamMemberRow } from '@/components/team/TeamMemberRow'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'
import { BulkTagBar } from '@/components/team/BulkTagBar'
import { WebsiteTabsPanel } from '@/components/team/WebsiteTabsPanel'
import type { TeamTagRow } from '@/lib/cached-data'
import { collectTags, normalizeTags } from '@/lib/utils/team-tags'

export type PortalTeamRow = PortalTeamCard & {
  user_id: string | null
  last_sign_in_at: string | null
  tags: string[]
}

export default function TeamClient({
  members,
  currentUserId,
  isAdmin,
  currentView,
  registeredTags,
}: {
  members: PortalTeamRow[]
  currentUserId: string
  isAdmin: boolean
  currentView: ViewMode
  /** null when team_tags couldn't be read. */
  registeredTags: TeamTagRow[] | null
}) {
  const pathname = usePathname()
  const [view, setViewState] = useState<ViewMode>(currentView)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('all')
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  // Owned here so leaving select mode can't unmount a save in flight.
  const [isSaving, startSaving] = useTransition()

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

  // Normalized so a legacy spelling ("Real Estate") can't show as a second tab.
  const memberTags = useMemo(() => collectTags(members), [members])
  const allTags = useMemo(() => ['all', ...memberTags], [memberTags])
  // A bulk remove can take away the open tab's last holder; fall back to All.
  const activeTag = tag === 'all' || memberTags.includes(tag) ? tag : 'all'

  const pickerOptions = useMemo(
    () =>
      normalizeTags([...memberTags, ...(registeredTags ?? []).map((t) => t.name)]).sort(),
    [memberTags, registeredTags],
  )

  const websiteTabs = useMemo(() => {
    if (!registeredTags) return null
    const byName = new Map(registeredTags.map((t) => [t.name, t]))
    return pickerOptions.map((name) => ({
      name,
      label: byName.get(name)?.label ?? null,
      count: members.filter((m) => normalizeTags(m.tags ?? []).includes(name)).length,
      showOnSite: byName.get(name)?.show_on_site ?? false,
    }))
  }, [pickerOptions, registeredTags, members])

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
      if (activeTag !== 'all' && !normalizeTags(m.tags ?? []).includes(activeTag)) return false
      if (!q) return true
      const hay = `${m.name} ${m.role} ${(m.tags ?? []).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [ordered, activeTag, search])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectShown = useCallback(() => {
    setSelectedIds((current) => new Set([...current, ...filtered.map((m) => m.id)]))
  }, [filtered])

  const stopSelecting = useCallback(() => {
    setSelecting(false)
    setSelectedIds(new Set())
  }, [])

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.has(m.id)),
    [members, selectedIds],
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        {allTags.length > 1 ? (
          <AnimatedTabs
            filters={allTags}
            activeFilter={activeTag}
            onFilterChange={setTag}
            formatLabel={(f) =>
              f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)
            }
          />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          {isAdmin ? <WebsiteTabsPanel tags={websiteTabs} /> : null}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
              disabled={isSaving}
              aria-pressed={selecting}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                selecting
                  ? 'bg-black text-white border-black hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {selecting ? 'Done editing tags' : 'Edit tags'}
            </button>
          ) : null}
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
                hasSignedIn={!!m.last_sign_in_at}
                selectable={selecting}
                selected={selectedIds.has(m.id)}
                onToggle={() => toggleSelected(m.id)}
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
                hasSignedIn={!!m.last_sign_in_at}
                selectable={selecting}
                selected={selectedIds.has(m.id)}
                onToggle={() => toggleSelected(m.id)}
              />
            )
          })}
        </div>
      )}

      {selecting ? (
        <>
          {/* Keeps the last row clear of the fixed bar. */}
          <div aria-hidden className="h-32" />
          <BulkTagBar
            selected={selectedMembers}
            tagOptions={pickerOptions}
            isPending={isSaving}
            startTransition={startSaving}
            shownCount={filtered.length}
            onSelectShown={selectShown}
            onClear={() => setSelectedIds(new Set())}
            onDone={stopSelecting}
          />
        </>
      ) : null}
    </>
  )
}
