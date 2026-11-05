import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

type RevalidatePayload = {
  event: 'publish' | 'unpublish' | 'create' | 'update' | 'delete' | 'media' | 'status_change'
  table: 'properties' | 'posts' | 'team_members'
  record_id: string
  slug?: string | null
  old_slug?: string | null
  path: string
  timestamp: string
}

// Tells the marketing site to drop its cached copy of this content. Failures
// are logged, never thrown: the CMS save has already succeeded, and a missed
// webhook only leaves the site stale until its cache expires.
export async function fireMarketingRevalidation(
  payload: Omit<RevalidatePayload, 'timestamp'>,
): Promise<void> {
  try {
    await sendRevalidation(payload)
  } catch (err) {
    console.error(`Marketing revalidation failed for ${payload.table} ${payload.record_id}:`, err)
  }
}

async function sendRevalidation(payload: Omit<RevalidatePayload, 'timestamp'>): Promise<void> {
  // app_config holds the webhook secret, so it is read with the service-role
  // client, never the editor's session.
  const { data: config, error: configError } = await createAdminClient()
    .from('app_config')
    .select('key, value')
    .in('key', ['revalidation_url', 'webhook_secret', 'vercel_protection_bypass'])
  if (configError) {
    console.error('Marketing revalidation skipped: app_config read failed:', configError)
    return
  }

  const configMap = Object.fromEntries((config ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
  if (!configMap.revalidation_url || !configMap.webhook_secret) return
  const bypass = configMap.vercel_protection_bypass

  // Support multiple URLs (comma/newline separated) so preview deployments can
  // be revalidated alongside production while a branch is being tested.
  const urls = configMap.revalidation_url
    .split(/[\s,]+/)
    .map((u: string) => u.trim())
    .filter(Boolean)
  if (urls.length === 0) return

  const body = JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(configMap.webhook_secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body))
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': sigHex,
  }
  if (bypass) headers['x-vercel-protection-bypass'] = bypass

  // Fan out to every URL; one failing must not block the others.
  await Promise.all(
    urls.map(async (url: string) => {
      try {
        const res = await fetch(url, { method: 'POST', headers, body })
        if (!res.ok) {
          console.error(`Marketing revalidation to ${url} returned ${res.status} for ${payload.table} ${payload.record_id}`)
        }
      } catch (err) {
        console.error(`Marketing revalidation to ${url} failed for ${payload.table} ${payload.record_id}:`, err)
      }
    }),
  )
}

export async function fetchPropertySlug(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('properties')
    .select('slug')
    .eq('id', propertyId)
    .single()
  return (data?.slug as string | undefined) ?? null
}
