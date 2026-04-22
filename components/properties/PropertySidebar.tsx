import { AgentCard } from './AgentCard'
import type { Property } from '@/lib/types/property-portal'

export function PropertySidebar({ property }: { property: Property }) {
  return (
    <div className="h-full border border-neutral-200 bg-white flex flex-col">
      <div className="px-6 pt-6">
        <h3 className="text-xs uppercase tracking-wide text-neutral-500">
          Contacts
        </h3>
      </div>
      <div className="px-6">
        {property.agents.length === 0 ? (
          <p className="text-sm text-neutral-400 py-5">No agents assigned</p>
        ) : (
          property.agents.map((agent) => (
            <AgentCard key={agent.team_member_id} agent={agent} />
          ))
        )}
      </div>
      <div className="px-6 pb-6 pt-4 mt-auto">
        <span className="block w-full bg-neutral-900 text-white text-center py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
          Contact For Details
        </span>
      </div>
    </div>
  )
}
