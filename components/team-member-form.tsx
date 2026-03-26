'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveTeamMember, type TeamMemberFormData } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ImagePlus } from 'lucide-react'

export default function TeamMemberForm({ member }: { member: any }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false)

  const [name, setName] = useState(member.name ?? '')
  const [role, setRole] = useState(member.role ?? '')
  const [bio, setBio] = useState(member.bio ?? '')
  const [experience, setExperience] = useState(member.experience ?? '')
  const [linkedin, setLinkedin] = useState(member.linkedin ?? '')
  const [imgUrl, setImgUrl] = useState(member.img_url ?? '')
  const [tags, setTags] = useState<string[]>(member.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  async function uploadHeadshot(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${member.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('team-headshots').upload(path, file, { upsert: true })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('team-headshots').getPublicUrl(path)
    return publicUrl
  }

  async function handleHeadshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHeadshot(true)
    const url = await uploadHeadshot(file)
    if (url) setImgUrl(url)
    setUploadingHeadshot(false)
    e.target.value = ''
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const data: TeamMemberFormData = {
      id: member.id,
      name, role, bio, experience, linkedin, tags, img_url: imgUrl,
    }

    const result = await saveTeamMember(data)
    setSaving(false)

    if (!result.success) setError(result.error)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {/* Headshot */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Headshot</h2>
        <div className="flex items-center gap-4">
          {imgUrl ? (
            <img src={imgUrl} alt={name} className="w-20 h-20 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium">
              {name?.charAt(0)}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            {uploadingHeadshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploadingHeadshot ? 'Uploading...' : 'Upload new headshot'}
            <input type="file" accept="image/*" onChange={handleHeadshotUpload} disabled={uploadingHeadshot} className="hidden" />
          </label>
        </div>
      </section>

      {/* Basic info */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic Info</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title / Role</label>
          <input value={role} onChange={e => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </section>

      {/* Bio & Experience */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Bio & Experience</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Experience</label>
          <textarea value={experience} onChange={e => setExperience(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </section>

      {/* Tags */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Expertise Tags</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              {tag}
              <button onClick={() => removeTag(tag)} type="button" className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-400">Press Enter to add a tag</p>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
        <button onClick={() => window.location.href = '/team'} type="button"
          className="text-sm text-gray-500 hover:text-gray-900">
          Cancel
        </button>
      </div>
    </div>
  )
}
