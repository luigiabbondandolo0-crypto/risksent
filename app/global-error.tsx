"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#080810",
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
        }}
      >
        <p style={{ fontSize: "3rem", fontWeight: 700, color: "#f87171", margin: 0 }}>500</p>
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Application error</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", maxWidth: "24rem", margin: 0 }}>
          A critical error occurred. If this persists, email{" "}
          <a href="mailto:support@risksent.com" style={{ color: "#818cf8" }}>
            support@risksent.com
          </a>
          .
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#475569" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#cbd5e1",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
