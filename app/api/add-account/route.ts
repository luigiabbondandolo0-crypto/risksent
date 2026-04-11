import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const MESSAGE =
  "Connecting broker accounts is temporarily unavailable while we switch to a new data provider. Existing saved accounts remain listed, but live balance and trades will not update until the new integration ships.";

/**
 * POST /api/add-account — disabled until a new broker data provider is integrated.
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        ok: false,
        message: MESSAGE,
        problems: [MESSAGE]
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: MESSAGE, problems: [MESSAGE] },
      { status: 503 }
    );
  }
}
