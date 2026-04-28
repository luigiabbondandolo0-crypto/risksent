import { NextRequest, NextResponse } from "next/server";
import { checkAdminRole } from "@/lib/adminAuth";
import { getEmailPreviewHtml, type PreviewEmailType } from "@/lib/email";

const VALID_TYPES: PreviewEmailType[] = [
  "marketing",
  "promo",
  "onboarding-1",
  "onboarding-2",
  "onboarding-3",
  "weekly-insight",
];

/**
 * GET /api/admin/email/preview?type=<PreviewEmailType>
 *
 * Returns raw HTML for the requested email template so it can be rendered
 * in an iframe on the admin preview page. Admin-only.
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const type = new URL(req.url).searchParams.get("type") as PreviewEmailType | null;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const html = getEmailPreviewHtml(type);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
