'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

const TYPE_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Blog', value: 'blog' },
  { label: 'News', value: 'news' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'LinkedIn', value: 'linkedin' },
]

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

const TYPE_COLORS: Record<string, string> = {
  blog:     'bg-blue-100 text-blue-700',
  news:     'bg-orange-100 text-orange-700',
  podcast:  'bg-green-100 text-green-700',
  linkedin: 'bg-sky-100 text-sky-700',
}

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
}

type Post = {
  id: string
  title: string
  type: string
  status: string
  img_url: string | null
  date: string | null
  updated_at: string
  team_members: { name: string } | null
}

export default function PostsClient({
  posts,
  currentType,
  currentStatus,
  currentSearch,
}: {
  posts: Post[]
  currentType: string
  currentStatus: string
  currentSearch: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch)

  const updateURL = useCallback((newType: string, newStatus: string, newSearch: string) => {
    const params = new URLSearchParams()
    if (newType && newType !== 'all') params.set('type', newType)
    if (newStatus && newStatus !== 'all') params.set('status', newStatus)
    if (newSearch) params.set('q', newSearch)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }, [router, pathname])

  const handleSearch = useDebouncedCallback((value: string) => {
    updateURL(currentType, currentStatus, value)
  }, 300)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TYPE_TABS.map(tab => (
            <button key={tab.value} onClick={() => updateURL(tab.value, currentStatus, search)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                currentType === tab.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1">
            {STATUS_TABS.map(tab => (
              <button key={tab.value} onClick={() => updateURL(currentType, tab.value, search)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  currentStatus === tab.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search posts..." defaultValue={currentSearch}
              onChange={e => { setSearch(e.target.value); handleSearch(e.target.value) }}
              className="w-full sm:w-56 pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
      </div>

      {/* List */}
      {!posts.length ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">
            {currentSearch ? `No posts matching "${currentSearch}"` : 'No posts yet.'}
          </p>
          {!currentSearch && (
            <Link href="/posts/new" className="text-sm text-gray-900 font-medium underline mt-2 inline-block">
              Create your first post
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/posts/${p.id}`} className="font-medium text-gray-900 hover:underline line-clamp-1">
                        {p.title || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[p.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {p.team_members?.name ?? '—'}
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
