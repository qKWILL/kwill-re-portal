'use client'

import Image from 'next/image'
import Link from 'next/link'

export type PortalPostCard = {
  id: string
  title: string
  excerpt: string | null
  img_url: string | null
  type: string
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  published: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Active',
}

export function NewsCard({ post }: { post: PortalPostCard }) {
  return (
    <Link href={`/posts/${post.id}`} prefetch className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {post.img_url ? (
          <Image
            src={post.img_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {post.type ? (
            <span className="bg-white/90 text-xs font-medium px-2 py-1 capitalize">
              {post.type}
            </span>
          ) : null}
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`text-[11px] font-medium px-2 py-1 rounded-full ${
              STATUS_COLORS[post.status] ?? 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {STATUS_LABELS[post.status] ??
              post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="space-y-2 py-6">
        <h4 className="text-xl font-sans font-medium tracking-[-.2px]">
          {post.title || 'Untitled'}
        </h4>
        {post.excerpt ? (
          <p className="text-sm max-w-[90%] text-neutral-800">{post.excerpt}</p>
        ) : null}
      </div>
    </Link>
  )
}
