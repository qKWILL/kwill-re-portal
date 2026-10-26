'use client'

import { useState, type TransitionStartFunction } from 'react'
import { Minus } from 'lucide-react'
import { bulkUpdateTeamTags } from '@/lib/actions/team'
import { TagPicker } from '@/components/team/TagPicker'
import { collectTags, normalizeTags } from '@/lib/utils/team-tags'

type SelectedMember = { id: string; tags: string[] }

type Props = {
  selected: SelectedMember[]
  tagOptions: string[]
  shownCount: number
  onSelectShown: () => void
  onClear: () => void
  onDone: () => void
  isPending: boolean
  startTransition: TransitionStartFunction
}

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`

export function BulkTagBar({
  selected,
  tagOptions,
  shownCount,
  onSelectShown,
  onClear,
  onDone,
  isPending,
  startTransition,
}: Props) {
  // Removing in bulk is what emptied the real estate team once, so it takes
  // a second, explicit click that names the tag and the head count.
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const count = selected.length
  const selectedTags = collectTags(selected)
  const removeCount = confirmRemove
    ? selected.filter((m) => normalizeTags(m.tags).includes(confirmRemove)).length
    : 0

  function run(change: { add: string[]; remove: string[] }, describe: (n: number) => string) {
    setMessage(null)
    startTransition(async () => {
      const result = await bulkUpdateTeamTags({
        memberIds: selected.map((m) => m.id),
        ...change,
      })
      setMessage(
        result.success
          ? { text: describe(result.changed), isError: false }
          : { text: result.error, isError: true },
      )
    })
  }

  function addTag(tag: string) {
    run({ add: [tag], remove: [] }, (n) =>
      n === 0
        ? `Everyone selected already has “${tag}”`
        : `Added “${tag}” to ${people(n)}`,
    )
  }

  function removeTag(tag: string) {
    setConfirmRemove(null)
    run({ add: [], remove: [tag] }, (n) => `Removed “${tag}” from ${people(n)}`)
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none">
      <div
        role="toolbar"
        aria-label="Edit tags for selected people"
        className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg"
      >
        <span className="text-sm font-medium text-neutral-900 tabular-nums">
          {count} selected
        </span>
        <button
          type="button"
          onClick={onSelectShown}
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          Select all {shownCount} shown
        </button>
        {count > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            Clear
          </button>
        ) : null}

        <span aria-hidden className="hidden h-5 w-px bg-neutral-200 sm:block" />

        {confirmRemove ? (
          <>
            <span className="text-sm text-neutral-700">
              Remove “{confirmRemove}” from {people(removeCount)}?
            </span>
            <button
              type="button"
              onClick={() => removeTag(confirmRemove)}
              disabled={isPending}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(null)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <TagPicker
              options={tagOptions}
              onPick={addTag}
              label="Add tag"
              canShowOnSite
              disabled={count === 0 || isPending}
            />
            <TagPicker
              options={selectedTags}
              onPick={setConfirmRemove}
              allowCreate={false}
              label="Remove tag"
              icon={<Minus className="w-3.5 h-3.5" />}
              disabled={count === 0 || isPending || selectedTags.length === 0}
            />
          </>
        )}

        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-full bg-black disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Done
        </button>

        {isPending ? (
          <span className="text-xs text-neutral-500">Saving…</span>
        ) : message ? (
          <span
            role="status"
            className={`text-xs ${message.isError ? 'text-red-600' : 'text-emerald-700'}`}
          >
            {message.text}
          </span>
        ) : null}
      </div>
    </div>
  )
}
