'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useDebouncedCallback } from 'use-debounce'
import { NewsCard, type PortalPostCard } from '@/components/news/NewsCard'
import { NewsRow } from '@/components/news/NewsRow'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'

const FILTERS = ['all', 'blog', 'news', 'podcast', 'linkedin', 'draft']

const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  blog: 'Blog',
  news: 'News',
  podcast: 'Podcast',
  linkedin: 'LinkedIn',
  draft: 'Draft',
}

export default function PostsClient({
  posts,
  currentFilter,
  currentSearch,
  currentView,
}: {
  posts: PortalPostCard[]
  currentFilter: string
  currentSearch: string
  currentView: ViewMode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch)

  const updateURL = useCallback(
    (newFilter: string, newSearch: string, newView: ViewMode) => {
      const params = new URLSearchParams()
      if (newFilter && newFilter !== 'all') params.set('filter', newFilter)
      if (newSearch) params.set('q', newSearch)
      if (newView === 'list') params.set('view', 'list')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [router, pathname],
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    updateURL(currentFilter, value, currentView)
  }, 300)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <AnimatedTabs
          filters={FILTERS}
          activeFilter={currentFilter}
          onFilterChange={(f) => updateURL(f, search, currentView)}
          formatLabel={(f) => FILTER_LABELS[f] ?? f}
        />
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search…"
            defaultValue={currentSearch}
            onChange={(e) => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
            className="px-3 py-2 rounded-none w-48 hidden sm:block border border-neutral-200 focus:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300 text-neutral-900 text-sm"
          />
          <ViewToggle
            value={currentView}
            onChange={(v) => updateURL(currentFilter, search, v)}
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-12 text-center">
          <p className="text-neutral-500 text-sm">
            {currentSearch
              ? `No posts matching "${currentSearch}"`
              : 'No posts yet.'}
          </p>
          {!currentSearch && (
            <Link
              href="/posts/new"
              className="text-sm text-neutral-900 font-medium underline mt-2 inline-block"
            >
              Create your first post
            </Link>
          )}
        </div>
      ) : currentView === 'list' ? (
        <div className="border-t border-neutral-100">
          {posts.map((p) => (
            <NewsRow key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-y-8">
          {posts.map((p) => (
            <NewsCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
