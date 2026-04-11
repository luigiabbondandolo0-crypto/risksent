import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";

const PREFS_SELECT =
  "full_name, phone, company, role, created_at, preference_timezone, preference_currency";
const BASE_SELECT = "full_name, phone, company, role, created_at";

type AppUserRow = {
  full_name?: string | null;
  phone?: string | null;
  company?: string | null;
  role?: string | null;
  created_at?: string | null;
  preference_timezone?: string | null;
  preference_currency?: string | null;
};

function isMissingPreferenceColumns(err: PostgrestError | null): boolean {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  return m.includes("preference_timezone") || m.includes("preference_currency");
}

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
    let prefsFallback = false;
    let { data: appUserRaw, error: appError } = await supabase
      .from("app_user")
      .select(PREFS_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    let appUser: AppUserRow | null = appUserRaw as AppUserRow | null;

    if (appError && isMissingPreferenceColumns(appError)) {
      prefsFallback = true;
      const retry = await supabase
        .from("app_user")
        .select(BASE_SELECT)
        .eq("id", user.id)
        .maybeSingle();
      appUser = retry.data as AppUserRow | null;
      appError = retry.error;
    }

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    if (!appUser) {
      return NextResponse.json({
        email: user.email,
        fullName: "",
        phone: "",
        company: "",
        role: "customer",
        createdAt: user.created_at,
        preferenceTimezone: "UTC",
        preferenceCurrency: "USD"
      });
    }

    return NextResponse.json({
      email: user.email,
      fullName: appUser.full_name || "",
      phone: appUser.phone || "",
      company: appUser.company || "",
      role: appUser.role || "customer",
      createdAt: appUser.created_at || user.created_at,
      preferenceTimezone: prefsFallback
        ? "UTC"
        : (appUser.preference_timezone || "UTC"),
      preferenceCurrency: prefsFallback
        ? "USD"
        : (appUser.preference_currency || "USD")
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
      if (isMissingPreferenceColumns(updateError) && Object.keys(updates).length > 0) {
        const { preference_timezone, preference_currency, ...rest } = updates;
        const hasPrefsOnly =
          Object.keys(rest).length === 0 &&
          (preference_timezone !== undefined || preference_currency !== undefined);
        if (hasPrefsOnly) {
          return NextResponse.json(
            {
              error:
                "Database is missing preference columns. Run the app_user preference migration on Supabase."
            },
            { status: 500 }
          );
        }
        const { error: retryErr } = await supabase
          .from("app_user")
          .update(rest)
          .eq("id", user.id);
        if (retryErr) {
          return NextResponse.json({ error: retryErr.message }, { status: 500 });
        }
      } else {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    const { data: fresh, error: readErr } = await supabase
      .from("app_user")
      .select(PREFS_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    if (readErr && isMissingPreferenceColumns(readErr)) {
      const { data: base } = await supabase
        .from("app_user")
        .select(BASE_SELECT)
        .eq("id", user.id)
        .maybeSingle();
      return NextResponse.json({
        success: true,
        preferenceTimezone:
          (updates.preference_timezone as string | undefined) ?? "UTC",
        preferenceCurrency:
          (updates.preference_currency as string | undefined) ?? "USD",
        fullName: (base?.full_name as string) ?? "",
        phone: (base?.phone as string) ?? "",
        company: (base?.company as string) ?? "",
        role: (base?.role as string) ?? "customer"
      });
    }

    if (readErr || !fresh) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: true,
      fullName: fresh.full_name || "",
      phone: fresh.phone || "",
      company: fresh.company || "",
      role: fresh.role || "customer",
      preferenceTimezone: fresh.preference_timezone || "UTC",
      preferenceCurrency: fresh.preference_currency || "USD"
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
