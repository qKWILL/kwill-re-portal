import type { SupabaseClient } from '@supabase/supabase-js'

type RevalidatePayload = {
  event: 'publish' | 'update' | 'media' | 'status_change'
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
    .in('key', ['revalidation_url', 'webhook_secret', 'vercel_protection_bypass'])

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

  await Promise.all(
    urls.map((url: string) =>
      fetch(url, { method: 'POST', headers, body }).catch(() => {
        // Best-effort fan-out: failure of one URL must not block the others.
      }),
    ),
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
