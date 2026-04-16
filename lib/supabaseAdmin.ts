import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must not be set; service role is server-only.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  return createClient(url, key);
}
