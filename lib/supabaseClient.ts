import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseBrowserClient = () => {
  // Debug: log Supabase config in development
  if (process.env.NODE_ENV === "development") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || supabaseUrl.includes("your-project")) {
      console.error("[Supabase] ⚠️  NEXT_PUBLIC_SUPABASE_URL non configurato correttamente!");
      console.error("[Supabase] URL attuale:", supabaseUrl || "NON IMPOSTATO");
      console.error("[Supabase] Vai su: https://app.supabase.com → Settings → API → Project URL");
    } else {
      console.log("[Supabase] ✅ URL configurato:", supabaseUrl.replace(/\/$/, ""));
    }
    
    if (!anonKey || anonKey.includes("your_anon_key") || anonKey.length < 50) {
      console.error("[Supabase] ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY non configurato correttamente!");
      console.error("[Supabase] Chiave attuale:", anonKey ? `${anonKey.substring(0, 20)}... (lunghezza: ${anonKey.length})` : "NON IMPOSTATO");
      console.error("[Supabase] Vai su: https://app.supabase.com → Settings → API → anon/public key");
    } else {
      console.log("[Supabase] ✅ ANON_KEY configurato (lunghezza:", anonKey.length, "caratteri)");
    }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }
  return createBrowserClient(supabaseUrl, anonKey);
};


