'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import type { ExperienceEntry } from '@/lib/utils/team-experience'
import { TAGS } from '@/lib/cache-tags'

export type TeamMemberFormData = {
  id: string
  name: string
  role: string
  bio: string
  experience: ExperienceEntry[]
  linkedin: string
  tags: string[]
  img_url: string
}

export type TeamMemberCreateData = Omit<TeamMemberFormData, 'id'>

export type SaveTeamMemberResult =
  | { success: true }
  | { success: false; error: string }

export type CreateTeamMemberResult =
  | { success: true; id: string }
  | { success: false; error: string }

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

async function persistTeamExperience(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamMemberId: string,
  entries: ExperienceEntry[],
) {
  await supabase
    .from('team_experience')
    .delete()
    .eq('team_member_id', teamMemberId)

  const rows = entries
    .filter((e) => (e.company ?? '').trim() || (e.role ?? '').trim())
    .map((e, i) => ({
      team_member_id: teamMemberId,
      company: e.company?.trim() || null,
      role: e.role?.trim() || null,
      display_order: i,
    }))

  if (rows.length > 0) {
    await supabase.from('team_experience').insert(rows)
  }
}

export async function saveTeamMember(
  data: TeamMemberFormData,
): Promise<SaveTeamMemberResult> {
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

  const { data: member } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('id', data.id)
    .single()

  if (!isAdmin && member?.user_id !== user.id) {
    return { success: false, error: 'You can only edit your own profile' }
  }

  const { data: before } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', data.id)
    .single()

  const { error } = await supabase
    .from('team_members')
    .update({
      name: data.name,
      role: data.role,
      bio: data.bio,
      // Legacy TEXT column — zeroed out. team_experience rows are the source of truth now.
      experience: null,
      linkedin: data.linkedin,
      tags: data.tags.filter((t) => t.trim()),
      img_url: data.img_url,
    })
    .eq('id', data.id)

  if (error) return { success: false, error: error.message }

  await persistTeamExperience(supabase, data.id, data.experience)

  const { data: after } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', data.id)
    .single()

  const { data: afterExperience } = await supabase
    .from('team_experience')
    .select('*')
    .eq('team_member_id', data.id)
    .order('display_order')

  await supabase.from('audit_log').insert({
    table_name: 'team_members',
    record_id: data.id,
    action: 'update',
    before,
    after: { ...after, team_experience: afterExperience ?? [] },
    performed_by: user.id,
  })

  try {
    const { data: config } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['revalidation_url', 'webhook_secret'])
    const configMap = Object.fromEntries(
      (config ?? []).map((r) => [r.key, r.value]),
    )

    if (configMap.revalidation_url && configMap.webhook_secret) {
      const body = JSON.stringify({
        event: 'update',
        table: 'team_members',
        record_id: data.id,
        path: '/team',
        timestamp: new Date().toISOString(),
      })
      const encoder = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(configMap.webhook_secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(body),
      )
      const sigHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      await fetch(configMap.revalidation_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': sigHex,
        },
        body,
      }).catch(() => {})
    }
  } catch {
    // Webhook failure should not break the save
  }

  revalidateTag(TAGS.team, 'max')
  revalidateTag(TAGS.teamMember(data.id), 'max')

  redirect(`/team`)
}

export async function createTeamMember(
  data: TeamMemberCreateData,
): Promise<CreateTeamMemberResult> {
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
  if (roleRow?.role !== 'admin') {
    return { success: false, error: 'Only admins can create team members.' }
  }

  const parsed = createSchema.safeParse({ name: data.name })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    }
  }

  const { data: inserted, error } = await supabase
    .from('team_members')
    .insert({
      name: data.name,
      role: data.role || '',
      bio: data.bio || '',
      linkedin: data.linkedin || null,
      tags: data.tags.filter((t) => t.trim()),
      img_url: data.img_url || '',
      user_id: null,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return {
      success: false,
      error: error?.message ?? 'Failed to create team member',
    }
  }

  if (data.experience && data.experience.length > 0) {
    const rows = data.experience
      .filter((e) => (e.company ?? '').trim() || (e.role ?? '').trim())
      .map((e, i) => ({
        team_member_id: inserted.id,
        company: e.company?.trim() || null,
        role: e.role?.trim() || null,
        display_order: i,
      }))
    if (rows.length > 0) {
      await supabase.from('team_experience').insert(rows)
    }
  }

  await supabase.from('audit_log').insert({
    table_name: 'team_members',
    record_id: inserted.id,
    action: 'create',
    before: null,
    after: { id: inserted.id, name: data.name },
    performed_by: user.id,
  })

  try {
    const { data: config } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['revalidation_url', 'webhook_secret'])
    const configMap = Object.fromEntries(
      (config ?? []).map((r) => [r.key, r.value]),
    )
    if (configMap.revalidation_url && configMap.webhook_secret) {
      const body = JSON.stringify({
        event: 'create',
        table: 'team_members',
        record_id: inserted.id,
        path: '/team',
        timestamp: new Date().toISOString(),
      })
      const encoder = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(configMap.webhook_secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(body),
      )
      const sigHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      await fetch(configMap.revalidation_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': sigHex,
        },
        body,
      }).catch(() => {})
    }
  } catch {
    // Webhook failure should not block the save
  }

  revalidateTag(TAGS.team, 'max')
  revalidateTag(TAGS.teamMember(inserted.id), 'max')

  return { success: true, id: inserted.id }
}
