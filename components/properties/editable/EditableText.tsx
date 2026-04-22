'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'
  type?: 'text' | 'number'
  maxLength?: number
  error?: boolean
  ariaLabel?: string
}

export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit',
  className,
  as: Tag = 'span',
  type = 'text',
  maxLength,
  error,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
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
    const size = Math.max(
      draft.length,
      placeholder.length,
      type === 'number' ? 3 : 2,
    )
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        size={size}
        maxLength={maxLength}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            revert()
          }
        }}
        style={{ fieldSizing: 'content' } as React.CSSProperties}
        className={cn(
          'bg-transparent outline-none border-b border-neutral-400 p-0 m-0 inline-block align-baseline',
          className,
        )}
      />
    )
  }

  const isEmpty = !value
  return (
    <Tag
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
        'cursor-text rounded px-0.5 -mx-0.5 transition-shadow inline-block align-baseline',
        baseRing,
        isEmpty && 'text-neutral-400 italic',
        className,
      )}
    >
      {isEmpty ? placeholder : value}
    </Tag>
  )
}
