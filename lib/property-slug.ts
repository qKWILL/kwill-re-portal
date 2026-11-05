import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

// Uploading photos before the first save creates the property row early, with
// a `draft-<timestamp>` slug (components/property-image-upload.tsx). That slug
// is a placeholder and must never become the public URL.
const PLACEHOLDER_SLUG_RE = /^draft-\d+$/
const MAX_SLUG_SUFFIX = 50

export function isPlaceholderSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && PLACEHOLDER_SLUG_RE.test(slug)
}

export function slugFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `property-${Date.now()}`
}

export async function generateUniqueSlug(
  supabase: SupabaseClient,
  title: string,
): Promise<string> {
  const base = slugFromTitle(title)
  let candidate = base
  let suffix = 2
  while (true) {
    const { data } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', candidate)
      .limit(1)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
    if (suffix > MAX_SLUG_SUFFIX) return `${base}-${Date.now()}`
  }
}

// The real slug to give a property that still has the placeholder, or null
// when its slug is already real (slugs are locked once real) or there is no
// title to build one from.
export async function slugToReplacePlaceholder(
  supabase: SupabaseClient,
  currentSlug: string | null | undefined,
  title: string | null | undefined,
): Promise<string | null> {
  if (!isPlaceholderSlug(currentSlug) || !title?.trim()) return null
  return generateUniqueSlug(supabase, title)
}

// Keeps an old URL working as a 301 to the new slug, through the marketing
// site's property_slug_history fallback. property_slug_history only has a
// public read policy, so a session client's insert is refused by RLS; callers
// must have authorized the edit before calling this.
export async function recordOldSlug(propertyId: string, oldSlug: string): Promise<void> {
  const { error } = await createAdminClient()
    .from('property_slug_history')
    .insert({ property_id: propertyId, old_slug: oldSlug })
  if (error) console.error('Failed to record old property slug:', error)
}
