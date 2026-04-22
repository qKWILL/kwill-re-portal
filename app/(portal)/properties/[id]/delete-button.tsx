'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProperty } from './actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function DeleteButton({
  propertyId,
  status,
  isOwner,
  isAdmin,
}: {
  propertyId: string
  status: string
  isOwner: boolean
  isAdmin: boolean
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = isAdmin || (isOwner && status === 'draft')
  if (!canDelete) return null

  async function handleConfirm() {
    setDeleting(true)
    await deleteProperty(propertyId)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!deleting) setOpen(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              Delete property?
            </DialogTitle>
            <DialogDescription>
              This will move the property to the trash. You won&apos;t be able
              to restore it from the portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
