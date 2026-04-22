import Image from 'next/image'
import { Mail, Link as LinkIcon } from 'lucide-react'

export type PortalTeamMember = {
  id: string
  name: string
  role: string
  img_url: string | null
  linkedin: string | null
}

export function TeamMemberHeader({ member }: { member: PortalTeamMember }) {
  return (
    <div className="relative w-full bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col lg:flex-row items-center gap-12 md:gap-20">
        <div className="w-full md:w-2/5">
          <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
            {member.img_url ? (
              <Image
                src={member.img_url}
                alt={member.name}
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
                No headshot
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-3/5 space-y-3 flex flex-col justify-center">
          <h1 className="text-h3 md:text-[clamp(2.4rem,0.2rem+8vw,4.125rem)] leading-[1] tracking-[-0.015em] font-serif font-normal text-neutral-900">
            {member.name || 'Unnamed'}
          </h1>
          <p className="text-md pl-1 text-neutral-500">{member.role || ''}</p>
          <div className="flex gap-6 pt-8">
            <span className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-black">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-neutral-600">Contact</span>
            </span>
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group"
              >
                <div className="p-2 rounded-full bg-black">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-neutral-600 group-hover:underline">
                  LinkedIn
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
