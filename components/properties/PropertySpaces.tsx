'use client'

import type { PropertySpace } from '@/lib/types/property-portal'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-medium text-black mb-3">{children}</h3>
}

function formatSize(sf: number | null): string {
  if (!sf) return '-'
  return `${sf.toLocaleString()} SF`
}

export function PropertySpaces({ spaces }: { spaces: PropertySpace[] }) {
  if (spaces.length === 0) return null

  return (
    <section className="my-4 py-4 ">
      <SectionHeading>All Available Spaces ({spaces.length})</SectionHeading>

      {/* Column header row - desktop only */}
      <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 pb-2 pt-2 border-b border-neutral-200">
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Space
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Size
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Term
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Rental Rate
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Space Use
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Build-Out
        </span>
        <span className="text-xs text-neutral-500 uppercase tracking-wider">
          Available
        </span>
      </div>

      <Accordion type="multiple">
        {spaces.map((space) => (
          <AccordionItem
            key={space.id}
            value={space.id}
            className="border-b border-neutral-100"
          >
            <AccordionTrigger className="hover:bg-neutral-50 px-4 hover:no-underline">
              {/* Desktop: 7-column grid */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 w-full text-sm text-neutral-700 text-left">
                <span className="font-medium text-neutral-900">
                  {space.name}
                </span>
                <span>{formatSize(space.size_sf)}</span>
                <span>{space.term ?? '-'}</span>
                <span>{space.rental_rate ?? '-'}</span>
                <span>{space.space_use ?? '-'}</span>
                <span>{space.build_out ?? '-'}</span>
                <span>{space.available_date ?? '-'}</span>
              </div>

              {/* Mobile: stacked layout */}
              <div className="flex flex-col gap-1 md:hidden text-left">
                <span className="font-medium text-neutral-900 text-sm">
                  {space.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatSize(space.size_sf)}
                  {space.rental_rate ? ` \u00B7 ${space.rental_rate}` : ''}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="">
              {/* Detail fields on mobile that aren't shown in trigger */}
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:hidden mb-4 px-4">
                {space.term && (
                  <>
                    <dt className="text-neutral-500">Term</dt>
                    <dd className="text-neutral-700">{space.term}</dd>
                  </>
                )}
                {space.space_use && (
                  <>
                    <dt className="text-neutral-500">Space Use</dt>
                    <dd className="text-neutral-700">{space.space_use}</dd>
                  </>
                )}
                {space.build_out && (
                  <>
                    <dt className="text-neutral-500">Build-Out</dt>
                    <dd className="text-neutral-700">{space.build_out}</dd>
                  </>
                )}
                {space.available_date && (
                  <>
                    <dt className="text-neutral-500">Available</dt>
                    <dd className="text-neutral-700">{space.available_date}</dd>
                  </>
                )}
              </dl>

              {/* Features list */}
              {space.features.length > 0 && (
                <div className="pt-2 pb-4 bg-neutral-50">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2 pt-1 px-4">
                    Features
                  </p>
                  <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1 px-4">
                    {space.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
