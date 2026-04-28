import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const error = new Error("Sentry server test error");
  Sentry.captureException(error);
  // flush ensures the event is sent before the response closes
  await Sentry.flush(2000);
  return Response.json({ error: "test error captured" }, { status: 500 });
}
