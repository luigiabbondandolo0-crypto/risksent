import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "RiskSent – Backtesting, Journaling & Risk Management for Traders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const logoData = readFileSync(join(process.cwd(), "public/brand/risk-sent-r.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080810",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Radial glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Logo badge */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 60px rgba(99,102,241,0.35), 0 8px 32px rgba(0,0,0,0.5)",
              marginBottom: 36,
            }}
          >
            <img
              src={logoSrc}
              width={88}
              height={88}
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
              marginBottom: 20,
              fontFamily: "system-ui, sans-serif",
              display: "flex",
            }}
          >
            RiskSent
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#94a3b8",
              letterSpacing: "0px",
              lineHeight: 1.4,
              textAlign: "center",
              maxWidth: 760,
              fontFamily: "system-ui, sans-serif",
              display: "flex",
            }}
          >
            Backtest · Journal · Risk Manager · AI Coach
          </div>

          {/* Pill */}
          <div
            style={{
              marginTop: 36,
              padding: "10px 28px",
              borderRadius: 100,
              border: "1px solid rgba(99,102,241,0.4)",
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.5px",
              fontFamily: "system-ui, sans-serif",
              display: "flex",
            }}
          >
            risksent.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
