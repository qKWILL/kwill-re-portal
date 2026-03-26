import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil } from 'lucide-react'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const isAdmin = roleRow?.role === 'admin'

  // Admins see all, editors see only their own profile
  let query = supabase
    .from('team_members')
    .select('id, name, role, img_url, tags, user_id')
    .order('name')

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { data: members } = await query

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? `${members?.length ?? 0} members` : 'Your profile'}
        </p>
      </div>

      {!members?.length ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">No profile linked to your account yet.</p>
          <p className="text-xs text-gray-400 mt-1">Contact an admin to link your portal account to a team member profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4">
              <div className="shrink-0">
                {member.img_url ? (
                  <img src={member.img_url} alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                    {member.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{member.role}</p>
                {member.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/team/${member.id}/edit`}
                className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Pencil className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
