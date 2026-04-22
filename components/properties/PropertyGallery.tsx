'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { PropertyMedia } from '@/lib/types/property-portal'
import { getPropertyImages } from '@/lib/types/property-portal'

export function PropertyGallery({ media }: { media: PropertyMedia[] }) {
  const images = getPropertyImages(media)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/2] md:aspect-[2/1] bg-neutral-100 flex items-center justify-center text-sm text-neutral-400">
        No images yet
      </div>
    )
  }

  // 4 images: use the 3-image layout and show a "+1 more" pill for the hidden one
  const count = images.length === 4 ? 3 : Math.min(images.length, 5)
  const extra = images.length - count

  function Tile({ index, priority }: { index: number; priority?: boolean }) {
    const img = images[index]
    return (
      <button
        type="button"
        onClick={() => setLightboxIndex(index)}
        className="relative w-full h-full overflow-hidden group/tile focus:outline-none"
        aria-label={img.caption ?? `Open image ${index + 1}`}
      >
        <Image
          src={img.url}
          alt={img.caption ?? `Property image ${index + 1}`}
          fill
          className="object-cover"
          priority={priority}
          sizes="(min-width: 1200px) 1200px, 100vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover/tile:bg-black/15 transition-colors" />
      </button>
    )
  }

  return (
    <>
      <div className="relative w-full aspect-[3/2] md:aspect-[2/1] overflow-hidden">
        {/* Mobile: show first image only */}
        <div className="md:hidden absolute inset-0">
          <Tile index={0} priority />
        </div>

        {/* Desktop grid variants */}
        <div className="hidden md:block absolute inset-0">
          {count === 1 ? (
            <Tile index={0} priority />
          ) : count === 2 ? (
            <div className="grid grid-cols-[2fr_1fr] gap-[6px] w-full h-full">
              <Tile index={0} priority />
              <Tile index={1} />
            </div>
          ) : count === 3 ? (
            <div className="grid grid-cols-[2fr_1fr] gap-[6px] w-full h-full">
              <Tile index={0} priority />
              <div className="grid grid-rows-2 gap-[6px]">
                <Tile index={1} />
                <Tile index={2} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-[6px] w-full h-full">
              <Tile index={0} priority />
              <div className="grid grid-rows-2 gap-[6px]">
                <Tile index={1} />
                <Tile index={2} />
              </div>
              <div className="grid grid-rows-2 gap-[6px]">
                <Tile index={3} />
                <Tile index={4} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: always show remaining count (only image 1 is visible) */}
        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(1)}
            className="md:hidden absolute bottom-4 right-4 bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:bg-neutral-50 transition-colors"
          >
            + {images.length - 1} more{' '}
            {images.length - 1 === 1 ? 'photo' : 'photos'}
          </button>
        ) : null}

        {/* Desktop: show only when more than what we rendered */}
        {extra > 0 ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(count)}
            className="hidden md:inline-block absolute bottom-4 right-4 bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:bg-neutral-50 transition-colors"
          >
            + {extra} more {extra === 1 ? 'photo' : 'photos'}
          </button>
        ) : null}
      </div>

      {lightboxIndex !== null ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-2xl z-10"
            aria-label="Close"
            onClick={() => setLightboxIndex(null)}
          >
            &times;
          </button>
          <button
            type="button"
            className="absolute left-4 text-white text-3xl z-10"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(Math.max(0, lightboxIndex - 1))
            }}
          >
            &lsaquo;
          </button>
          <div
            className="relative w-[90vw] h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].caption ?? ''}
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            className="absolute right-4 text-white text-3xl z-10"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1))
            }}
          >
            &rsaquo;
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      ) : null}
    </>
  )
}
