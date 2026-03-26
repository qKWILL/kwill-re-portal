'use client'

import { useState } from 'react'
import { updatePostStatus } from './post-status-action'

export default function PostStatusButton({
  postId,
  currentStatus,
}: {
  postId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)

  const isPublished = currentStatus === 'published'

  async function handleClick() {
    setLoading(true)
    await updatePostStatus(postId, isPublished ? 'draft' : 'published')
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
        isPublished
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      {loading ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
    </button>
  )
}
