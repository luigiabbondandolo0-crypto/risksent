import { NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";

/**
 * GET /api/admin/check-role
 * Returns whether the current user has admin role
 */
export async function GET() {
  const { isAdmin, userId } = await checkAdminRole();
  return NextResponse.json({ isAdmin, userId });
}
