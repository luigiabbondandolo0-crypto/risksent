import { NextRequest, NextResponse } from "next/server";
import { checkJournalUploadRateLimit, rateLimitJsonResponse } from "@/lib/security/apiAbuse";
import {
  assertJsonBodySize,
  MAX_JOURNAL_IMAGE_BYTES,
  safeImageFilename
} from "@/lib/security/validation";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const MAX_JSON_BYTES = Math.ceil(MAX_JOURNAL_IMAGE_BYTES * 1.4) + 512;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upLim = await checkJournalUploadRateLimit(req, user.id);
  if (!upLim.allowed) {
    return rateLimitJsonResponse(upLim, "Too many upload attempts. Try again later.");
  }

  if (!assertJsonBodySize(req, MAX_JSON_BYTES)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: { image?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageRaw = body.image;
  if (typeof imageRaw !== "string" || !imageRaw) {
    return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
  }

  const safeName = safeImageFilename(
    typeof body.filename === "string" ? body.filename : undefined
  );
  if (!safeName) {
    return NextResponse.json(
      { error: "Only png, jpg, jpeg, webp, or gif images are allowed." },
      { status: 400 }
    );
  }
  const { ext } = safeName;

  // Strip data URL prefix if present
  const image = imageRaw.replace(/^data:image\/\w+;base64,/, "");
  if (image.length > MAX_JOURNAL_IMAGE_BYTES * 2) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(image, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid base64 image" }, { status: 400 });
  }

  if (buffer.length === 0 || buffer.length > MAX_JOURNAL_IMAGE_BYTES) {
    return NextResponse.json({ error: "Invalid or oversized image" }, { status: 400 });
  }

  const timestamp = Date.now();
  const path = `${user.id}/${timestamp}.${ext === "jpeg" ? "jpg" : ext}`;

  const { error: uploadError } = await supabase.storage
    .from("journal-images")
    .upload(path, buffer, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("journal-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
