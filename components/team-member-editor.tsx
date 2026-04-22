'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link as LinkIcon, Mail, X } from 'lucide-react'
import {
  saveTeamMember,
  createTeamMember,
  type TeamMemberFormData,
  type TeamMemberCreateData,
} from '@/lib/actions/team'
import { EditableText } from '@/components/properties/editable/EditableText'
import { EditableRichText } from '@/components/properties/editable/EditableRichText'
import { EditableExperience } from '@/components/team/editable/EditableExperience'
import { EditableHeadshot } from '@/components/team/EditableHeadshot'
import { bioToDraft, draftToBio } from '@/lib/utils/team-bio'
import type { ExperienceEntry } from '@/lib/utils/team-experience'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InitialMember = {
  id: string
  name: string | null
  role: string | null
  bio: string | null
  linkedin: string | null
  tags: string[] | null
  img_url: string | null
  team_experience?: ExperienceEntry[]
}

export default function TeamMemberEditor({
  member,
}: {
  member: InitialMember | null
}) {
  const isCreating = !member?.id
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState(member?.role ?? '')
  const [bioDraft, setBioDraft] = useState(() => bioToDraft(member?.bio))
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    member?.team_experience ?? [],
  )
  const [linkedin, setLinkedin] = useState(member?.linkedin ?? '')
  const [imgUrl, setImgUrl] = useState(member?.img_url ?? '')
  const [tags, setTags] = useState<string[]>(member?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false)
  const [linkedinDraft, setLinkedinDraft] = useState('')

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const v = tagInput.trim()
      if (!tags.includes(v)) setTags([...tags, v])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    if (isCreating) {
      const createData: TeamMemberCreateData = {
        name,
        role,
        bio: draftToBio(bioDraft),
        experience,
        linkedin,
        tags,
        img_url: imgUrl,
      }
      const result = await createTeamMember(createData)
      setSaving(false)
      if (!result.success) {
        setError(result.error)
        return
      }
      window.location.href = `/team/${result.id}/edit`
      return
    }

    const data: TeamMemberFormData = {
      id: member!.id,
      name,
      role,
      bio: draftToBio(bioDraft),
      experience,
      linkedin,
      tags,
      img_url: imgUrl,
    }
    const result = await saveTeamMember(data)
    setSaving(false)
    if (!result.success) setError(result.error)
  }

  return (
    <main className="pb-16 bg-white">
      {/* Sticky admin bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {isCreating ? 'New member' : 'Editing profile'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-neutral-500 hover:text-neutral-900 px-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {error ? (
          <div className="max-w-[1200px] mx-auto px-6 pb-3">
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          </div>
        ) : null}
      </div>

      {/* Header band */}
      <div className="relative w-full bg-neutral-50">
        <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col lg:flex-row items-center gap-12 md:gap-20">
          <div className="w-full md:w-2/5">
            <EditableHeadshot
              value={imgUrl}
              onChange={setImgUrl}
              bucket="team-headshots"
              folder={member?.id ?? 'unassigned'}
              placeholderLabel="Upload headshot"
              alt={name}
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </div>
          <div className="w-full md:w-3/5 space-y-3 flex flex-col justify-center">
            <EditableText
              as="h1"
              value={name}
              onChange={setName}
              placeholder="Name"
              className="text-h3 md:text-[clamp(2.4rem,0.2rem+8vw,4.125rem)] leading-[1] tracking-[-0.015em] font-serif font-normal text-neutral-900 block"
              ariaLabel="Name"
            />
            <EditableText
              value={role}
              onChange={setRole}
              placeholder="Title / Role"
              className="text-md pl-1 text-neutral-500 block"
              ariaLabel="Role"
            />
            <div className="flex gap-6 pt-8">
              <span className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-black">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-neutral-600">Contact</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLinkedinDraft(linkedin)
                  setLinkedinModalOpen(true)
                }}
                className="flex items-center gap-2 group"
              >
                <div className="p-2 rounded-full bg-black">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-neutral-600 group-hover:underline">
                  {linkedin ? 'LinkedIn' : 'Add LinkedIn'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bio / experience / tags */}
      <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-10">
        <section className="border-t border-neutral-200 pt-10">
          <h2 className="text-xs uppercase tracking-wider text-neutral-800 font-medium mb-4">
            About
          </h2>
          <EditableRichText
            value={bioDraft}
            onChange={setBioDraft}
            placeholder="Write a short bio. Leave a blank line between paragraphs."
            rows={6}
            className="text-neutral-700 font-light leading-relaxed max-w-3xl"
            ariaLabel="Bio"
          />
        </section>

        <section className="border-t border-neutral-200 pt-10">
          <h2 className="text-xs uppercase tracking-wider text-neutral-800 font-medium mb-4">
            Experience
          </h2>
          <EditableExperience value={experience} onChange={setExperience} />
        </section>

        <section className="border-t border-neutral-200 pt-10">
          <h2 className="text-xs uppercase tracking-wider text-neutral-800 font-medium mb-4">
            Team
          </h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs capitalize"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-neutral-400 hover:text-red-500 ml-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Type a tag and press Enter…"
            className="w-full sm:w-80 border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </section>
      </div>

      <Dialog open={linkedinModalOpen} onOpenChange={setLinkedinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-medium">
              LinkedIn URL
            </DialogTitle>
            <DialogDescription>
              The full URL to this person&apos;s LinkedIn profile.
            </DialogDescription>
          </DialogHeader>
          <input
            type="url"
            value={linkedinDraft}
            onChange={(e) => setLinkedinDraft(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            autoFocus
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setLinkedinModalOpen(false)}
              className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkedin(linkedinDraft.trim())
                setLinkedinModalOpen(false)
              }}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
