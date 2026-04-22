'use client'

import Image from 'next/image'
import Link from 'next/link'

export type PortalPropertyCard = {
  id: string
  title: string
  city: string
  state: string
  zip: string
  heroImage: string
  propertyType: string
  transactionType: string
  status: string
  featured: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  leased: 'bg-purple-100 text-purple-700',
}

export function PropertyCard({ property }: { property: PortalPropertyCard }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      prefetch={true}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {property.heroImage ? (
          <Image
            src={property.heroImage}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {property.propertyType ? (
            <span className="bg-white/90 text-xs font-medium px-2 py-1 capitalize">
              {property.propertyType.replace('-', ' ')}
            </span>
          ) : null}
          {property.transactionType ? (
            <span className="bg-black/80 text-white text-xs font-medium px-2 py-1 capitalize">
              {property.transactionType.replace(/-/g, ' ')}
            </span>
          ) : null}
        </div>
        <div className="absolute top-3 right-3 flex gap-2 flex-wrap">
          <span
            className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${
              STATUS_COLORS[property.status] ??
              'bg-neutral-100 text-neutral-600'
            }`}
          >
            {property.status}
          </span>
          {property.featured ? (
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Featured
            </span>
          ) : null}
        </div>
      </div>
      <div className="py-6">
        <h4 className="text-xl font-sans font-medium tracking-[-.2px]">
          {property.title || 'Untitled'}
        </h4>
        <p className="mt-1 text-sm text-neutral-600">
          {[property.city, property.state].filter(Boolean).join(', ')}
          {property.zip ? ` ${property.zip}` : ''}
        </p>
      </div>
    </Link>
  )
}
