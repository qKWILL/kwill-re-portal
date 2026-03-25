import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewPropertyClient from './new-property-client'

export default async function NewPropertyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, role')
    .order('name')

  return (
    <NewPropertyClient
      teamMembers={teamMembers ?? []}
      userId={user.id}
    />
  )
}
