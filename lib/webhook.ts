import type { SupabaseClient } from '@supabase/supabase-js'

type RevalidatePayload = {
  event: 'publish' | 'update' | 'media'
  table: 'properties' | 'posts' | 'team_members'
  record_id: string
  slug?: string | null
  old_slug?: string | null
  path: string
  timestamp: string
}

export async function fireMarketingRevalidation(
  supabase: SupabaseClient,
  payload: Omit<RevalidatePayload, 'timestamp'>,
): Promise<void> {
  const { data: config } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', ['revalidation_url', 'webhook_secret'])

  const configMap = Object.fromEntries((config ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
  if (!configMap.revalidation_url || !configMap.webhook_secret) return

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

  await fetch(configMap.revalidation_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': sigHex },
    body,
  }).catch(() => {
    // Best-effort. Marketing site will still pick up changes on next cacheLife expiry.
  })
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
