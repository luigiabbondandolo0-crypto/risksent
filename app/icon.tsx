import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 20,
          color: "#ffffff",
          letterSpacing: "-1px",
        }}
      >
        R
      </div>
    ),
    { width: 32, height: 32 }
  );
}
