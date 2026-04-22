'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'

export async function revalidatePropertyCache(propertyId?: string) {
  revalidateTag(TAGS.properties, 'max')
  if (propertyId) revalidateTag(TAGS.property(propertyId), 'max')
  revalidatePath('/properties', 'layout')
}
