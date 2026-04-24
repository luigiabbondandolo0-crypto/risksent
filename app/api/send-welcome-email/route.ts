import { NextRequest, NextResponse } from "next/server";
import { sendTrialActivatedEmail } from "@/lib/email";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/**
 * POST /api/send-welcome-email
 * Sends the “free trial active” onboarding email to the authenticated user.
 */
export async function POST(_req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendTrialActivatedEmail({
      to: user.email || "",
      userName: user.user_metadata?.full_name || user.email?.split("@")[0]
    });

    if (!result.success) {
      console.warn("[Welcome Email API] Failed to send:", result.error);
      // Don't fail the request if email fails - it's not critical
      return NextResponse.json({ 
        sent: false, 
        error: result.error 
      }, { status: 200 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Welcome Email API] Exception:", errorMessage);
    return NextResponse.json({ 
      sent: false, 
      error: errorMessage 
    }, { status: 200 });
  }
}
