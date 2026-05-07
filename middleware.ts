import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.STAGING_BASIC_AUTH !== "true") {
    return NextResponse.next();
  }

  // Skip Basic Auth for webhook/stripe/telegram routes that need to be public
  const { pathname } = request.nextUrl;
  const skipPaths = ["/api/stripe/", "/api/telegram/", "/api/monitoring/"];
  if (skipPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const basicAuth = request.headers.get("authorization");
  if (basicAuth) {
    const [scheme, encoded] = basicAuth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [user, password] = decoded.split(":");
      if (
        user === process.env.STAGING_USER &&
        password === process.env.STAGING_PASSWORD
      ) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Staging", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
