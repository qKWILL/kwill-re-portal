'use server'

import { updateTag } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalSession } from '@/lib/auth'
import { fireMarketingRevalidation } from '@/lib/webhook'
import { TAGS } from '@/lib/cache-tags'
import {
  RESERVED_TAG,
  normalizeTag,
  tagDisplayLabel,
} from '@/lib/utils/team-tags'

// team_tags has public read and no write policy, so writes use the
// service-role client after the role checks below.

export type TeamTagResult =
  | { success: true; name: string }
  | { success: false; error: string }

const tagInputSchema = z.object({
  name: z.string().max(60, 'Tags are 60 characters or fewer'),
  showOnSite: z.boolean(),
})

export async function createTeamTag(input: {
  name: string
  showOnSite: boolean
}): Promise<TeamTagResult> {
  const parsed = tagInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid tag' }
  }
  const name = normalizeTag(parsed.data.name)
  if (!name) return { success: false, error: 'Tag name is required' }
  if (name === RESERVED_TAG) {
    return { success: false, error: '"All" is already a tab. Choose another name.' }
  }

  const { user, isAdmin } = await getPortalSession()
  // Only admins can put a tag on the website; anyone else creates it hidden.
  const showOnSite = isAdmin && parsed.data.showOnSite

  const admin = createAdminClient()
  const { error } = await admin
    .from('team_tags')
    .upsert(
      {
        name,
        label: tagDisplayLabel(parsed.data.name),
        show_on_site: showOnSite,
        created_by: user.id,
      },
      { onConflict: 'name', ignoreDuplicates: true },
    )
  if (error) return { success: false, error: error.message }

  if (showOnSite) {
    const { error: showError } = await admin
      .from('team_tags')
      .update({ show_on_site: true })
      .eq('name', name)
    if (showError) return { success: false, error: showError.message }
  }

  updateTag(TAGS.team)
  return { success: true, name }
}

export async function setTeamTagVisibility(input: {
  name: string
  showOnSite: boolean
}): Promise<TeamTagResult> {
  const parsed = tagInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid tag' }
  }
  const name = normalizeTag(parsed.data.name)
  if (!name) return { success: false, error: 'Tag name is required' }

  const { isAdmin } = await getPortalSession()
  if (!isAdmin) {
    return { success: false, error: 'Only admins can change website tabs' }
  }

  // Tags in use but never registered get their row here, on first toggle.
  const { error } = await createAdminClient()
    .from('team_tags')
    .upsert(
      { name, show_on_site: parsed.data.showOnSite },
      { onConflict: 'name' },
    )
  if (error) return { success: false, error: error.message }

  updateTag(TAGS.team)
  await fireMarketingRevalidation(await createClient(), {
    event: 'update',
    table: 'team_members',
    record_id: name,
    path: '/team',
  })
  return { success: true, name }
}
