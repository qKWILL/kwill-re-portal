import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import sanitizeHtml from 'sanitize-html'
import DeletePostButton from './delete-post-button'
import PostStatusButton from './post-status-button'
import { getPostById } from '@/lib/cached-data'
import { getPortalSession } from '@/lib/auth'

function getYoutubeId(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  )
  return match ? match[1] : url
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin }, post] = await Promise.all([
    getPortalSession(),
    getPostById(id),
  ])

  if (!post) notFound()

  const isOwner = post.created_by === user.id
  const canDelete = isAdmin || (isOwner && post.status === 'draft')
  const canChangeStatus = isAdmin || isOwner

  const postType = post.type ?? 'news'
  const isPodcast = postType === 'podcast'
  const hasContent =
    typeof post.content_html === 'string' &&
    post.content_html.trim().length > 0
  const author = Array.isArray(post.team_members)
    ? post.team_members[0]
    : post.team_members

  return (
    <main className="pb-16 bg-white">
      {/* Admin bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/posts"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              ← Posts
            </Link>
            <PostStatusButton
              postId={id}
              currentStatus={post.status}
              canChangeStatus={canChangeStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/posts/${id}/edit`}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            <DeletePostButton postId={id} canDelete={canDelete} />
          </div>
        </div>
      </div>

      {/* Header band */}
      <header className="max-w-[960px] mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-8">
        <span className="text-xs font-sans font-normal uppercase tracking-[0.15em] text-neutral-500 mb-6 block">
          {postType.charAt(0).toUpperCase() + postType.slice(1)}
        </span>

        <h1 className="font-serif text-[clamp(2rem,1rem+4vw,3.25rem)] leading-[1.08] tracking-tight text-neutral-900 mb-4">
          {post.title || 'Untitled'}
        </h1>

        {post.excerpt ? (
          <p className="text-lg md:text-xl leading-relaxed text-neutral-500 mb-8 max-w-2xl">
            {post.excerpt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          {author?.name ? (
            <>
              <span className="font-medium text-neutral-900">
                <Link
                  href={`/team/${author.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {author.name}
                </Link>
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
            </>
          ) : null}
          {post.date ? (
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          ) : (
            <span className="text-neutral-400 italic">Not yet published</span>
          )}
        </div>
      </header>

      {/* Featured image */}
      {post.img_url ? (
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="relative aspect-[21/9] overflow-hidden">
            <Image
              src={post.img_url}
              alt={post.title ?? ''}
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 64rem, 100vw"
            />
          </div>
        </div>
      ) : null}

      {/* Podcast embed */}
      {isPodcast && post.youtube_url ? (
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-8">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(post.youtube_url)}`}
              title={post.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {/* Body */}
      <article className="max-w-4xl mx-auto px-6 md:px-8 pt-12 pb-20">
        {hasContent ? (
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(post.content_html ?? '', {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                  'img',
                  'h1',
                  'h2',
                ]),
                allowedAttributes: {
                  ...sanitizeHtml.defaults.allowedAttributes,
                  img: ['src', 'alt', 'title', 'width', 'height'],
                  a: ['href', 'name', 'target', 'rel'],
                },
              }),
            }}
          />
        ) : post.external_url && !isPodcast ? (
          <p className="mt-4">
            <a
              href={post.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              Read Full Article
            </a>
          </p>
        ) : isPodcast ? null : (
          <p className="text-sm text-neutral-400 italic">
            No body content yet.
          </p>
        )}
      </article>
    </main>
  )
}
