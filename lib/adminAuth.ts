import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Check if the current user has admin role
 * Returns { isAdmin: boolean, userId: string | null }
 */
export async function checkAdminRole(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, userId: null };
  }

  try {
    const admin = createSupabaseAdmin();
    const { data: appUser, error } = await admin
      .from("app_user")
      .select("role")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      return { isAdmin: false, userId: user.id };
    }

    if (!appUser) {
      return { isAdmin: false, userId: user.id };
    }

    const isAdmin = appUser.role === "admin";
    return { isAdmin, userId: user.id };
  } catch {
    return { isAdmin: false, userId: user.id };
  }
}

/**
 * Client-side check for admin role (for use in React components)
 */
export async function checkAdminRoleClient(): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const res = await fetch("/api/admin/check-role");
    if (!res.ok) {
      return { isAdmin: false, userId: null };
    }
    const data = await res.json();
    return { isAdmin: data.isAdmin ?? false, userId: data.userId ?? null };
  } catch {
    return { isAdmin: false, userId: null };
  }
}
