import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/**
 * GET /api/profile
 * Get current user's profile data
 */
export async function GET() {
  const supabase = await createSupabaseRouteClient();
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
      .select(
        "full_name, phone, company, role, created_at, preference_timezone, preference_currency"
      )
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
      createdAt: appUser?.created_at || user.created_at,
      preferenceTimezone: appUser?.preference_timezone || "UTC",
      preferenceCurrency: appUser?.preference_currency || "USD"
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
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, phone, company, preferenceTimezone, preferenceCurrency } = body;

    const updates: {
      full_name?: string;
      phone?: string;
      company?: string;
      preference_timezone?: string | null;
      preference_currency?: string | null;
    } = {};

    if (fullName !== undefined) updates.full_name = fullName || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (company !== undefined) updates.company = company || null;
    if (preferenceTimezone !== undefined) {
      updates.preference_timezone =
        typeof preferenceTimezone === "string" && preferenceTimezone.trim()
          ? preferenceTimezone.trim()
          : "UTC";
    }
    if (preferenceCurrency !== undefined) {
      updates.preference_currency =
        typeof preferenceCurrency === "string" && preferenceCurrency.trim()
          ? preferenceCurrency.trim().toUpperCase()
          : "USD";
    }

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
