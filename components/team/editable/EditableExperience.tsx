'use client'

import { useEffect, useRef, useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ExperienceEntry } from '@/lib/utils/team-experience'

type Props = {
  value: ExperienceEntry[]
  onChange: (next: ExperienceEntry[]) => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function EditableExperience({ value, onChange }: Props) {
  // Local row IDs stay in lockstep with `value.length`. They're ephemeral —
  // never persisted — and exist only so dnd-kit has a stable key per row
  // across reorders. Stored in a ref-mirrored state so add/remove/reorder
  // helpers can reason about them synchronously.
  const [ids, setIds] = useState<string[]>(() => value.map(() => newId()))
  const idsRef = useRef(ids)
  idsRef.current = ids

  // Reconcile if the parent ever swaps the entire array (e.g. resetting a form).
  useEffect(() => {
    if (idsRef.current.length !== value.length) {
      setIds((prev) =>
        value.map((_, i) => prev[i] ?? newId()),
      )
    }
  }, [value.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function update(i: number, key: keyof ExperienceEntry, text: string) {
    const next = [...value]
    next[i] = { ...next[i], [key]: text }
    onChange(next)
  }
  function add() {
    setIds((prev) => [...prev, newId()])
    onChange([...value, { company: '', role: '' }])
  }
  function remove(i: number) {
    setIds((prev) => prev.filter((_, idx) => idx !== i))
    onChange(value.filter((_, idx) => idx !== i))
  }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = idsRef.current.indexOf(String(active.id))
    const to = idsRef.current.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    setIds((prev) => arrayMove(prev, from, to))
    onChange(arrayMove(value, from, to))
  }

  const showHandles = value.length > 1

  return (
    <div className="space-y-3 max-w-3xl">
      {value.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">
          No experience added yet.
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {value.map((entry, i) => (
            <SortableRow
              key={ids[i]}
              id={ids[i]}
              showHandle={showHandles}
              entry={entry}
              onCompanyChange={(v) => update(i, 'company', v)}
              onRoleChange={(v) => update(i, 'role', v)}
              onRemove={() => remove(i)}
              removeLabel={`Remove experience ${i + 1}`}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add experience
      </button>
    </div>
  )
}

function SortableRow({
  id,
  entry,
  showHandle,
  onCompanyChange,
  onRoleChange,
  onRemove,
  removeLabel,
}: {
  id: string
  entry: ExperienceEntry
  showHandle: boolean
  onCompanyChange: (v: string) => void
  onRoleChange: (v: string) => void
  onRemove: () => void
  removeLabel: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-md border border-neutral-200 bg-white p-4 pr-10 ${
        showHandle ? 'pl-10' : ''
      } ${
        isDragging
          ? 'z-10 shadow-lg ring-1 ring-neutral-300'
          : 'shadow-none'
      }`}
    >
      {showHandle ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className={`absolute top-1/2 left-2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
            Company
          </label>
          <input
            value={entry.company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="e.g. Umoja Supply Chain Solutions"
            className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
            Role
          </label>
          <input
            value={entry.role}
            onChange={(e) => onRoleChange(e.target.value)}
            placeholder="e.g. Investment Banking Analyst"
            className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 text-neutral-400 hover:text-red-500"
        aria-label={removeLabel}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
