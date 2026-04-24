'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CircleCheck, Pencil } from 'lucide-react'

export type PortalTeamCard = {
  id: string
  name: string
  role: string
  img_url: string | null
  tags?: string[]
}

type Props = {
  member: PortalTeamCard
  canEdit: boolean
  interactive: boolean
  hasAccount?: boolean
}

export function TeamMemberCard({ member, canEdit, interactive, hasAccount }: Props) {
  const inner = (
    <>
      <div className="aspect-square w-full mb-5 overflow-hidden relative bg-neutral-100">
        {member.img_url ? (
          <Image
            src={member.img_url}
            alt={member.name || 'Team Member'}
            fill
            className={`object-cover transition-transform duration-300 ease-in-out ${interactive ? 'group-hover:scale-[1.015]' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            No headshot
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-md font-medium text-neutral-900 mb-0.5 flex items-center">
          {member.name || 'Unnamed'}
          {hasAccount ? (
            <CircleCheck
              strokeWidth={1.5}
              aria-label="Has portal access"
              className="ml-2 size-[18px] shrink-0 [&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white"
            />
          ) : null}
        </p>
        <p className="font-light text-neutral-600">{member.role || ''}</p>
      </div>
    </>
  )

  return (
    <div className="relative group">
      {interactive ? (
        <Link href={`/team/${member.id}`} prefetch className="block">
          {inner}
        </Link>
      ) : (
        <div className="block cursor-default select-none opacity-90">
          {inner}
        </div>
      )}
      {canEdit ? (
        <Link
          href={`/team/${member.id}/edit`}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 backdrop-blur text-neutral-600 hover:text-neutral-900 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Edit member"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
