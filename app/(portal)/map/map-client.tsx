'use client'

import { useState } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600',
  active:  'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold:    'bg-blue-100 text-blue-700',
  leased:  'bg-purple-100 text-purple-700',
}

type Property = {
  id: string
  title: string
  status: string
  featured_image_url: string | null
  content: any
  address: string | null
  city: string | null
  state: string | null
  lat: number
  lng: number
  property_agents: any[]
}

export default function MapClient({
  properties,
  apiKey,
}: {
  properties: Property[]
  apiKey: string
}) {
  const [selected, setSelected] = useState<Property | null>(null)

  const center = properties.length > 0
    ? { lat: properties[0].lat, lng: properties[0].lng }
    : { lat: 41.8781, lng: -87.6298 } // Chicago default

  return (
    <APIProvider apiKey={apiKey}>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '600px' }}>
        <Map
          defaultCenter={center}
          defaultZoom={11}
          mapId="kwill-portal-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {properties.map(p => (
            <AdvancedMarker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => setSelected(p)}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="p-1 min-w-[200px]">
                {selected.featured_image_url && (
                  <img src={selected.featured_image_url} alt={selected.title}
                    className="w-full h-28 object-cover rounded mb-2" />
                )}
                <p className="font-semibold text-gray-900 text-sm">{selected.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[selected.address, selected.city, selected.state].filter(Boolean).join(', ')}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selected.status}
                  </span>
                  {selected.content?.property_type && (
                    <span className="text-xs text-gray-400 capitalize">{selected.content.property_type}</span>
                  )}
                </div>
                <Link href={`/properties/${selected.id}/edit`}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mt-2">
                  <Pencil className="w-3 h-3" /> Edit listing
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {!properties.length && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No properties with coordinates yet.</p>
          <p className="text-xs text-gray-400 mt-1">Save a property with an address to see it on the map.</p>
        </div>
      )}
    </APIProvider>
  )
}
