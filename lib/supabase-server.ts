import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * This bypasses RLS entirely — only use inside Next.js API routes
 * where the request has already been verified via Firebase Admin.
 *
 * NEVER expose this key to the browser.
 */
export function getSupabaseServer(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
        'Get the service role key from: Supabase Dashboard → Project Settings → API → service_role.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable auto-refresh — not needed server-side
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
