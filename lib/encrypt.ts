import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be set and at least 32 characters");
  }
  return Buffer.from(key.slice(0, KEY_LENGTH), "utf8");
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let enc = cipher.update(plain, "utf8", "base64");
  enc += cipher.final("base64");
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc}`;
}

export function decrypt(encrypted: string): string {
  const key = getKey();
  const [ivB64, tagB64, enc] = encrypted.split(":");
  if (!ivB64 || !tagB64 || !enc) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(enc, "base64", "utf8") + decipher.final("utf8");
}
