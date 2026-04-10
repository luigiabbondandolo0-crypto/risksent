import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function createSupabaseRouteClient() {
  const cookieStore = await cookies();
  return createRouteHandlerClient({
    cookies: async () => cookieStore,
  });
}
