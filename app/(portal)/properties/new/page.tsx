import { createClient } from '@/lib/supabase/server'
import NewPropertyClient from './new-property-client'
import { getPortalSession } from '@/lib/auth'

export default async function NewPropertyPage() {
  const { user } = await getPortalSession()
  const supabase = await createClient()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, role, img_url')
    .contains('tags', ['real estate'])
    .order('name')

  return (
    <NewPropertyClient
      teamMembers={teamMembers ?? []}
      userId={user.id}
    />
  )
}
