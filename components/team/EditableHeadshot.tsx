'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from '@/components/kibo-ui/image-crop'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  value: string
  onChange: (url: string) => void
  bucket: string
  folder?: string
  alt?: string
  placeholderLabel?: string
  sizes?: string
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch?.[1] ?? 'image/png'
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function EditableHeadshot({
  value,
  onChange,
  bucket,
  folder,
  alt = '',
  placeholderLabel = 'Upload headshot',
  sizes,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropped, setCropped] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropped(null)
    setError(null)
    setPendingFile(file)
    e.target.value = ''
  }

  async function handleApply() {
    if (!cropped || !pendingFile) return
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const blob = dataUrlToBlob(cropped)
      const key = `${folder ? `${folder}/` : ''}${Date.now()}.png`
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(key, blob, { upsert: true, contentType: 'image/png' })
      if (uploadErr) {
        setError(uploadErr.message)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(key)
      onChange(publicUrl)
      setPendingFile(null)
      setCropped(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function closeDialog() {
    if (uploading) return
    setPendingFile(null)
    setCropped(null)
    setError(null)
  }

  return (
    <div className="relative w-full aspect-square overflow-hidden bg-neutral-100 group">
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
          >
            <ImagePlus className="w-3.5 h-3.5" /> Change photo
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors"
        >
          <ImagePlus className="w-5 h-5" />
          <span>{placeholderLabel}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      <Dialog
        open={!!pendingFile}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              Crop headshot
            </DialogTitle>
            <DialogDescription>
              Drag the corners to frame the photo. Headshots are cropped to a
              square.
            </DialogDescription>
          </DialogHeader>

          {pendingFile ? (
            <div className="flex flex-col items-center gap-3">
              <ImageCrop
                file={pendingFile}
                aspect={1}
                circularCrop
                onCrop={setCropped}
              >
                <ImageCropContent className="max-h-[360px]" />
                <div className="flex items-center gap-2 pt-2">
                  <ImageCropReset />
                  <ImageCropApply />
                </div>
              </ImageCrop>
            </div>
          ) : null}

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={closeDialog}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!cropped || uploading}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                </>
              ) : (
                'Save headshot'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
