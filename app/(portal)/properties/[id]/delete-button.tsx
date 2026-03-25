'use client'

import { useState } from 'react'
import { deleteProperty } from './actions'
import { Trash2 } from 'lucide-react'

export default function DeleteButton({ propertyId, status, isOwner, isAdmin }: {
  propertyId: string
  status: string
  isOwner: boolean
  isAdmin: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Editors can only delete their own drafts
  const canDelete = isAdmin || (isOwner && status === 'draft')
  if (!canDelete) return null

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Are you sure?</span>
        <button
          onClick={async () => {
            setDeleting(true)
            await deleteProperty(propertyId)
          }}
          disabled={deleting}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  )
}
