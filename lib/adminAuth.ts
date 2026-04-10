import { createSupabaseRouteClient } from "@/lib/supabaseServer";
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
      .single();

    if (error) {
      console.error("[checkAdminRole] Database error:", error.message);
      return { isAdmin: false, userId: user.id };
    }

    if (!appUser) {
      console.log("[checkAdminRole] No app_user found for user:", user.id);
      return { isAdmin: false, userId: user.id };
    }

    const isAdmin = appUser.role === "admin";
    console.log("[checkAdminRole] User role check:", {
      userId: user.id,
      role: appUser.role,
      isAdmin
    });

    return { isAdmin, userId: user.id };
  } catch (err) {
    console.error("[checkAdminRole] Exception:", err);
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
