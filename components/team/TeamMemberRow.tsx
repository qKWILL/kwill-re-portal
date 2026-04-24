'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CircleCheck, Pencil } from 'lucide-react'
import type { PortalTeamCard } from './TeamMemberCard'

type Props = {
  member: PortalTeamCard
  canEdit: boolean
  interactive: boolean
  hasAccount?: boolean
}

export function TeamMemberRow({ member, canEdit, interactive, hasAccount }: Props) {
  const tags = member.tags ?? []
  const shownTags = tags.slice(0, 3)
  const extraTags = Math.max(0, tags.length - shownTags.length)

  const body = (
    <>
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
        {member.img_url ? (
          <Image
            src={member.img_url}
            alt={member.name || 'Team member'}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium text-neutral-900 truncate">
            {member.name || 'Unnamed'}
          </p>
          <p className="text-sm text-neutral-500 truncate">{member.role || ''}</p>
        </div>
        {hasAccount ? (
          <CircleCheck
            strokeWidth={1.5}
            aria-label="Has portal access"
            className="size-[18px] shrink-0 [&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white"
          />
        ) : null}
      </div>
      <div className="hidden md:flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0 max-w-xs">
        {shownTags.map((t) => (
          <span
            key={t}
            className="text-[11px] font-medium px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 capitalize"
          >
            {t}
          </span>
        ))}
        {extraTags > 0 ? (
          <span className="text-[11px] font-medium text-neutral-400">
            + {extraTags} more
          </span>
        ) : null}
      </div>
    </>
  )

  return (
    <div className="relative group">
      {interactive ? (
        <Link
          href={`/team/${member.id}`}
          prefetch
          className="flex items-center gap-4 py-3 px-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-4 py-3 px-3 border-b border-neutral-100 cursor-default select-none opacity-90">
          {body}
        </div>
      )}
      {canEdit ? (
        <Link
          href={`/team/${member.id}/edit`}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 rounded-full bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit member"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
