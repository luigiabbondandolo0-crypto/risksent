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

  // Validate magic bytes to ensure content matches declared extension
  const validMagic = (() => {
    const b = buffer;
    const norm = ext === "jpeg" ? "jpg" : ext;
    if (norm === "png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    if (norm === "jpg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (norm === "gif") return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    if (norm === "webp") {
      const isRiff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
      const isWebp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
      return isRiff && isWebp;
    }
    return false;
  })();
  if (!validMagic) {
    return NextResponse.json({ error: "File content does not match declared image type" }, { status: 400 });
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
