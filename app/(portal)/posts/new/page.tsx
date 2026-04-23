import { createClient } from '@/lib/supabase/server'
import PostEditor from '@/components/post-editor'
import { getPortalSession } from '@/lib/auth'

export default async function NewPostPage() {
  await getPortalSession()
  const supabase = await createClient()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  return <PostEditor teamMembers={teamMembers ?? []} />
}
