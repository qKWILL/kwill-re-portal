/**
 * Editors work with blank-line separated paragraphs in a normal textarea.
 * Storage keeps the legacy ` | ` separator so the public site's existing
 * `bio.split('|')` rendering continues to work unchanged.
 */

export function bioToDraft(db: string | null | undefined): string {
  if (!db) return ''
  return db
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function draftToBio(draft: string): string {
  return draft
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' | ')
}
