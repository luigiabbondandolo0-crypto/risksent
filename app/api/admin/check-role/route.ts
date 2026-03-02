import { NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";

/**
 * GET /api/admin/check-role
 * Returns whether the current user has admin role
 */
export async function GET() {
  try {
    const { isAdmin, userId } = await checkAdminRole();
    console.log("[check-role API] Result:", { isAdmin, userId });
    return NextResponse.json({ isAdmin, userId });
  } catch (err) {
    console.error("[check-role API] Error:", err);
    return NextResponse.json({ isAdmin: false, userId: null }, { status: 500 });
  }
}
