import { securityLog } from "@/lib/security/structuredLog";

/**
 * Runtime checks for obviously unsafe configuration (Node only).
 * Does not print secret values.
 */
export function assertServerSecretsNotLeakedToPublicEnv(): void {
  const publicKeys = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
  for (const key of publicKeys) {
    const val = process.env[key];
    if (!val) continue;
    const lower = val.toLowerCase();
    if (lower.includes("service_role") || lower.includes("sk_live") || lower.includes("sk_test")) {
      securityLog("error", "security.config.leaked_pattern_in_next_public", {
        key,
        hint: "Remove secrets from NEXT_PUBLIC_* variables; they ship to the browser."
      });
    }
  }

  if (process.env.NEXT_PUBLIC_DATABASE_URL) {
    securityLog("error", "security.config.database_url_must_not_be_next_public", {});
  }
}
