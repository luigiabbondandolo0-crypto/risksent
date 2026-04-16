/**
 * Local guardrail: fail if obvious secrets appear in source (not .env).
 * Run: node scripts/scan-secrets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BLOCKED = [
  { re: /\bsk_live_[a-zA-Z0-9]{20,}/, msg: "Stripe live secret in source" },
  { re: /\bsk_test_[a-zA-Z0-9]{20,}/, msg: "Stripe test secret in source" },
  { re: /service_role["\s]*[:=]["'][a-zA-Z0-9._-]{20,}/i, msg: "Supabase service role material in source" },
  { re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]{30,}['"]/, msg: "Hardcoded SUPABASE_SERVICE_ROLE_KEY" },
  { re: /ANTHROPIC_API_KEY\s*=\s*['"][^'"]+['"]/, msg: "Hardcoded ANTHROPIC_API_KEY" },
  { re: /OPENAI_API_KEY\s*=\s*['"][^'"]+['"]/, msg: "Hardcoded OPENAI_API_KEY" },
  { re: /RESEND_API_KEY\s*=\s*['"][^'"]+['"]/, msg: "Hardcoded RESEND_API_KEY" }
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "build",
  "coverage"
]);

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".env.example"]);

function walk(dir, out) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".")) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (SKIP_DIRS.has(name.name)) continue;
      walk(p, out);
    } else {
      const ext = path.extname(name.name);
      if (EXT.has(ext) || name.name === ".env.example") out.push(p);
    }
  }
}

const files = [];
walk(root, files);

let bad = 0;
for (const file of files) {
  if (file.includes(`${path.sep}scripts${path.sep}scan-secrets.mjs`)) continue;
  const rel = path.relative(root, file);
  if (rel.startsWith(`scripts${path.sep}`) && rel.endsWith("scan-secrets.mjs")) continue;

  const text = fs.readFileSync(file, "utf8");
  for (const { re, msg } of BLOCKED) {
    if (re.test(text)) {
      console.error(`[scan-secrets] ${msg}: ${rel}`);
      bad++;
    }
  }
}

if (bad) {
  console.error(`\n[scan-secrets] Found ${bad} issue(s). Remove literals from repo; use environment variables.`);
  process.exit(1);
}
console.log("[scan-secrets] OK (no blocked patterns in tracked file types).");
