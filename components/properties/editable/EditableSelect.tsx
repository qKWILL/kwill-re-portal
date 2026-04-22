'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Option = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  error?: boolean
  ariaLabel?: string
}

export function EditableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
  error,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => ref.current?.focus())
    }
  }, [editing])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const baseRing = error
    ? 'ring-1 ring-red-400'
    : 'hover:ring-1 hover:ring-dashed hover:ring-neutral-300 focus-within:ring-1 focus-within:ring-neutral-400'

  if (editing) {
    return (
      <select
        ref={ref}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            setEditing(false)
          }
        }}
        className={cn(
          'bg-transparent outline-none border border-neutral-300 rounded px-2 py-1',
          className,
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  const isEmpty = !value
  return (
    <span
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
        'cursor-pointer rounded px-0.5 -mx-0.5 transition-shadow capitalize',
        baseRing,
        isEmpty && 'text-neutral-400 italic',
        className,
      )}
    >
      {isEmpty ? placeholder : selectedLabel}
    </span>
  )
}
