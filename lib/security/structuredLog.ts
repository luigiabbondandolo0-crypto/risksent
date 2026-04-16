export type SecurityLogLevel = "info" | "warn" | "error";

export type SecurityLogPayload = Record<string, unknown>;

/**
 * Structured logs for hosts (Vercel, Docker) and log drains.
 * Never pass passwords, tokens, or full session cookies.
 */
export function securityLog(level: SecurityLogLevel, event: string, data: SecurityLogPayload = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
