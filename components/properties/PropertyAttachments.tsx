import type { PropertyMedia } from '@/lib/types/property-portal'
import {
  getPropertyBrochures,
  getPropertyFloorPlans,
} from '@/lib/types/property-portal'
import { FileDown } from 'lucide-react'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-medium text-black mb-3">{children}</h3>
  )
}

function AttachmentLink({
  item,
  fallbackLabel,
}: {
  item: PropertyMedia
  fallbackLabel: string
}) {
  const label = item.caption || fallbackLabel
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
    >
      <FileDown className="w-4 h-4 flex-shrink-0" />
      {label}
    </a>
  )
}

function AttachmentGroup({
  title,
  items,
  fallbackPrefix,
}: {
  title: string
  items: PropertyMedia[]
  fallbackPrefix: string
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-sm font-semibold text-neutral-900 mb-2">{title}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <AttachmentLink
              item={item}
              fallbackLabel={
                items.length > 1 ? `${fallbackPrefix} ${i + 1}` : fallbackPrefix
              }
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PropertyAttachments({ media }: { media: PropertyMedia[] }) {
  const brochures = getPropertyBrochures(media)
  const floorPlans = getPropertyFloorPlans(media)
  const sitePlans = media.filter((m) => m.media_type === 'site_plan')

  const hasAttachments =
    brochures.length > 0 || floorPlans.length > 0 || sitePlans.length > 0
  if (!hasAttachments) return null

  const groupCount = [brochures, floorPlans, sitePlans].filter(
    (g) => g.length > 0,
  ).length
  const showGroupLabels = groupCount > 1

  return (
    <div className="mb-8 pb-8 border-b border-neutral-200">
      <SectionHeading>Attachments</SectionHeading>
      {showGroupLabels ? (
        <div className="space-y-4">
          <AttachmentGroup
            title="Brochures"
            items={brochures}
            fallbackPrefix="Brochure"
          />
          <AttachmentGroup
            title="Floor Plans"
            items={floorPlans}
            fallbackPrefix="Floor Plan"
          />
          <AttachmentGroup
            title="Site Plans"
            items={sitePlans}
            fallbackPrefix="Site Plan"
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {[...brochures, ...floorPlans, ...sitePlans].map((item, i) => {
            const prefix =
              brochures.length > 0
                ? 'Brochure'
                : floorPlans.length > 0
                  ? 'Floor Plan'
                  : 'Site Plan'
            const all = [...brochures, ...floorPlans, ...sitePlans]
            return (
              <li key={item.id}>
                <AttachmentLink
                  item={item}
                  fallbackLabel={
                    all.length > 1 ? `${prefix} ${i + 1}` : prefix
                  }
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
