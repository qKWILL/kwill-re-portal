'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { PortalPostCard } from './NewsCard'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  published: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Active',
}

export function NewsRow({ post }: { post: PortalPostCard }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      prefetch
      className="group flex items-center gap-4 py-3 px-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
    >
      <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden bg-neutral-100">
        {post.img_url ? (
          <Image
            src={post.img_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-neutral-900 truncate">
          {post.title || 'Untitled'}
        </p>
        {post.excerpt ? (
          <p className="text-sm text-neutral-500 truncate">{post.excerpt}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {post.type ? (
          <span className="bg-white text-xs font-medium px-2 py-1 capitalize border border-neutral-200">
            {post.type}
          </span>
        ) : null}
        <span
          className={`text-[11px] font-medium px-2 py-1 rounded-full ${
            STATUS_COLORS[post.status] ?? 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {STATUS_LABELS[post.status] ??
            post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </span>
      </div>
    </Link>
  )
}
