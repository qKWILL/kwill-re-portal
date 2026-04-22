import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PostEditor from '@/components/post-editor'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  const isAdmin = roleRow?.role === 'admin'

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!post) notFound()
  if (!isAdmin && post.created_by !== user.id) redirect('/posts')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  return <PostEditor teamMembers={teamMembers ?? []} post={post} />
}
