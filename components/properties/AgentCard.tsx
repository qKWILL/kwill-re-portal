import Image from 'next/image'
import type { PropertyAgent } from '@/lib/types/property-portal'

export function AgentCard({ agent }: { agent: PropertyAgent }) {
  const { team_member } = agent
  const img = team_member.img_url

  return (
    <div className="flex items-center gap-4 py-5 border-b border-neutral-200 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="w-20 h-20 relative overflow-hidden">
          {img ? (
            <Image
              src={img}
              alt={team_member.name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
              No photo
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-lg text-neutral-900">
          {team_member.name}
        </span>
      </div>
    </div>
  )
}
