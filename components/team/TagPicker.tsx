'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createTeamTag } from '@/lib/actions/team-tags'
import { cn } from '@/lib/utils'
import {
  RESERVED_TAG,
  findMatchingTag,
  normalizeTag,
  tagDisplayLabel,
  tagMatchScore,
} from '@/lib/utils/team-tags'

type Props = {
  /** Existing tags to choose from. */
  options: string[]
  /** Tags the person already has: shown checked and not pickable, so "Add" never removes. */
  selected?: string[]
  onPick: (tag: string) => void
  /** Offer `Create "…"` when the typed text matches no existing tag. */
  allowCreate?: boolean
  /** Admins may put a new tag on the website when creating it. */
  canShowOnSite?: boolean
  label: string
  icon?: ReactNode
  disabled?: boolean
  triggerClassName?: string
}

// "realestate" or "Real-Estate" should still surface "real estate", and an
// exact spelling must outrank a longer tag that contains it, so rank on the
// punctuation-free key rather than cmdk's default fuzzy score.
function filterByKey(value: string, search: string): number {
  return tagMatchScore(value, search)
}

export function TagPicker({
  options,
  selected = [],
  onPick,
  allowCreate = true,
  canShowOnSite = false,
  label,
  icon = <Plus className="w-3.5 h-3.5" />,
  disabled = false,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // Text typed but never picked. Shown next to the trigger so it can't vanish silently.
  const [dropped, setDropped] = useState('')
  // Raw text as typed, so a deliberate spelling like "ESG" survives as the label.
  const [pendingCreate, setPendingCreate] = useState<string | null>(null)
  const [showOnSite, setShowOnSite] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, startCreating] = useTransition()

  const typed = normalizeTag(query)
  const canCreate =
    allowCreate &&
    typed !== '' &&
    typed !== RESERVED_TAG &&
    !findMatchingTag(options, typed)

  function close() {
    setOpen(false)
    setQuery('')
  }

  function pick(tag: string) {
    setDropped('')
    close()
    if (!selected.includes(tag)) onPick(tag)
  }

  function askToCreate(raw: string) {
    setDropped('')
    close()
    setShowOnSite(false)
    setCreateError(null)
    setPendingCreate(raw.trim())
  }

  // Same resolution the list uses: an existing spelling wins over creating.
  function addDropped() {
    if (disabled) return
    const match = findMatchingTag(options, dropped)
    if (match) pick(match)
    else if (normalizeTag(dropped) !== RESERVED_TAG) askToCreate(dropped)
  }

  function confirmCreate() {
    if (!pendingCreate) return
    const raw = pendingCreate
    startCreating(async () => {
      const result = await createTeamTag({ name: raw, showOnSite })
      if (!result.success) {
        setCreateError(result.error)
        return
      }
      setPendingCreate(null)
      onPick(result.name)
    })
  }

  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-2">
        <Popover
          modal
          open={open}
          onOpenChange={(next) => {
            if (next) {
              setOpen(true)
              return
            }
            // Only an Add picker loses anything by closing; Remove has nothing to keep.
            if (allowCreate && typed) setDropped(query.trim())
            close()
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50',
                triggerClassName,
              )}
            >
              {icon}
              {label}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 p-0"
            onEscapeKeyDown={(e) => {
              // Escape is a deliberate cancel: close without the "wasn't added" note.
              e.preventDefault()
              close()
            }}
          >
            <Command filter={filterByKey}>
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={allowCreate ? 'Find or create a tag…' : 'Find a tag…'}
              />
              {/* Keep focus in the search box: a click on a checked (disabled)
                  row would otherwise land on the list and swallow typing. */}
              <CommandList onMouseDown={(e) => e.preventDefault()}>
                <CommandEmpty>No matching tags.</CommandEmpty>
                {options.length > 0 ? (
                  <CommandGroup>
                    {options.map((tag) => {
                      const has = selected.includes(tag)
                      return (
                        <CommandItem
                          key={tag}
                          value={tag}
                          disabled={has}
                          data-checked={has}
                          onSelect={() => pick(tag)}
                          className="capitalize"
                        >
                          {tag}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ) : null}
                {canCreate ? (
                  <CommandGroup heading="New tag" forceMount>
                    <CommandItem
                      forceMount
                      value={`create:${typed}`}
                      onSelect={() => askToCreate(query)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create &ldquo;{tagDisplayLabel(query) ?? typed}&rdquo;
                    </CommandItem>
                  </CommandGroup>
                ) : null}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {dropped && !disabled ? (
          <span role="status" className="inline-flex items-center gap-2 text-xs text-amber-700">
            &ldquo;{dropped}&rdquo; wasn&apos;t added
            <button
              type="button"
              onClick={addDropped}
              className="font-medium underline underline-offset-2 hover:text-amber-900"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setDropped('')}
              className="text-neutral-400 hover:text-neutral-700"
              aria-label="Dismiss"
            >
              ×
            </button>
          </span>
        ) : null}
      </span>

      <Dialog
        open={pendingCreate !== null}
        onOpenChange={(next) => {
          if (!next && !isCreating) setPendingCreate(null)
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              Create &ldquo;
              {pendingCreate
                ? tagDisplayLabel(pendingCreate) ?? normalizeTag(pendingCreate)
                : ''}
              &rdquo; tag
            </DialogTitle>
          </DialogHeader>
          {canShowOnSite ? (
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={showOnSite}
                onChange={(e) => setShowOnSite(e.target.checked)}
                className="size-4 accent-black"
              />
              Show as a tab on the website
            </label>
          ) : null}
          {createError ? (
            <p className="text-sm text-red-600">{createError}</p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPendingCreate(null)}
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating…' : 'Create tag'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
