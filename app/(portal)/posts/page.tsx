import Link from 'next/link'
import { Plus } from 'lucide-react'
import PostsClient from './posts-client'
import { getPostsList } from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'
import type { PortalPostCard } from '@/components/news/NewsCard'

const TYPE_FILTERS = ['blog', 'news', 'podcast', 'linkedin']

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; view?: string }>
}) {
  const { filter, q, view } = await searchParams
  const [, rows] = await Promise.all([getPortalSession(), getPostsList()])

  const query = (q ?? '').toLowerCase().trim()
  const filtered = rows.filter((row) => {
    if (filter === 'draft' && row.status !== 'draft') return false
    if (filter && filter !== 'draft' && TYPE_FILTERS.includes(filter) && row.type !== filter)
      return false
    if (query && !(row.title ?? '').toLowerCase().includes(query)) return false
    return true
  })

  const posts: PortalPostCard[] = filtered.map((row) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    excerpt: row.excerpt ?? null,
    img_url: row.img_url ?? null,
    type: row.type ?? '',
    status: row.status ?? 'draft',
  }))

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
            Posts
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {posts.length} {filter && filter !== 'all' ? filter : 'total'}
          </p>
        </div>
        <Link
          href="/posts/new"
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>
      <PostsClient
        posts={posts}
        currentFilter={filter ?? 'all'}
        currentSearch={q ?? ''}
        currentView={view === 'list' ? 'list' : 'grid'}
      />
    </div>
  )
}
