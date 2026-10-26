'use client'

import { useState, useTransition } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { setTeamTagVisibility } from '@/lib/actions/team-tags'

export type WebsiteTabRow = {
  name: string
  label: string | null
  count: number
  showOnSite: boolean
}

/** `tags` is null when the tab settings couldn't be loaded. */
export function WebsiteTabsPanel({ tags }: { tags: WebsiteTabRow[] | null }) {
  const [isPending, startTransition] = useTransition()
  const [savingName, setSavingName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggle(name: string, showOnSite: boolean) {
    setError(null)
    setSavingName(name)
    startTransition(async () => {
      const result = await setTeamTagVisibility({ name, showOnSite })
      if (!result.success) setError(result.error)
      setSavingName(null)
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Website tabs
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-neutral-500">
          Website tabs
        </div>
        {tags === null ? (
          <p className="px-3 pb-3 text-sm text-red-600">
            Couldn&apos;t load website tabs. Reload to try again.
          </p>
        ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {tags.map((t) => (
            <li key={t.name}>
              <label className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50">
                <span className={`flex-1 ${t.label ? '' : 'capitalize'}`}>
                  {t.label ?? t.name}
                </span>
                <span className="text-xs text-neutral-400 tabular-nums">{t.count}</span>
                <Switch
                  checked={t.showOnSite}
                  disabled={isPending && savingName === t.name}
                  onCheckedChange={(next) => toggle(t.name, next)}
                  aria-label={`Show ${t.name} as a tab on the website`}
                />
              </label>
            </li>
          ))}
        </ul>
        )}
        {error ? (
          <p className="px-3 pb-3 text-xs text-red-600">{error}</p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
