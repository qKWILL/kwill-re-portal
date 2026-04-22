import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamMemberEditor from '@/components/team-member-editor'

export default async function NewTeamMemberPage() {
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
  if (roleRow?.role !== 'admin') redirect('/team')

  return <TeamMemberEditor member={null} />
}
