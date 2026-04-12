import { NextRequest, NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const SELECTABLE_PLANS = ["user", "trial", "new_trader", "experienced", "admin"] as const;
type SelectablePlan = (typeof SELECTABLE_PLANS)[number];

const LEGACY_ROLES = ["admin", "trader", "customer"] as const;

function isSelectablePlan(v: string): v is SelectablePlan {
  return (SELECTABLE_PLANS as readonly string[]).includes(v);
}

/**
 * PATCH /api/admin/users/[id]/role
 * Body: { plan: "user" | "trial" | "new_trader" | "experienced" | "admin" } — updates subscription and/or app_user.role
 * Legacy body: { role: "admin" | "trader" | "customer" } — updates app_user.role only
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await checkAdminRole();

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { plan?: unknown; role?: unknown };
    const { id: userId } = await context.params;
    const admin = createSupabaseAdmin();
    const now = new Date().toISOString();

    if (typeof body.plan === "string" && isSelectablePlan(body.plan)) {
      const plan = body.plan;

      if (plan === "admin") {
        const { error } = await admin.from("app_user").update({ role: "admin" }).eq("id", userId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, plan: "admin" as const });
      }

      const { error: roleErr } = await admin.from("app_user").update({ role: "customer" }).eq("id", userId);
      if (roleErr) {
        return NextResponse.json({ error: roleErr.message }, { status: 500 });
      }

      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const subRow =
        plan === "user"
          ? {
              user_id: userId,
              plan: "user" as const,
              status: "active" as const,
              current_period_start: null as string | null,
              current_period_end: null as string | null,
              cancel_at_period_end: false,
              updated_at: now,
            }
          : plan === "trial"
            ? {
                user_id: userId,
                plan: "trial" as const,
                status: "trialing" as const,
                current_period_start: now,
                current_period_end: trialEnd,
                cancel_at_period_end: false,
                updated_at: now,
              }
            : plan === "new_trader"
              ? {
                  user_id: userId,
                  plan: "new_trader" as const,
                  status: "active" as const,
                  current_period_start: null as string | null,
                  current_period_end: null as string | null,
                  cancel_at_period_end: false,
                  updated_at: now,
                }
              : {
                  user_id: userId,
                  plan: "experienced" as const,
                  status: "active" as const,
                  current_period_start: null as string | null,
                  current_period_end: null as string | null,
                  cancel_at_period_end: false,
                  updated_at: now,
                };

      const { error: subErr } = await admin.from("subscriptions").upsert(subRow, { onConflict: "user_id" });
      if (subErr) {
        return NextResponse.json({ error: subErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, plan });
    }

    const role = body.role;
    if (typeof role === "string" && (LEGACY_ROLES as readonly string[]).includes(role)) {
      const { error: updateError } = await admin.from("app_user").update({ role }).eq("id", userId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, role });
    }

    return NextResponse.json(
      { error: "Invalid body. Send { plan } or legacy { role }." },
      { status: 400 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update role";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
