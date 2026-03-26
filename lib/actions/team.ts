'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type TeamMemberFormData = {
  id: string
  name: string
  role: string
  bio: string
  experience: string
  linkedin: string
  tags: string[]
  img_url: string
}

export type SaveTeamMemberResult =
  | { success: true }
  | { success: false; error: string }

export async function saveTeamMember(data: TeamMemberFormData): Promise<SaveTeamMemberResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const isAdmin = roleRow?.role === 'admin'

  // Check the member being edited is either the current user's profile or admin
  const { data: member } = await supabase
    .from('team_members').select('user_id').eq('id', data.id).single()

  if (!isAdmin && member?.user_id !== user.id) {
    return { success: false, error: 'You can only edit your own profile' }
  }

  const { data: before } = await supabase
    .from('team_members').select('*').eq('id', data.id).single()

  const { error } = await supabase
    .from('team_members')
    .update({
      name: data.name,
      role: data.role,
      bio: data.bio,
      experience: data.experience,
      linkedin: data.linkedin,
      tags: data.tags.filter(t => t.trim()),
      img_url: data.img_url,
    })
    .eq('id', data.id)

  if (error) return { success: false, error: error.message }

  const { data: after } = await supabase
    .from('team_members').select('*').eq('id', data.id).single()

  await supabase.from('audit_log').insert({
    table_name: 'team_members',
    record_id: data.id,
    action: 'update',
    before,
    after,
    performed_by: user.id,
  })

  redirect(`/team`)
}
