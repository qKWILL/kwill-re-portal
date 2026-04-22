import type { PropertyContent } from '@/lib/types/property-portal'

type SizeFields = Pick<
  PropertyContent,
  'size_sf' | 'size_sf_min' | 'size_sf_max'
>

export type BuildingSizeParts =
  | { kind: 'range'; min: string; max: string }
  | { kind: 'single'; value: string }

export function getBuildingSizeParts(c: SizeFields): BuildingSizeParts | null {
  const min = c.size_sf_min ?? null
  const max = c.size_sf_max ?? null
  if (min != null && max != null && min !== max) {
    const [lo, hi] = min < max ? [min, max] : [max, min]
    return { kind: 'range', min: lo.toLocaleString(), max: hi.toLocaleString() }
  }
  const single = min ?? max ?? c.size_sf ?? null
  return single != null
    ? { kind: 'single', value: single.toLocaleString() }
    : null
}

export function formatBuildingSize(c: SizeFields): string | null {
  const parts = getBuildingSizeParts(c)
  if (!parts) return null
  return parts.kind === 'range'
    ? `${parts.min} - ${parts.max} SF`
    : `${parts.value} SF`
}
