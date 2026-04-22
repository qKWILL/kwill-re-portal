import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostEditor from '@/components/post-editor'

export default async function NewPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  return <PostEditor teamMembers={teamMembers ?? []} />
}
