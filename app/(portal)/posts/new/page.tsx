import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostForm from '@/components/post-form'

export default async function NewPostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
        <p className="text-sm text-gray-500 mt-1">Select a type to get started.</p>
      </div>
      <PostForm teamMembers={teamMembers ?? []} userId={user.id} />
    </div>
  )
}
