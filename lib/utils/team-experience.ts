export type ExperienceEntry = {
  id?: string
  company: string
  role: string
}

/**
 * Parse a legacy `|`-separated experience string into structured entries.
 * Used only as a fallback when team_experience has no rows for a member.
 */
export function parseExperienceText(raw: string | null | undefined): ExperienceEntry[] {
  if (!raw?.trim()) return []
  return raw
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const parts = chunk.split(/\s+[,\u2013-]\s+|\s+in\s+/i)
      if (parts.length > 1) {
        return {
          company: parts[0].trim(),
          role: parts.slice(1).join(' ').trim(),
        }
      }
      return { company: chunk, role: '' }
    })
}
