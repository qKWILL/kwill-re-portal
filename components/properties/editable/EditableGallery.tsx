'use client'

import { useState } from 'react'
import { ImagePlus, Check } from 'lucide-react'
import PropertyImageUpload from '@/components/property-image-upload'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import type { PropertyMedia } from '@/lib/types/property-portal'

type Props = {
  propertyId?: string
  userId?: string
  media: PropertyMedia[]
  onPropertyCreated?: (id: string) => void
}

export function EditableGallery({
  propertyId,
  userId,
  media,
  onPropertyCreated,
}: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="relative h-full">
      {editing ? (
        <div className="border border-neutral-200 rounded-lg bg-white p-4 min-h-[400px]">
          <PropertyImageUpload
            propertyId={propertyId}
            existingMedia={media.map((m) => ({
              id: m.id,
              url: m.url,
              storage_path: m.storage_path,
              display_order: m.display_order,
              caption: m.caption ?? '',
            }))}
            userId={userId}
            onPropertyCreated={onPropertyCreated}
            alwaysShowDelete
          />
        </div>
      ) : (
        <PropertyGallery media={media} />
      )}
      <button
        type="button"
        onClick={() => setEditing((e) => !e)}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-neutral-700 shadow hover:bg-white transition-colors"
      >
        {editing ? (
          <>
            <Check className="w-3.5 h-3.5" /> Done
          </>
        ) : (
          <>
            <ImagePlus className="w-3.5 h-3.5" /> Manage images
          </>
        )}
      </button>
    </div>
  )
}
