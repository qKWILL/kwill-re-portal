/**
 * ONE-TIME MIGRATION: news_posts → posts
 *
 * PRD §9 — Legacy Data & Schema Proposals
 *
 * DO NOT RUN until:
 *   1. Portal is live and posts schema is finalised
 *   2. Franklin Eruo's team_members.id is confirmed (see FRANKLIN_ID below)
 *   3. You have taken a manual backup of the database
 *
 * Run with:
 *   npx tsx scripts/migrate-news-posts.ts
 *
 * After verifying results in Supabase, update the marketing site to read
 * from `posts`. Keep `news_posts` as a read-only archive — do NOT drop it.
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config — fill these in before running
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // needs write access; never expose publicly

/**
 * Look up Franklin Eruo's id in the team_members table and paste it here.
 * There is no slug column to match programmatically, so this must be set
 * manually before running the script.
 *
 * SQL to find it:
 *   SELECT id, name FROM team_members WHERE name ILIKE '%franklin%';
 */
const FRANKLIN_ID: string | null = null // e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsPost = {
  id: string
  title: string | null
  excerpt: string | null
  img_url: string | null
  type: string | null
  date: string | null
  link: string | null
  youtubeUrl: string | null
  author: string | null       // raw author name from legacy table
  content: string | null      // plain-text body (blog posts only)
  created_at: string | null
  updated_at: string | null
}

type TiptapDoc = {
  type: 'doc'
  content: TiptapNode[]
}

type TiptapNode = {
  type: string
  content?: TiptapTextNode[]
}

type TiptapTextNode = {
  type: 'text'
  text: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wraps plain text in a minimal Tiptap document.
 * Each newline-separated paragraph becomes its own paragraph node.
 * Returns null if the text is blank.
 */
function plaintextToTiptapDoc(text: string): TiptapDoc | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const paragraphs = trimmed
    .split(/\n+/)
    .map((line): TiptapNode => ({
      type: 'paragraph',
      content: line.trim() ? [{ type: 'text', text: line.trim() }] : [],
    }))

  return { type: 'doc', content: paragraphs }
}

/**
 * Derives a minimal HTML string from a Tiptap doc.
 * Keeps the script dependency-free (no @tiptap/html needed at runtime).
 */
function tiptapDocToHtml(doc: TiptapDoc): string {
  return doc.content
    .map((node) => {
      if (node.type !== 'paragraph') return ''
      const inner = (node.content ?? []).map((t) => escapeHtml(t.text)).join('')
      return inner ? `<p>${inner}</p>` : '<p></p>'
    })
    .join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base ? `${base}-${id.slice(0, 8)}` : `post-${id.slice(0, 8)}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.'
    )
  }

  if (FRANKLIN_ID === null) {
    throw new Error(
      'FRANKLIN_ID is not set. Look up Franklin Eruo\'s id in team_members and set it at the top of this script.'
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Read all rows from the legacy table
  const { data: rows, error: fetchError } = await supabase
    .from('news_posts')
    .select('*')
    .order('created_at', { ascending: true })

  if (fetchError) throw fetchError
  if (!rows || rows.length === 0) {
    console.log('No rows found in news_posts — nothing to migrate.')
    return
  }

  console.log(`Found ${rows.length} rows in news_posts. Starting migration...\n`)

  let inserted = 0
  let skipped = 0

  for (const row of rows as NewsPost[]) {
    // Resolve author_id
    // Only Franklin Eruo had an author value; all others are null.
    let authorId: string | null = null
    if (row.author && row.author.toLowerCase().includes('franklin')) {
      authorId = FRANKLIN_ID
    }

    // Build content fields for blog posts that have plain-text body
    let contentJson: TiptapDoc | null = null
    let contentHtml: string | null = null
    if (row.type === 'blog' && row.content) {
      contentJson = plaintextToTiptapDoc(row.content)
      if (contentJson) {
        contentHtml = tiptapDocToHtml(contentJson)
      }
    }

    const payload = {
      title:        row.title ?? 'Untitled',
      excerpt:      row.excerpt ?? null,
      img_url:      row.img_url ?? null,
      type:         row.type ?? 'news',
      date:         row.date ?? null,
      external_url: row.link ?? null,
      youtube_url:  row.youtubeUrl ?? null,
      author_id:    authorId,
      content_html: contentHtml ?? null,
      status:       'published' as const,   // all legacy posts were live
      slug:         generateSlug(row.title ?? '', row.id),
      created_at:   row.created_at ?? undefined,
      updated_at:   row.updated_at ?? undefined,
      // created_by is intentionally omitted — no user account maps to the
      // legacy import; leave null to signal a migrated record.
    }

    const { error: insertError } = await supabase.from('posts').insert(payload)

    if (insertError) {
      console.error(`  ✗ SKIPPED  [${row.id}] "${row.title}" — ${insertError.message}`)
      skipped++
    } else {
      console.log(`  ✓ migrated [${row.id}] "${row.title}"${authorId ? ' (author: Franklin)' : ''}`)
      inserted++
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`)
  if (skipped > 0) {
    console.warn('Review skipped rows above before marking migration complete.')
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
