import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }
  return createBrowserClient(supabaseUrl, anonKey);
};
