'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPortalSession } from '@/lib/auth'
import { TAGS } from '@/lib/cache-tags'
import { fireMarketingRevalidation } from '@/lib/webhook'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type RenameSlugResult =
  | { success: true; slug: string }
  | { success: false; error: string }

export async function renamePropertySlug(
  propertyId: string,
  nextSlug: string,
): Promise<RenameSlugResult> {
  const normalized = nextSlug.trim().toLowerCase()
  if (!SLUG_RE.test(normalized)) {
    return { success: false, error: 'Use lowercase letters, numbers, and hyphens only.' }
  }
  if (normalized.length < 3 || normalized.length > 100) {
    return { success: false, error: 'Slug must be 3–100 characters.' }
  }

  const supabase = await createClient()
  const { user, isAdmin } = await getPortalSession()

  const { data: current } = await supabase
    .from('properties')
    .select('id, slug, created_by')
    .eq('id', propertyId)
    .single()

  if (!current) return { success: false, error: 'Property not found.' }
  if (!isAdmin && current.created_by !== user.id) {
    return { success: false, error: 'Not authorized.' }
  }
  if (current.slug === normalized) {
    return { success: true, slug: normalized }
  }

  const { data: conflict } = await supabase
    .from('properties')
    .select('id')
    .eq('slug', normalized)
    .neq('id', propertyId)
    .limit(1)
    .maybeSingle()
  if (conflict) return { success: false, error: 'That URL is already in use.' }

  const oldSlug = current.slug as string | null

  const { error: updateError } = await supabase
    .from('properties')
    .update({ slug: normalized })
    .eq('id', propertyId)
  if (updateError) return { success: false, error: updateError.message }

  if (oldSlug) {
    await supabase
      .from('property_slug_history')
      .insert({ property_id: propertyId, old_slug: oldSlug })
  }

  revalidateTag(TAGS.properties, 'max')
  revalidateTag(TAGS.property(propertyId), 'max')
  revalidatePath('/properties', 'layout')

  await fireMarketingRevalidation(supabase, {
    event: 'update',
    table: 'properties',
    record_id: propertyId,
    slug: normalized,
    old_slug: oldSlug,
    path: '/properties',
  })

  return { success: true, slug: normalized }
}
