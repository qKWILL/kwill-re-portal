'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { revalidatePropertyCache } from '@/lib/actions/media'
import { Loader2, X, FileText } from 'lucide-react'

type MediaRow = {
  id?: string
  url: string
  storage_path: string
  display_order: number
  caption: string
  filename: string
}

export default function PropertyBrochureUpload({
  propertyId,
  existingBrochures = [],
}: {
  propertyId: string
  existingBrochures?: MediaRow[]
}) {
  const [brochures, setBrochures] = useState<MediaRow[]>(existingBrochures)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setError(null)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are accepted.')
        setUploading(false)
        return
      }

      const path = `${propertyId}/brochures/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-media').getPublicUrl(path)

      const { data: row, error: dbError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          media_type: 'brochure',
          url: publicUrl,
          storage_path: path,
          filename: file.name,
          file_size: file.size,
          mime_type: 'application/pdf',
          display_order: 0,
        })
        .select('id, url, storage_path, display_order, caption')
        .single()

      if (dbError) {
        setError(dbError.message)
        setUploading(false)
        return
      }

      setBrochures((prev) => [
        ...prev,
        { ...row, caption: row.caption ?? '', filename: file.name },
      ])
    }
    await revalidatePropertyCache(propertyId)
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(item: MediaRow) {
    const supabase = createClient()
    await supabase.storage.from('property-media').remove([item.storage_path])
    if (item.id) await supabase.from('property_media').delete().eq('id', item.id)
    setBrochures((prev) => prev.filter((b) => b.storage_path !== item.storage_path))
    await revalidatePropertyCache(propertyId)
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {brochures.length > 0 && (
        <div className="space-y-2">
          {brochures.map((item) => (
            <div
              key={item.storage_path}
              className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50 group"
            >
              <FileText className="w-5 h-5 text-red-500 shrink-0" />
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-800 hover:underline truncate flex-1"
              >
                {item.filename || 'Brochure.pdf'}
              </a>
              <button
                onClick={() => handleDelete(item)}
                type="button"
                className="text-neutral-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-neutral-300 rounded-lg p-4 hover:border-neutral-400 transition-colors">
        {uploading ? (
          <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
        ) : (
          <FileText className="w-5 h-5 text-neutral-400" />
        )}
        <span className="text-sm text-neutral-500">
          {uploading ? 'Uploading...' : 'Click to upload a brochure PDF'}
        </span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}
