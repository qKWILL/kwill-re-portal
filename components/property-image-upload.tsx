'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { revalidatePropertyCache } from '@/lib/actions/media'
import { Loader2, X, ImagePlus, GripVertical } from 'lucide-react'
import imageCompression from 'browser-image-compression'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.8,
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') && !/\.hei[cf]$/i.test(file.name)) {
    return file
  }
  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([compressed], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

    for (const original of Array.from(files)) {
      const file = await compressImage(original)
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`${original.name} is too large even after compression (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`)
        setUploading(false)
        return
      }
      const ext = file.name.split('.').pop()
      const path = `${pid}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('property-media').upload(path, file)
      if (uploadError) { setError(uploadError.message); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('property-media').getPublicUrl(path)
      const { data: row, error: dbError } = await supabase
        .from('property_media')
        .insert({
          property_id: pid, media_type: 'image', url: publicUrl,
          storage_path: path, filename: original.name, file_size: file.size,
          mime_type: file.type, display_order: media.length,
        })
        .select('id, url, storage_path, display_order, caption')
        .single()
      if (dbError) { setError(dbError.message); setUploading(false); return }
      setMedia(prev => [...prev, { ...row, caption: row.caption ?? '' }])
    }
    await revalidatePropertyCache(pid)
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
    await revalidatePropertyCache(propertyId)
  }

  async function persistOrder(items: MediaRow[]) {
    const supabase = createClient()
    await Promise.all(items.filter(m => m.id).map(m =>
      supabase.from('property_media').update({ display_order: m.display_order }).eq('id', m.id!)
    ))
    await revalidatePropertyCache(propertyId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = media.findIndex(m => m.storage_path === active.id)
    const newIndex = media.findIndex(m => m.storage_path === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(media, oldIndex, newIndex).map((m, i) => ({ ...m, display_order: i }))
    setMedia(reordered)
    persistOrder(reordered).catch(err => setError(err?.message ?? 'Failed to save order'))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {media.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map(m => m.storage_path)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map((item, i) => (
                <SortableImage
                  key={item.storage_path}
                  item={item}
                  index={i}
                  alwaysShowDelete={alwaysShowDelete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {media.length > 1 && (
        <p className="text-xs text-neutral-400">Drag to reorder. First image is the cover.</p>
      )}

      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-neutral-300 rounded-lg p-4 hover:border-neutral-400 transition-colors">
        {uploading ? <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" /> : <ImagePlus className="w-5 h-5 text-neutral-400" />}
        <span className="text-sm text-neutral-500">{uploading ? 'Optimizing & uploading...' : 'Click to upload images'}</span>
        <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
    </div>
  )
}

function SortableImage({
  item,
  index,
  alwaysShowDelete,
  onDelete,
}: {
  item: MediaRow
  index: number
  alwaysShowDelete: boolean
  onDelete: (item: MediaRow) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.storage_path,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 ${
        isDragging ? 'cursor-grabbing shadow-lg ring-2 ring-neutral-900' : 'cursor-grab'
      }`}
    >
      <div className="aspect-video relative pointer-events-none">
        <Image src={item.url} alt={item.caption || `Image ${index + 1}`} fill className="object-cover" />
      </div>
      <div className="absolute top-1 left-1 bg-black/50 text-white rounded px-1.5 py-0.5 text-xs pointer-events-none">
        {index === 0 ? 'Cover' : index + 1}
      </div>
      <div className="absolute bottom-1 left-1 bg-black/50 text-white rounded p-0.5 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3" />
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(item) }}
        className={`absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 transition-opacity ${
          alwaysShowDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
