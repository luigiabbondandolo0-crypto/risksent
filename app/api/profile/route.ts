import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

/**
 * GET /api/profile
 * Get current user's profile data
 */
export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: appUser, error: appError } = await supabase
      .from("app_user")
      .select("full_name, phone, company, role, created_at")
      .eq("id", user.id)
      .single();

    if (appError) {
      return NextResponse.json(
        { error: appError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email: user.email,
      fullName: appUser?.full_name || "",
      phone: appUser?.phone || "",
      company: appUser?.company || "",
      role: appUser?.role || "customer",
      createdAt: appUser?.created_at || user.created_at
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile data
 */
export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, phone, company } = body;

    const updates: {
      full_name?: string;
      phone?: string;
      company?: string;
    } = {};

    if (fullName !== undefined) updates.full_name = fullName || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (company !== undefined) updates.company = company || null;

    const { error: updateError } = await supabase
      .from("app_user")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
