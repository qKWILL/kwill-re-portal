import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PostForm from '@/components/post-form'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!post) notFound()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-sm text-gray-500 mt-1">{post.title}</p>
      </div>
      <PostForm teamMembers={teamMembers ?? []} userId={user.id} post={post} />
    </div>
  )
}
