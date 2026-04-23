'use client'

import { useState } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { renamePropertySlug } from '@/lib/actions/slug'

type Props = {
  propertyId: string
  initialSlug: string
  marketingOrigin?: string
}

export default function PropertySlugEditor({
  propertyId,
  initialSlug,
  marketingOrigin,
}: Props) {
  const [slug, setSlug] = useState(initialSlug)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialSlug)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fullUrl = marketingOrigin
    ? `${marketingOrigin}/properties/${slug}`
    : `/properties/${slug}`

  async function handleSave() {
    const next = draft.trim().toLowerCase()
    if (!next || next === slug) {
      setEditing(false)
      setDraft(slug)
      setError(null)
      return
    }
    setBusy(true)
    setError(null)
    const result = await renamePropertySlug(propertyId, next)
    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSlug(result.slug)
    setDraft(result.slug)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(slug)
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-mono truncate max-w-[320px]" title={fullUrl}>
          {fullUrl}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditing(true)
            setError(null)
          }}
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
          aria-label="Edit URL"
        >
          <Pencil className="w-3 h-3" />
          <span>Edit URL</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-neutral-400 font-mono shrink-0">
          {marketingOrigin ? `${marketingOrigin}/properties/` : '/properties/'}
        </span>
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            if (error) setError(null)
          }}
          disabled={busy}
          spellCheck={false}
          autoFocus
          className="text-xs font-mono border border-neutral-300 rounded px-2 py-1 focus:border-neutral-500 focus:outline-none disabled:opacity-50 w-[220px]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !draft.trim()}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40"
          aria-label="Save URL"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-neutral-500 hover:text-neutral-900"
          aria-label="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {error ? (
        <p className="text-[11px] text-red-600">{error}</p>
      ) : (
        <p className="text-[11px] text-neutral-400">
          Changing the URL 301-redirects the old address to the new one.
        </p>
      )}
    </div>
  )
}
