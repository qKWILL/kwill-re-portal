'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { createClient } from '@/lib/supabase/server'
import { fetchPropertySlug, fireMarketingRevalidation } from '@/lib/webhook'

export async function revalidatePropertyCache(propertyId?: string) {
  updateTag(TAGS.properties)
  if (propertyId) updateTag(TAGS.property(propertyId))
  revalidatePath('/properties', 'layout')

  if (propertyId) {
    const supabase = await createClient()
    const slug = await fetchPropertySlug(supabase, propertyId)
    await fireMarketingRevalidation(supabase, {
      event: 'media',
      table: 'properties',
      record_id: propertyId,
      slug,
      path: '/properties',
    })
  }
}
