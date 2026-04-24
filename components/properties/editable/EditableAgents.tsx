'use client'

import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { AgentCard } from '@/components/properties/AgentCard'
import type { PropertyAgent } from '@/lib/types/property-portal'

type TeamMember = {
  id: string
  name: string
  role: string
  img_url?: string | null
  slug?: string | null
}

type AgentAssignment = { team_member_id: string; role: string }

type Props = {
  assignments: AgentAssignment[]
  onChange: (next: AgentAssignment[]) => void
  teamMembers: TeamMember[]
  error?: boolean
}

export function EditableAgents({
  assignments,
  onChange,
  teamMembers,
  error,
}: Props) {
  const [editing, setEditing] = useState(false)

  const byId = new Map(teamMembers.map((m) => [m.id, m]))

  function update(i: number, key: keyof AgentAssignment, v: string) {
    const next = [...assignments]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  function add() {
    onChange([...assignments, { team_member_id: '', role: 'listing_agent' }])
  }
  function remove(i: number) {
    onChange(assignments.filter((_, idx) => idx !== i))
  }

  if (!editing) {
    const rendered: PropertyAgent[] = assignments
      .filter((a) => a.team_member_id && byId.has(a.team_member_id))
      .map((a) => {
        const m = byId.get(a.team_member_id)!
        return {
          team_member_id: a.team_member_id,
          role: a.role,
          team_member: {
            id: m.id,
            name: m.name,
            role: m.role,
            img_url: m.img_url ?? null,
            slug: m.slug ?? null,
          },
        }
      })

    return (
      <div className={error ? 'ring-1 ring-red-400 rounded' : ''}>
        {rendered.length === 0 ? (
          <p className="text-sm text-neutral-400 py-5">No agents assigned</p>
        ) : (
          rendered.map((agent) => (
            <AgentCard key={agent.team_member_id} agent={agent} />
          ))
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 underline"
        >
          <UserPlus className="w-3.5 h-3.5" /> Edit agents
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-2 w-full min-w-0">
      {assignments.map((a, i) => (
        <div
          key={i}
          className="relative rounded-md border border-neutral-200 p-2 pr-8 space-y-2"
        >
          <select
            value={a.team_member_id}
            onChange={(e) => update(i, 'team_member_id', e.target.value)}
            className="w-full min-w-0 border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <option value="">Select agent…</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={a.role}
            onChange={(e) => update(i, 'role', e.target.value)}
            className="w-full min-w-0 border border-neutral-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <option value="listing_agent">Listing Agent</option>
            <option value="co-listing_agent">Co-Listing Agent</option>
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
            aria-label={`Remove agent ${i + 1}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={add}
          className="text-xs text-neutral-500 hover:text-neutral-900 underline"
        >
          + Add agent
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-neutral-700 hover:text-neutral-900"
        >
          Done
        </button>
      </div>
    </div>
  )
}
