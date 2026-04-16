import { securityLog } from "@/lib/security/structuredLog";

/**
 * Runtime checks for obviously unsafe configuration (Node only).
 * Does not print secret values.
 */
const EXPECTED_NEXT_PUBLIC_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL"
]);

export function assertServerSecretsNotLeakedToPublicEnv(): void {
  const publicKeys = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
  for (const key of publicKeys) {
    const val = process.env[key];
    if (!val) continue;
    const lower = val.toLowerCase();

    // Known-safe public vars (Supabase anon is a JWT; URL is public).
    if (EXPECTED_NEXT_PUBLIC_KEYS.has(key)) {
      if (lower.includes("service_role") || key.includes("SERVICE_ROLE")) {
        securityLog("error", "security.config.wrong_key_or_service_role_in_public_supabase", { key });
      }
      continue;
    }

    const dangerous =
      lower.includes("service_role") ||
      lower.includes("sk_live") ||
      lower.includes("sk_test") ||
      val.startsWith("eyJ") ||
      lower.includes("postgresql://") ||
      lower.includes("postgres://") ||
      lower.includes("redis://") ||
      lower.includes("mongodb://") ||
      lower.includes("api.openai.com") ||
      (lower.includes("anthropic") && lower.includes("sk-ant")) ||
      lower.includes("resend.com") ||
      lower.includes("twelvedata");
    if (dangerous) {
      securityLog("error", "security.config.leaked_pattern_in_next_public", {
        key,
        hint: "Remove secrets from NEXT_PUBLIC_* variables; they ship to the browser."
      });
    }
  }

  if (process.env.NEXT_PUBLIC_DATABASE_URL) {
    securityLog("error", "security.config.database_url_must_not_be_next_public", {});
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    securityLog("error", "security.config.service_role_must_not_be_next_public", {});
  }
}
