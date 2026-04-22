'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  error?: boolean
  ariaLabel?: string
}

export function EditableRichText({
  value,
  onChange,
  placeholder = 'Click to edit',
  className,
  rows = 4,
  error,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      requestAnimationFrame(() => {
        ref.current?.focus()
      })
    }
  }, [editing, value])

  function commit() {
    if (draft !== value) onChange(draft)
    setEditing(false)
  }
  function revert() {
    setDraft(value)
    setEditing(false)
  }

  const baseRing = error
    ? 'ring-1 ring-red-400'
    : 'hover:ring-1 hover:ring-dashed hover:ring-neutral-300 focus-within:ring-1 focus-within:ring-neutral-400'

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        rows={rows}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            revert()
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            commit()
          }
        }}
        className={cn(
          'bg-transparent outline-none border border-neutral-300 rounded p-2 w-full resize-y',
          className,
        )}
      />
    )
  }

  const isEmpty = !value
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setEditing(true)
        }
      }}
      className={cn(
        'cursor-text rounded px-1 -mx-1 py-1 -my-1 transition-shadow whitespace-pre-wrap',
        baseRing,
        isEmpty && 'text-neutral-400 italic',
        className,
      )}
    >
      {isEmpty ? placeholder : value}
    </div>
  )
}
