import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAIL = "luigiabbondandolo0@gmail.com";

/**
 * PATCH /api/admin/users/[id]/role
 * Updates a user's role (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role } = body;

    if (!role || !["admin", "trader", "customer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin', 'trader', or 'customer'" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();
    const userId = params.id;

    // Update the role in app_user
    const { error: updateError } = await admin
      .from("app_user")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update role";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
