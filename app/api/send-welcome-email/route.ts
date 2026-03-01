import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

/**
 * POST /api/send-welcome-email
 * Sends a welcome email to the authenticated user
 * Called after successful signup
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendWelcomeEmail({
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
