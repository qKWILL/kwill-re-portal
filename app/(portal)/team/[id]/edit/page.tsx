import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TeamMemberForm from '@/components/team-member-form'

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const isAdmin = roleRow?.role === 'admin'

  const { data: member } = await supabase
    .from('team_members').select('*').eq('id', id).single()

  if (!member) notFound()

  // Editors can only edit their own profile
  if (!isAdmin && member.user_id !== user.id) redirect('/team')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-sm text-gray-500 mt-1">{member.name}</p>
      </div>
      <TeamMemberForm member={member} />
    </div>
  )
}
