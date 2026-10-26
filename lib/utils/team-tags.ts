/**
 * Tags drive the portal's team tabs (exact match), the property agent picker
 * (`contains(['real estate'])`) and the public site's division filters
 * (lowercase). Storing one lowercase spelling keeps "Real Estate" and
 * "real estate" from splitting into two tabs.
 */

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** "all" is the built-in tab on the portal and the website, so no tag can use it. */
export const RESERVED_TAG = 'all'

/**
 * Display spelling to keep when the creator typed capitals ("ESG", "M&A");
 * null when plain title case would do, so the site derives it.
 */
export function tagDisplayLabel(typed: string): string | null {
  const label = typed.trim().replace(/\s+/g, ' ')
  return /[A-Z]/.test(label) ? label : null
}

/**
 * Ranks a typed search against a tag so the closest spelling is highlighted:
 * exact (ignoring case, spaces, hyphens) beats prefix beats substring.
 */
export function tagMatchScore(tag: string, search: string): number {
  const key = tagKey(tag)
  const query = tagKey(search)
  if (!query) return 1
  if (key === query) return 1
  if (key.startsWith(query)) return 0.8
  if (key.includes(query)) return 0.5
  return 0
}

export function normalizeTags(tags: readonly string[]): string[] {
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean)))
}

/** Looser match for near-duplicates: "Real-Estate", "realestate" and "real estate" share a key. */
export function tagKey(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** The existing tag a typed value should resolve to, if any. */
export function findMatchingTag(
  options: readonly string[],
  value: string,
): string | undefined {
  const key = tagKey(value)
  if (!key) return undefined
  return options.find((option) => tagKey(option) === key)
}

/** Distinct normalized tags across members, sorted for display. */
export function collectTags(
  members: readonly { tags?: readonly string[] | null }[],
): string[] {
  return normalizeTags(members.flatMap((m) => m.tags ?? [])).sort()
}

export function applyTagChanges(
  tags: readonly string[],
  add: readonly string[],
  remove: readonly string[],
): string[] {
  const removing = new Set(normalizeTags(remove))
  return normalizeTags([...tags, ...add]).filter((t) => !removing.has(t))
}
