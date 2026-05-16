/**
 * SUPABASE ADMIN CLIENT (server-only)
 *
 * Uses the service-role key, so this module must never be imported into
 * client components. It is only referenced by Route Handlers under app/api.
 *
 * The client is created lazily so a missing env var fails at request time
 * with a clear message instead of crashing the build.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
