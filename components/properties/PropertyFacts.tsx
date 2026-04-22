import type { PropertyContent } from '@/lib/types/property-portal'
import { formatBuildingSize } from '@/lib/format-size'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-medium text-black mb-4">{children}</h3>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-neutral-900">{label}</dt>
      <dd className="text-sm text-neutral-500">{value}</dd>
    </div>
  )
}

export function PropertyFacts({ content }: { content: PropertyContent }) {
  const isIndustrial =
    content.property_type?.toLowerCase() === 'industrial'

  const yearBuiltRenovated = [
    content.year_built ? String(content.year_built) : null,
    content.year_renovated ? `Renovated ${content.year_renovated}` : null,
  ]
    .filter(Boolean)
    .join(' / ')

  const generalFacts: { label: string; value: string | undefined | null }[] = [
    {
      label: 'Building Size',
      value: formatBuildingSize(content) ?? undefined,
    },
    { label: 'Year Built / Renovated', value: yearBuiltRenovated || undefined },
    { label: 'Building Class', value: content.building_class },
    { label: 'Stories', value: content.stories ? String(content.stories) : undefined },
    { label: 'Lot Size', value: content.lot_size },
    { label: 'Construction', value: content.construction_type },
    { label: 'Typical Floor Size', value: content.typical_floor_size },
    { label: 'Ceiling Height', value: content.ceiling_height },
    { label: 'Sprinkler System', value: content.sprinkler_system },
    { label: 'Sewer', value: content.sewer },
    { label: 'Water', value: content.water },
    { label: 'Heating', value: content.heating },
    { label: 'Gas', value: content.gas },
    { label: 'Power Supply', value: content.power_supply },
    { label: 'Zoning', value: content.zoning },
    { label: 'Parking', value: content.parking },
  ]

  const industrialFacts: { label: string; value: string | undefined | null }[] =
    isIndustrial
      ? [
          { label: 'Clear Height', value: content.clear_height },
          {
            label: 'Drive-In Bays',
            value: content.drive_in_bays ? String(content.drive_in_bays) : undefined,
          },
          {
            label: 'Exterior Dock Doors',
            value: content.exterior_dock_doors
              ? String(content.exterior_dock_doors)
              : undefined,
          },
          {
            label: 'Interior Dock Doors',
            value: content.interior_dock_doors
              ? String(content.interior_dock_doors)
              : undefined,
          },
          { label: 'Column Spacing', value: content.column_spacing },
        ]
      : []

  const allFacts = [...generalFacts, ...industrialFacts].filter(
    (f): f is { label: string; value: string } => f.value != null && f.value !== '',
  )

  if (allFacts.length === 0) return null

  return (
    <div className="py-8 px-8 bg-neutral-50">
      <SectionHeading>
        {isIndustrial ? 'Warehouse Facility Facts' : 'Property Facts'}
      </SectionHeading>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {allFacts.map((fact) => (
          <Fact key={fact.label} label={fact.label} value={fact.value} />
        ))}
      </dl>
    </div>
  )
}
