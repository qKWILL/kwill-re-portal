import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, FileText, Users, Clock, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleRow?.role ?? 'editor'

  const [
    { count: totalProperties },
    { count: activeProperties },
    { count: totalPosts },
    { count: publishedPosts },
    { count: teamCount },
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
    supabase.from('posts').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published').is('deleted_at', null),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
  ])

  const { data: myDrafts } = await supabase
    .from('properties')
    .select('id, title, status, updated_at')
    .eq('created_by', user.id)
    .neq('status', 'active')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  const { data: myPostDrafts } = await supabase
    .from('posts')
    .select('id, title, status, type, updated_at')
    .eq('created_by', user.id)
    .eq('status', 'draft')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  const activityQuery = role === 'admin'
    ? supabase.from('audit_log').select('id, table_name, action, created_at').order('created_at', { ascending: false }).limit(10)
    : supabase.from('audit_log').select('id, table_name, action, created_at').eq('performed_by', user.id).order('created_at', { ascending: false }).limit(10)

  const { data: activity } = await activityQuery

  const totalDrafts = (myDrafts?.length ?? 0) + (myPostDrafts?.length ?? 0)

  const summaryCards = [
    { label: 'Total Properties', value: totalProperties ?? 0, sub: `${activeProperties ?? 0} active`, icon: Building2 },
    { label: 'Total Posts', value: totalPosts ?? 0, sub: `${publishedPosts ?? 0} published`, icon: FileText },
    { label: 'Team Members', value: teamCount ?? 0, sub: 'in directory', icon: Users },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back, {user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/properties/new"
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            <Plus className="w-4 h-4" /> New Property
          </Link>
          <Link href="/posts/new"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4">
            <div className="bg-gray-100 rounded-md p-2">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Draft Queue */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">My Drafts</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          {totalDrafts === 0 ? (
            <p className="text-sm text-gray-400">No drafts — you're all caught up.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {myDrafts?.map(d => (
                  <li key={d.id}>
                    <Link href={`/properties/${d.id}`}
                      className="flex items-center justify-between text-sm hover:bg-gray-50 rounded px-1 py-0.5 -mx-1">
                      <span className="text-gray-700 truncate">{d.title || 'Untitled property'}</span>
                      <span className="text-xs text-gray-400 capitalize ml-2 shrink-0">{d.status}</span>
                    </Link>
                  </li>
                ))}
                {myPostDrafts?.map(d => (
                  <li key={d.id}>
                    <Link href={`/posts/${d.id}`}
                      className="flex items-center justify-between text-sm hover:bg-gray-50 rounded px-1 py-0.5 -mx-1">
                      <span className="text-gray-700 truncate">{d.title || 'Untitled post'}</span>
                      <span className="text-xs text-gray-400 capitalize ml-2 shrink-0">{d.type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {totalDrafts >= 5 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
                  <Link href="/properties?status=draft" className="text-xs text-gray-500 hover:text-gray-900 underline">
                    View all property drafts
                  </Link>
                  <Link href="/posts?status=draft" className="text-xs text-gray-500 hover:text-gray-900 underline">
                    View all post drafts
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {role === 'admin' ? 'Recent Activity' : 'My Activity'}
          </h2>
          {!activity?.length ? (
            <p className="text-sm text-gray-400">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map(a => (
                <li key={a.id} className="text-sm text-gray-600">
                  <span className="capitalize font-medium">{a.action}</span>
                  {' on '}
                  <span className="text-gray-800">{a.table_name.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
