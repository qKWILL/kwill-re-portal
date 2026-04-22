'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { PortalPropertyCard } from './PropertyCard'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  leased: 'bg-purple-100 text-purple-700',
}

export function PropertyRow({ property }: { property: PortalPropertyCard }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      prefetch
      className="group flex items-center gap-4 py-3 px-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
    >
      <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden bg-neutral-100">
        {property.heroImage ? (
          <Image
            src={property.heroImage}
            alt={property.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-neutral-900 truncate">
          {property.title || 'Untitled'}
        </p>
        <p className="text-sm text-neutral-500 truncate">
          {[property.city, property.state].filter(Boolean).join(', ')}
          {property.zip ? ` ${property.zip}` : ''}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        {property.propertyType ? (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full capitalize bg-neutral-100 text-neutral-700">
            {property.propertyType.replace('-', ' ')}
          </span>
        ) : null}
        {property.transactionType ? (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full capitalize bg-black/80 text-white">
            {property.transactionType.replace(/-/g, ' ')}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {property.featured ? (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Featured
          </span>
        ) : null}
        <span
          className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${
            STATUS_COLORS[property.status] ??
            'bg-neutral-100 text-neutral-700'
          }`}
        >
          {property.status}
        </span>
      </div>
    </Link>
  )
}
