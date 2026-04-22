'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useDebouncedCallback } from 'use-debounce'
import {
  PropertyCard,
  type PortalPropertyCard,
} from '@/components/properties/PropertyCard'
import { PropertyRow } from '@/components/properties/PropertyRow'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'

const STATUS_FILTERS = ['all', 'active', 'draft', 'pending', 'sold', 'leased']

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  active: 'Active',
  draft: 'Draft',
  pending: 'Pending',
  sold: 'Sold',
  leased: 'Leased',
}

export default function PropertiesClient({
  properties,
  currentStatus,
  currentSearch,
  currentView,
}: {
  properties: PortalPropertyCard[]
  currentStatus: string
  currentSearch: string
  currentView: ViewMode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch)

  const updateURL = useCallback(
    (newStatus: string, newSearch: string, newView: ViewMode) => {
      const params = new URLSearchParams()
      if (newStatus && newStatus !== 'all') params.set('status', newStatus)
      if (newSearch) params.set('q', newSearch)
      if (newView === 'list') params.set('view', 'list')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [router, pathname],
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    updateURL(currentStatus, value, currentView)
  }, 300)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <AnimatedTabs
          filters={STATUS_FILTERS}
          activeFilter={currentStatus}
          onFilterChange={(f) => updateURL(f, search, currentView)}
          formatLabel={(f) => STATUS_LABELS[f] ?? f}
        />
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search by title or address…"
            defaultValue={currentSearch}
            onChange={(e) => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
            className="px-3 py-2 rounded-none w-56 hidden sm:block border border-neutral-200 focus:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300 text-neutral-900 text-sm"
          />
          <ViewToggle
            value={currentView}
            onChange={(v) => updateURL(currentStatus, search, v)}
          />
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-sm">
            {currentSearch
              ? `No properties matching "${currentSearch}"`
              : currentStatus !== 'all'
                ? `No ${currentStatus} properties`
                : 'No properties yet.'}
          </p>
          {!currentSearch && currentStatus === 'all' && (
            <Link
              href="/properties/new"
              className="text-sm text-neutral-900 font-medium underline mt-2 inline-block"
            >
              Add your first property
            </Link>
          )}
        </div>
      ) : currentView === 'list' ? (
        <div className="border-t border-neutral-100">
          {properties.map((p) => (
            <PropertyRow key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-y-8">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}
