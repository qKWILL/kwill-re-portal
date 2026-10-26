'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import type { ExperienceEntry } from '@/lib/utils/team-experience'
import { applyTagChanges, normalizeTags } from '@/lib/utils/team-tags'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'
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
      tags: normalizeTags(data.tags),
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

  updateTag(TAGS.team)
  updateTag(TAGS.teamMember(data.id))

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
      tags: normalizeTags(data.tags),
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

  updateTag(TAGS.team)
  updateTag(TAGS.teamMember(inserted.id))

  return { success: true, id: inserted.id }
}

const bulkTagsSchema = z.object({
  memberIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one person')
    .max(200),
  add: z.array(z.string().max(60)).max(20),
  remove: z.array(z.string().max(60)).max(20),
})

export type BulkUpdateTeamTagsResult =
  | { success: true; changed: number }
  | { success: false; error: string }

export async function bulkUpdateTeamTags(input: {
  memberIds: string[]
  add: string[]
  remove: string[]
}): Promise<BulkUpdateTeamTagsResult> {
  const parsed = bulkTagsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    }
  }
  const add = normalizeTags(parsed.data.add)
  const remove = normalizeTags(parsed.data.remove)
  if (add.length === 0 && remove.length === 0) {
    return { success: false, error: 'Choose a tag to add or remove' }
  }

  const { user, isAdmin } = await getPortalSession()
  if (!isAdmin) {
    return { success: false, error: 'Only admins can edit tags in bulk' }
  }

  const supabase = await createClient()
  const { data: rows, error: readError } = await supabase
    .from('team_members')
    .select('*')
    .in('id', parsed.data.memberIds)
  if (readError) return { success: false, error: readError.message }

  // Only write rows whose tags actually change; a legacy spelling alone
  // ("Asset Management") is not a change worth an audit entry.
  const changes = (rows ?? [])
    .map((before) => ({
      before,
      tags: applyTagChanges(before.tags ?? [], add, remove),
    }))
    .filter(
      ({ before, tags }) =>
        normalizeTags(before.tags ?? []).join('|') !== tags.join('|'),
    )

  const results = await Promise.all(
    changes.map(async ({ before, tags }) => {
      const { data: after, error } = await supabase
        .from('team_members')
        .update({ tags })
        .eq('id', before.id)
        .select('*')
        .single()
      if (error) return { id: before.id as string, ok: false }

      await supabase.from('audit_log').insert({
        table_name: 'team_members',
        record_id: before.id,
        action: 'update',
        before,
        after,
        performed_by: user.id,
      })
      return { id: before.id as string, ok: true }
    }),
  )

  const changedIds = results.filter((r) => r.ok).map((r) => r.id)
  const failed = results.length - changedIds.length

  if (changedIds.length > 0) {
    updateTag(TAGS.team)
    changedIds.forEach((id) => updateTag(TAGS.teamMember(id)))
    await fireMarketingRevalidation(supabase, {
      event: 'update',
      table: 'team_members',
      record_id: changedIds[0],
      path: '/team',
    })
  }

  if (failed > 0) {
    return {
      success: false,
      error: `Saved ${changedIds.length}, but ${failed} could not be saved. Try again.`,
    }
  }
  return { success: true, changed: changedIds.length }
}
