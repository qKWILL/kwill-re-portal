import { redirect, notFound } from 'next/navigation'
import PostEditor from '@/components/post-editor'
import { getPortalSession } from '@/lib/auth'
import { getPostById, getTeamMembersList } from '@/lib/cached-data'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ user, isAdmin }, post, teamMembers] = await Promise.all([
    getPortalSession(),
    getPostById(id),
    getTeamMembersList(),
  ])

  if (!post) notFound()
  if (!isAdmin && post.created_by !== user.id) redirect('/posts')

  return (
    <PostEditor
      teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))}
      post={post}
    />
  )
}
