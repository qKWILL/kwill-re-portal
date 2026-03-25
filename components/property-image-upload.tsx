'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

type MediaRow = {
  id?: string
  url: string
  storage_path: string
  display_order: number
  caption: string
}

export default function PropertyImageUpload({
  propertyId: initialPropertyId,
  existingMedia = [],
  userId,
  onPropertyCreated,
  alwaysShowDelete = false,
}: {
  propertyId?: string
  existingMedia?: MediaRow[]
  userId?: string
  onPropertyCreated?: (id: string) => void
  alwaysShowDelete?: boolean
}) {
  const [propertyId, setPropertyId] = useState<string | undefined>(initialPropertyId)
  const [media, setMedia] = useState<MediaRow[]>(existingMedia)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ensurePropertyId(): Promise<string | null> {
    if (propertyId) return propertyId
    if (!userId) return null
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .insert({ title: '', status: 'draft', slug: `draft-${Date.now()}`, created_by: userId })
      .select('id')
      .single()
    if (error || !data) return null
    setPropertyId(data.id)
    onPropertyCreated?.(data.id)
    return data.id
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const pid = await ensurePropertyId()
    if (!pid) { setError('Could not create property record.'); setUploading(false); return }

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${pid}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('property-media').upload(path, file)
      if (uploadError) { setError(uploadError.message); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('property-media').getPublicUrl(path)
      const { data: row, error: dbError } = await supabase
        .from('property_media')
        .insert({
          property_id: pid, media_type: 'image', url: publicUrl,
          storage_path: path, filename: file.name, file_size: file.size,
          mime_type: file.type, display_order: media.length,
        })
        .select('id, url, storage_path, display_order, caption')
        .single()
      if (dbError) { setError(dbError.message); setUploading(false); return }
      setMedia(prev => [...prev, { ...row, caption: row.caption ?? '' }])
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(item: MediaRow) {
    const supabase = createClient()
    await supabase.storage.from('property-media').remove([item.storage_path])
    if (item.id) await supabase.from('property_media').delete().eq('id', item.id)
    const updated = media
      .filter(m => m.storage_path !== item.storage_path)
      .map((m, i) => ({ ...m, display_order: i }))
    setMedia(updated)
    const supabase2 = createClient()
    await Promise.all(updated.filter(m => m.id).map(m =>
      supabase2.from('property_media').update({ display_order: m.display_order }).eq('id', m.id!)
    ))
  }

  async function move(index: number, direction: 'left' | 'right') {
    const newIndex = direction === 'left' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= media.length) return
    const reordered = [...media]
    const temp = reordered[index]
    reordered[index] = reordered[newIndex]
    reordered[newIndex] = temp
    const updated = reordered.map((m, i) => ({ ...m, display_order: i }))
    setMedia(updated)
    const supabase = createClient()
    await Promise.all(updated.filter(m => m.id).map(m =>
      supabase.from('property_media').update({ display_order: m.display_order }).eq('id', m.id!)
    ))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item, i) => (
            <div key={item.storage_path} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <div className="aspect-video relative">
                <Image src={item.url} alt={item.caption || `Image ${i + 1}`} fill className="object-cover" />
              </div>
              {/* Order badge */}
              <div className="absolute top-1 left-1 bg-black/50 text-white rounded px-1.5 py-0.5 text-xs">
                {i === 0 ? 'Cover' : i + 1}
              </div>
              {/* Delete — always visible on mobile/new, hover on desktop/detail */}
              <button onClick={() => handleDelete(item)} type="button"
                className={`absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 transition-opacity ${
                  alwaysShowDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                <X className="w-3 h-3" />
              </button>
              {/* Reorder arrows */}
              {media.length > 1 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                  <button onClick={() => move(i, 'left')} type="button" disabled={i === 0}
                    className="bg-black/60 text-white rounded p-0.5 disabled:opacity-30 hover:bg-black/80 transition-colors">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button onClick={() => move(i, 'right')} type="button" disabled={i === media.length - 1}
                    className="bg-black/60 text-white rounded p-0.5 disabled:opacity-30 hover:bg-black/80 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {media.length > 1 && (
        <p className="text-xs text-gray-400">Use arrows to reorder. First image is the cover image.</p>
      )}

      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <ImagePlus className="w-5 h-5 text-gray-400" />}
        <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload images'}</span>
        <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
    </div>
  )
}
