'use client'

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import { Button } from '@/components/ui/button'
import { savePost, type PostFormData } from '@/lib/actions/posts'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type TeamMember = { id: string; name: string }

const POST_TYPES = [
  { value: 'blog',     label: 'Blog Post',   desc: 'Full article with rich text editor' },
  { value: 'news',     label: 'News',         desc: 'Link to external news article' },
  { value: 'linkedin', label: 'LinkedIn',     desc: 'Share a LinkedIn post' },
  { value: 'podcast',  label: 'Podcast',      desc: 'Embed a podcast or video episode' },
]

export default function PostForm({
  teamMembers,
  userId,
  post,
}: {
  teamMembers: TeamMember[]
  userId: string
  post?: any
}) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [type, setType] = useState(post?.type ?? '')
  const [title, setTitle] = useState(post?.title ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [externalUrl, setExternalUrl] = useState(post?.external_url ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(post?.youtube_url ?? '')
  const [imgUrl, setImgUrl] = useState(post?.img_url ?? '')
  const [authorId, setAuthorId] = useState(post?.author_id ?? '')
  const [customAuthor, setCustomAuthor] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const editorRef = useRef<any>(null)

  function clearError(key: string) {
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  async function uploadFeaturedImage(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `posts/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('post-images').upload(path, file)
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
    return publicUrl
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    const url = await uploadFeaturedImage(file)
    if (url) { setImgUrl(url); clearError('img_url') }
    setUploadingImage(false)
    e.target.value = ''
  }

  async function handleSave(status: 'draft' | 'published') {
    setSaving(true)
    setErrors({})

    let content_json = null
    let content_html = null

    if (type === 'blog' && editorRef.current) {
      try {
        content_json = editorRef.current.getJSON?.() ?? null
        content_html = editorRef.current.getHTML?.() ?? null
      } catch {}
    }

    const data: PostFormData = {
      id: post?.id,
      title,
      type,
      excerpt,
      external_url: externalUrl,
      youtube_url: youtubeUrl,
      img_url: imgUrl,
      author_id: authorId === 'other' ? null : authorId,
      content_json,
      content_html,
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

  const fieldClass = (name: string) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errors[name] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-gray-900'
    }`
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? <p className="text-xs text-red-600 mt-1">{errors[name]}</p> : null

  if (!type) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {POST_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className="text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 hover:shadow-sm transition-all">
            <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
            <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>
    )
  }

  const typeLabel = POST_TYPES.find(t => t.value === type)?.label ?? type

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Type:</span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">{typeLabel}</span>
        {!post && (
          <button onClick={() => setType('')} className="text-xs text-gray-400 hover:text-gray-700 underline">Change</button>
        )}
      </div>

      {errors._ && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{errors._}</div>
      )}

      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Post Details</h2>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input value={title} onChange={e => { setTitle(e.target.value); if (e.target.value) clearError('title') }}
            className={fieldClass('title')} placeholder="Post title" />
          <FieldError name="title" />
        </div>

        {['news', 'linkedin', 'podcast'].includes(type) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Excerpt <span className="text-gray-400">(required to publish)</span>
            </label>
            <textarea value={excerpt} onChange={e => { setExcerpt(e.target.value); if (e.target.value) clearError('excerpt') }}
              rows={3} className={fieldClass('excerpt')} placeholder="Short summary..." />
            <FieldError name="excerpt" />
          </div>
        )}

        {['news', 'linkedin'].includes(type) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              URL <span className="text-gray-400">(required to publish)</span>
            </label>
            <input value={externalUrl} onChange={e => { setExternalUrl(e.target.value); if (e.target.value) clearError('external_url') }}
              className={fieldClass('external_url')} placeholder="https://..." />
            <FieldError name="external_url" />
          </div>
        )}

        {type === 'podcast' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Podcast / Video URL <span className="text-gray-400">(required to publish)</span>
            </label>
            <input value={youtubeUrl} onChange={e => { setYoutubeUrl(e.target.value); if (e.target.value) clearError('youtube_url') }}
              className={fieldClass('youtube_url')} placeholder="https://youtube.com, spotify.com, buzzsprout.com..." />
            <FieldError name="youtube_url" />
          </div>
        )}

        {/* Author */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
          <select value={authorId} onChange={e => { setAuthorId(e.target.value); setCustomAuthor('') }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Select author...</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="other">Other (guest / external)</option>
          </select>
          {authorId === 'other' && (
            <input
              value={customAuthor}
              onChange={e => setCustomAuthor(e.target.value)}
              placeholder="Enter author name..."
              className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          )}
        </div>

        {/* Featured image */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Featured Image <span className="text-gray-400">(required to publish)</span>
          </label>
          {imgUrl ? (
            <div className="relative">
              <img src={imgUrl} alt="Featured" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => setImgUrl('')} type="button"
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80">
                Remove
              </button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-gray-400 transition-colors ${errors.img_url ? 'border-red-400' : 'border-gray-300'}`}>
              {uploadingImage ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <ImagePlus className="w-5 h-5 text-gray-400" />}
              <span className="text-sm text-gray-500">{uploadingImage ? 'Uploading...' : 'Click to upload featured image'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
            </label>
          )}
          <FieldError name="img_url" />
        </div>
      </section>

      {type === 'blog' && (
        <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Content <span className="text-gray-400 font-normal">(required to publish)</span>
          </h2>
          {errors.content && <p className="text-xs text-red-600">⚠ {errors.content}</p>}
          <div className="min-h-[300px] border border-gray-200 rounded-lg overflow-hidden">
            <BlogEditor ref={editorRef} initialContent={post?.content_json} />
          </div>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button onClick={() => handleSave('draft')} disabled={saving} variant="outline" className="flex-1 sm:flex-none">
          {saving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button onClick={() => handleSave('published')} disabled={saving} className="flex-1 sm:flex-none">
          {saving ? 'Publishing...' : 'Publish'}
        </Button>
        <button onClick={() => window.history.back()} type="button"
          className="text-sm text-gray-500 hover:text-gray-900 sm:ml-auto">
          Cancel
        </button>
      </div>
    </div>
  )
}

const BlogEditor = forwardRef(function BlogEditor(
  { initialContent }: { initialContent?: any },
  ref: any,
) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[250px] px-4 py-3',
      },
    },
  })

  useImperativeHandle(ref, () => ({
    getJSON: () => editor?.getJSON() ?? null,
    getHTML: () => editor?.getHTML() ?? null,
  }))

  if (!mounted) return <div className="h-[250px] bg-gray-50 rounded border border-gray-200 animate-pulse" />

  return <EditorContent editor={editor} />
})
