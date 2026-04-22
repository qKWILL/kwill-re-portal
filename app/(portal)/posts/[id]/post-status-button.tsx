'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { updatePostStatus } from './post-status-action'
import { Button } from '@/components/ui/button'
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

type Transition = { label: string; next: string }

const TRANSITIONS: Record<string, Transition[]> = {
  draft: [{ label: 'Publish', next: 'published' }],
  published: [{ label: 'Unpublish', next: 'draft' }],
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
  published: 'bg-green-100 text-green-700 hover:bg-green-200',
}

export default function PostStatusButton({
  postId,
  currentStatus,
  canChangeStatus = true,
}: {
  postId: string
  currentStatus: string
  canChangeStatus?: boolean
}) {
  const [pending, setPending] = useState<Transition | null>(null)
  const [loading, setLoading] = useState(false)

  const label = STATUS_LABEL[currentStatus] ?? currentStatus
  const styles =
    STATUS_STYLES[currentStatus] ??
    'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
  const transitions = TRANSITIONS[currentStatus] ?? []
  const hasTransitions = canChangeStatus && transitions.length > 0

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    await updatePostStatus(postId, pending.next as 'draft' | 'published')
    setLoading(false)
    setPending(null)
  }

  if (!hasTransitions) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${styles} cursor-default`}
      >
        {label}
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${styles}`}
          >
            {label}
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          {transitions.map((t) => (
            <DropdownMenuItem key={t.next} onSelect={() => setPending(t)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open && !loading) setPending(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              {pending?.label}?
            </DialogTitle>
            <DialogDescription>
              Change status from{' '}
              <span className="font-medium text-neutral-900">{label}</span> to{' '}
              <span className="font-medium text-neutral-900">
                {pending ? (STATUS_LABEL[pending.next] ?? pending.next) : ''}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
