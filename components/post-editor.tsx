'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ExternalLink, Video } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { savePost, type PostFormData } from '@/lib/actions/posts'
import { EditableText } from '@/components/properties/editable/EditableText'
import { EditableRichText } from '@/components/properties/editable/EditableRichText'
import { EditableHeroImage } from '@/components/properties/editable/EditableHeroImage'
import PostStatusButton from '@/app/(portal)/posts/[id]/post-status-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TeamMember = { id: string; name: string }

const POST_TYPES = [
  { value: 'blog', label: 'Blog' },
  { value: 'news', label: 'News' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'linkedin', label: 'LinkedIn' },
]

type InitialPost = {
  id?: string
  title?: string
  type?: string
  status?: string
  excerpt?: string | null
  external_url?: string | null
  youtube_url?: string | null
  img_url?: string | null
  author_id?: string | null
  content_json?: unknown
  content_html?: string | null
  date?: string | null
}

function getYoutubeId(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  )
  return match ? match[1] : url
}

export default function PostEditor({
  teamMembers,
  post,
}: {
  teamMembers: TeamMember[]
  post?: InitialPost
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [title, setTitle] = useState(post?.title ?? '')
  const [type, setType] = useState(post?.type ?? 'blog')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [externalUrl, setExternalUrl] = useState(post?.external_url ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(post?.youtube_url ?? '')
  const [imgUrl, setImgUrl] = useState(post?.img_url ?? '')
  const [authorId, setAuthorId] = useState(post?.author_id ?? '')
  const editorRef = useRef<BlogEditorHandle | null>(null)

  const [externalModalOpen, setExternalModalOpen] = useState(false)
  const [externalDraft, setExternalDraft] = useState('')
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false)
  const [youtubeDraft, setYoutubeDraft] = useState('')

  const effectiveStatus = (post?.status ?? 'draft') as 'draft' | 'published'
  const isDraft = effectiveStatus === 'draft'

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSave(status: 'draft' | 'published') {
    setSaving(true)
    setErrors({})

    let content_json: unknown = post?.content_json ?? null
    let content_html: string | null = post?.content_html ?? null
    if (type === 'blog' && editorRef.current) {
      content_json = editorRef.current.getJSON() ?? null
      content_html = editorRef.current.getHTML() ?? null
    }

    const data: PostFormData = {
      id: post?.id,
      title,
      type,
      excerpt,
      external_url: externalUrl,
      youtube_url: youtubeUrl,
      img_url: imgUrl,
      author_id: authorId,
      content_json,
      content_html: content_html ?? undefined,
    }

    const result = await savePost(data, status)
    setSaving(false)
    if (!result.success) {
      setErrors(result.errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.href = `/posts/${result.id}`
  }

  const typeLabel =
    POST_TYPES.find((t) => t.value === type)?.label ?? 'Select type'
  const authorName =
    teamMembers.find((m) => m.id === authorId)?.name ?? 'Select author'
  const errorBanner =
    errors._ || Object.keys(errors).some((k) => k !== '_')

  return (
    <main className="pb-16 bg-white">
      {/* Sticky admin bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {post?.id ? (
              <PostStatusButton
                postId={post.id}
                currentStatus={effectiveStatus}
              />
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-neutral-500 hover:text-neutral-900 px-2"
            >
              Cancel
            </button>
            {isDraft ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(effectiveStatus)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </div>
        {errorBanner ? (
          <div className="max-w-[1200px] mx-auto px-6 pb-3">
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {errors._ ??
                'Please fix the highlighted fields before publishing.'}
              {Object.entries(errors)
                .filter(([k]) => k !== '_')
                .map(([k, v]) => (
                  <div key={k}>
                    ⚠ {k}: {v}
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Header band */}
      <header className="max-w-[960px] mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-8">
        {/* Type eyebrow */}
        <div className="mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.15em] transition-colors bg-neutral-100 text-neutral-600 hover:bg-neutral-200 ${
                  errors.type ? 'ring-1 ring-red-400' : ''
                }`}
                aria-label="Post type"
              >
                {typeLabel}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              {POST_TYPES.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onSelect={() => {
                    setType(t.value)
                    clearError('type')
                  }}
                >
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <EditableText
          as="h1"
          value={title}
          onChange={(v) => {
            setTitle(v)
            if (v) clearError('title')
          }}
          placeholder="Post title"
          error={!!errors.title}
          className="font-serif text-[clamp(2rem,1rem+4vw,3.25rem)] leading-[1.08] tracking-tight text-neutral-900 mb-4 block"
          ariaLabel="Title"
        />

        <EditableRichText
          value={excerpt}
          onChange={(v) => {
            setExcerpt(v)
            if (v) clearError('excerpt')
          }}
          placeholder="Short summary / excerpt"
          error={!!errors.excerpt}
          rows={3}
          className="text-lg md:text-xl leading-relaxed text-neutral-500 mb-8 max-w-2xl"
          ariaLabel="Excerpt"
        />

        {/* Byline */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                aria-label="Author"
              >
                {authorName}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[12rem]">
              <DropdownMenuItem onSelect={() => setAuthorId('')}>
                No author
              </DropdownMenuItem>
              {teamMembers.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onSelect={() => setAuthorId(m.id)}
                >
                  {m.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {post?.date ? (
            <>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </>
          ) : null}
        </div>
      </header>

      {/* Hero image */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <EditableHeroImage
          value={imgUrl}
          onChange={(v) => {
            setImgUrl(v)
            if (v) clearError('img_url')
          }}
          bucket="post-images"
          folder="posts"
          aspectClass="aspect-[21/9]"
          placeholderLabel="Upload featured image"
          alt={title}
          error={!!errors.img_url}
          sizes="(min-width: 1024px) 64rem, 100vw"
        />
      </div>

      {/* Body */}
      <article className="max-w-[960px] mx-auto px-6 md:px-8 pt-12 pb-20">
        {type === 'blog' ? (
          <div className="min-h-[300px] border border-neutral-200 rounded-lg overflow-hidden">
            <BlogEditor
              ref={editorRef}
              initialContent={post?.content_json}
            />
            {errors.content ? (
              <p className="text-xs text-red-600 p-3">⚠ {errors.content}</p>
            ) : null}
          </div>
        ) : type === 'podcast' ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setYoutubeDraft(youtubeUrl)
                setYoutubeModalOpen(true)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors ${
                errors.youtube_url ? 'ring-1 ring-red-400' : ''
              }`}
            >
              <Video className="w-4 h-4" />
              {youtubeUrl ? 'Edit YouTube URL' : 'Add YouTube URL'}
            </button>
            {youtubeUrl ? (
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(youtubeUrl)}`}
                  title={title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setExternalDraft(externalUrl)
                setExternalModalOpen(true)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors ${
                errors.external_url ? 'ring-1 ring-red-400' : ''
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              {externalUrl ? 'Edit external link' : 'Add external link'}
            </button>
            {externalUrl ? (
              <p className="text-sm text-neutral-500 break-all">
                {externalUrl}
              </p>
            ) : null}
          </div>
        )}
      </article>

      <Dialog open={externalModalOpen} onOpenChange={setExternalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              External link
            </DialogTitle>
            <DialogDescription>
              The full URL readers will be sent to when they click &ldquo;Read
              Full Article&rdquo; on the public site.
            </DialogDescription>
          </DialogHeader>
          <input
            type="url"
            value={externalDraft}
            onChange={(e) => setExternalDraft(e.target.value)}
            placeholder="https://..."
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            autoFocus
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setExternalModalOpen(false)}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setExternalUrl(externalDraft.trim())
                clearError('external_url')
                setExternalModalOpen(false)
              }}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={youtubeModalOpen} onOpenChange={setYoutubeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              Video URL
            </DialogTitle>
            <DialogDescription>
              YouTube, Spotify, Buzzsprout, or any embeddable video URL.
            </DialogDescription>
          </DialogHeader>
          <input
            type="url"
            value={youtubeDraft}
            onChange={(e) => setYoutubeDraft(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            autoFocus
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setYoutubeModalOpen(false)}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setYoutubeUrl(youtubeDraft.trim())
                clearError('youtube_url')
                setYoutubeModalOpen(false)
              }}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

type BlogEditorHandle = {
  getJSON: () => unknown
  getHTML: () => string | null
}

const BlogEditor = forwardRef<
  BlogEditorHandle,
  { initialContent?: unknown }
>(function BlogEditor({ initialContent }, ref) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const editor = useEditor({
    extensions: [StarterKit],
    content: (initialContent as string | object | undefined) ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[250px] px-4 py-3',
      },
    },
  })

  useImperativeHandle(ref, () => ({
    getJSON: () => editor?.getJSON() ?? null,
    getHTML: () => editor?.getHTML() ?? null,
  }))

  if (!mounted)
    return (
      <div className="h-[250px] bg-neutral-50 rounded border border-neutral-200 animate-pulse" />
    )

  return <EditorContent editor={editor} />
})
