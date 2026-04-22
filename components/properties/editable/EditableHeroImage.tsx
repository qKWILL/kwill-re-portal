'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  value: string
  onChange: (url: string) => void
  bucket: string
  folder?: string
  aspectClass?: string
  placeholderLabel?: string
  alt?: string
  error?: boolean
  rounded?: boolean
  sizes?: string
}

export function EditableHeroImage({
  value,
  onChange,
  bucket,
  folder,
  aspectClass = 'aspect-[21/9]',
  placeholderLabel = 'Upload image',
  alt = '',
  error,
  rounded = false,
  sizes,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const key = `${folder ? `${folder}/` : ''}${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(key, file, { upsert: true })
      if (uploadErr) {
        setUploadError(uploadErr.message)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(key)
      onChange(publicUrl)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await upload(file)
    e.target.value = ''
  }

  const shape = rounded ? 'rounded-full' : ''

  return (
    <div
      className={`relative w-full ${aspectClass} ${shape} overflow-hidden bg-neutral-100 group ${
        error ? 'ring-1 ring-red-400' : ''
      }`}
    >
      {value ? (
        <>
          <Image
            src={value}
            alt={alt}
            fill
            className="object-cover"
            sizes={sizes}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium shadow hover:bg-white transition-colors"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="w-3.5 h-3.5" /> Change image
              </>
            )}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImagePlus className="w-5 h-5" />
          )}
          <span>{uploading ? 'Uploading…' : placeholderLabel}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      {uploadError ? (
        <div className="absolute bottom-2 left-2 right-2 bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-1 rounded">
          {uploadError}
        </div>
      ) : null}
    </div>
  )
}
