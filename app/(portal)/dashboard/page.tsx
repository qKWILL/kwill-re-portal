import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getRecentActiveProperties, getRecentPublishedPosts } from '@/lib/cached-data'

type PropertyMediaRow = {
  url: string
  display_order: number
  media_type: string | null
}

function formatInboxDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(
    [],
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  const role = roleRow?.role ?? 'editor'
  const isAdmin = role === 'admin'

  const { data: meMember } = await supabase
    .from('team_members')
    .select('name')
    .eq('user_id', user.id)
    .maybeSingle()
  const firstName = meMember?.name?.split(' ')[0]

  const [
    submissionsRes,
    myPropertyDraftsRes,
    myPostDraftsRes,
    recentPropertiesData,
    recentPostsData,
  ] = await Promise.all([
    isAdmin
      ? supabase
          .from('form_submissions')
          .select('id, first_name, email, message, division, created_at')
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from('properties')
      .select('id, title, status, updated_at')
      .eq('created_by', user.id)
      .neq('status', 'active')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts')
      .select('id, title, type, updated_at')
      .eq('created_by', user.id)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5),
    getRecentActiveProperties(3),
    getRecentPublishedPosts(3),
  ])

  const submissions = submissionsRes.data ?? []
  const propertyDrafts = myPropertyDraftsRes.data ?? []
  const postDrafts = myPostDraftsRes.data ?? []
  const drafts = [
    ...propertyDrafts.map((p) => ({
      id: p.id,
      title: p.title || 'Untitled property',
      href: `/properties/${p.id}`,
      kind: 'Property',
      meta: p.status,
      updated_at: p.updated_at,
    })),
    ...postDrafts.map((p) => ({
      id: p.id,
      title: p.title || 'Untitled post',
      href: `/posts/${p.id}`,
      kind: 'Post',
      meta: p.type || 'post',
      updated_at: p.updated_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 5)

  const recentProperties = recentPropertiesData.map((row) => {
    const hero = (row.property_media ?? [])
      .filter(
        (m: PropertyMediaRow) =>
          m.media_type !== 'brochure' &&
          m.media_type !== 'floor_plan' &&
          m.media_type !== 'site_plan',
      )
      .sort(
        (a: PropertyMediaRow, b: PropertyMediaRow) =>
          a.display_order - b.display_order,
      )[0]?.url
    return {
      id: row.id,
      title: row.title ?? 'Untitled',
      subtitle: [row.city, row.state].filter(Boolean).join(', '),
      image: hero ?? null,
    }
  })

  const recentPosts = recentPostsData.map((row) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    subtitle: row.type ?? 'post',
    image: row.img_url ?? null,
  }))

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <h1 className="text-neutral-900 text-[clamp(2.2rem,0.15rem+8vw,3.125rem)] leading-[1.1] tracking-[-0.01em] font-serif font-normal">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Signed in as {user.email} · <span className="capitalize">{role}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Property
          </Link>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Inbox + Drafts */}
      <div
        className={`grid gap-6 mb-8 ${
          isAdmin ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {isAdmin && (
          <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900">Inbox</h2>
              <Link
                href="/submissions"
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {submissions.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-neutral-400">No new inquiries.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {submissions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href="/submissions"
                      className="flex items-baseline gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-semibold text-sm text-neutral-900 w-28 shrink-0 truncate">
                        {s.first_name}
                      </span>
                      <span className="flex-1 min-w-0 text-sm text-neutral-700 truncate">
                        <span className="text-neutral-900">
                          {s.division ? `${s.division} inquiry` : 'New inquiry'}
                        </span>
                        <span className="text-neutral-400"> — {s.message}</span>
                      </span>
                      <span className="text-xs text-neutral-400 shrink-0 tabular-nums">
                        {formatInboxDate(s.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">My drafts</h2>
            <Link
              href="/properties?status=draft"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {drafts.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-neutral-400">
                All caught up. Nothing in progress.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {drafts.map((d) => (
                <li key={`${d.kind}-${d.id}`}>
                  <Link
                    href={d.href}
                    className="flex items-baseline gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 w-16 shrink-0">
                      {d.kind}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-neutral-900 truncate">
                      {d.title}
                    </span>
                    <span className="text-xs text-neutral-400 shrink-0 capitalize">
                      {d.meta}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recently on the site */}
      {(recentProperties.length > 0 || recentPosts.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {recentProperties.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Recently listed
                </h2>
                <Link
                  href="/properties?status=active"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
                >
                  All listings
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="space-y-2">
                {recentProperties.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/properties/${p.id}`}
                      className="flex items-center gap-4 bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 transition-colors"
                    >
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {p.title}
                        </p>
                        {p.subtitle && (
                          <p className="text-xs text-neutral-500 truncate">
                            {p.subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentPosts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Recently published
                </h2>
                <Link
                  href="/posts?status=published"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
                >
                  All posts
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="space-y-2">
                {recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/posts/${p.id}`}
                      className="flex items-center gap-4 bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 transition-colors"
                    >
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {p.title}
                        </p>
                        {p.subtitle && (
                          <p className="text-xs text-neutral-500 truncate capitalize">
                            {p.subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
