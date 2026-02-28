import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PROTECTED_PATHS = [
  "/dashboard",
  "/rules",
  "/trades",
  "/simulator",
  "/ai-coach",
  "/add-account",
  "/accounts",
  "/metaapi-test",
  "/metatraderapi-test",
  "/admin"
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const isProtected = PROTECTED_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (req.nextUrl.pathname === "/login" && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

