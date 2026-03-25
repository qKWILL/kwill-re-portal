'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sold', value: 'sold' },
  { label: 'Leased', value: 'leased' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  leased: 'bg-purple-100 text-purple-700',
}

type Property = {
  id: string
  title: string
  status: string
  city: string
  state: string
  content: any
  updated_at: string
  created_by: string
}

export default function PropertiesClient({
  properties,
  currentStatus,
  currentSearch,
}: {
  properties: Property[]
  currentStatus: string
  currentSearch: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch)

  const updateURL = useCallback((newStatus: string, newSearch: string) => {
    const params = new URLSearchParams()
    if (newStatus && newStatus !== 'all') params.set('status', newStatus)
    if (newSearch) params.set('q', newSearch)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }, [router, pathname])

  const handleSearch = useDebouncedCallback((value: string) => {
    updateURL(currentStatus, value)
  }, 300)

  return (
    <div className="space-y-4">
      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => updateURL(tab.value, search)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                currentStatus === tab.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or address..."
            defaultValue={currentSearch}
            onChange={e => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
            className="w-full sm:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Table or empty state */}
      {!properties.length ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">
            {currentSearch
              ? `No properties matching "${currentSearch}"`
              : currentStatus !== 'all'
              ? `No ${currentStatus} properties`
              : 'No properties yet.'}
          </p>
          {!currentSearch && currentStatus === 'all' && (
            <Link href="/properties/new" className="text-sm text-gray-900 font-medium underline mt-2 inline-block">
              Add your first property
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/properties/${p.id}`} className="font-medium text-gray-900 hover:underline">
                        {p.title || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize hidden sm:table-cell">
                      {p.content?.property_type?.replace('-', ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {p.city && p.state ? `${p.city}, ${p.state}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
