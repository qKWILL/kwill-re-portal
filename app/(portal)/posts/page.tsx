import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PostsClient from './posts-client'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>
}) {
  const { type, status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('posts')
    .select('id, title, type, status, img_url, date, created_at, updated_at, author_id, team_members:author_id(name)')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: posts } = await query

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts?.length ?? 0} total</p>
        </div>
        <Link
          href="/posts/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>
      <PostsClient posts={posts ?? []} currentType={type ?? 'all'} currentStatus={status ?? 'all'} currentSearch={q ?? ''} />
    </div>
  )
}
