import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { image?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image, filename } = body;
  if (!image) {
    return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const ext = filename?.split(".").pop() ?? "png";
  const timestamp = Date.now();
  const path = `${user.id}/${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("journal-images")
    .upload(path, buffer, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
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
