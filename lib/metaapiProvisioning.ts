/**
 * MetaApi MT account provisioning (create + deploy).
 * @see https://metaapi.cloud/docs/provisioning/api/account/createAccount/
 */

import crypto from "crypto";

const DEFAULT_PROVISIONING_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

export type ProvisionAccountInput = {
  name: string;
  login: string;
  password: string;
  server: string;
  platform: "mt4" | "mt5";
  /** When true (default), magic must be 0 per MetaApi rules */
  manualTrades?: boolean;
  magic?: number;
  region?: string;
  provisioningProfileId?: string;
  keywords?: string[];
};

export type ProvisionAccountResult =
  | { ok: true; accountId: string; state: string }
  | { ok: false; status: number; message: string; details?: unknown };

function provisioningBaseUrl(): string {
  const raw = process.env.METAAPI_PROVISIONING_URL?.trim() || DEFAULT_PROVISIONING_BASE;
  return raw.replace(/\/$/, "");
}

function getToken(): string | null {
  return process.env.METAAPI_TOKEN?.trim() || null;
}

function transactionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

function parseRetryMs(res: Response, bodyText: string): number {
  const ra = res.headers.get("retry-after");
  if (ra) {
    const sec = parseInt(ra, 10);
    if (!Number.isNaN(sec) && sec >= 0) return Math.min(Math.max(sec * 1000, 1000), 120_000);
    const d = Date.parse(ra);
    if (!Number.isNaN(d)) return Math.min(Math.max(d - Date.now(), 1000), 120_000);
  }
  try {
    const j = JSON.parse(bodyText) as { metadata?: { recommendedRetryTime?: string } };
    const rt = j.metadata?.recommendedRetryTime;
    if (rt) {
      const t = new Date(rt).getTime() - Date.now();
      if (Number.isFinite(t)) return Math.min(Math.max(t, 1000), 120_000);
    }
  } catch {
    /* ignore */
  }
  return 10_000;
}

function metaApiErrorMessage(bodyText: string): string {
  try {
    const j = JSON.parse(bodyText) as { message?: string; error?: string };
    if (typeof j.message === "string" && j.message.length > 0) return j.message;
    if (typeof j.error === "string") return j.error;
  } catch {
    /* ignore */
  }
  return bodyText.slice(0, 400);
}

/**
 * Create account on MetaApi; on 202 retries same transaction until 201 or failure.
 * Then deploys if state is not already deployed.
 */
export async function provisionAndDeployMetaTraderAccount(input: ProvisionAccountInput): Promise<ProvisionAccountResult> {
  const token = getToken();
  if (!token) {
    return { ok: false, status: 503, message: "METAAPI_TOKEN is not set" };
  }

  const base = provisioningBaseUrl();
  const txId = transactionId();
  const manualTrades = input.manualTrades !== false;
  const magic = manualTrades ? 0 : input.magic ?? 123456;

  const body: Record<string, unknown> = {
    login: input.login.replace(/\D/g, ""),
    password: input.password,
    name: input.name,
    server: input.server.trim(),
    platform: input.platform,
    magic,
    manualTrades,
    type: process.env.METAAPI_ACCOUNT_TYPE?.trim() || "cloud-g2",
    reliability: process.env.METAAPI_RELIABILITY?.trim() || "high"
  };

  if (!body.login || String(body.login).length === 0) {
    return { ok: false, status: 400, message: "Account number must contain digits" };
  }

  const region = input.region ?? process.env.METAAPI_REGION?.trim();
  if (region) body.region = region;

  const profileId = input.provisioningProfileId ?? process.env.METAAPI_PROVISIONING_PROFILE_ID?.trim();
  if (profileId) {
    body.provisioningProfileId = profileId;
    delete body.platform;
  }

  const kw = input.keywords?.length
    ? input.keywords
    : process.env.METAAPI_BROKER_KEYWORDS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (kw && kw.length > 0) body.keywords = kw;

  const resourceSlots = Number(process.env.METAAPI_RESOURCE_SLOTS);
  if (Number.isFinite(resourceSlots) && resourceSlots >= 1) {
    body.resourceSlots = Math.min(Math.floor(resourceSlots), 32);
  }

  const url = `${base}/users/current/accounts`;
  let accountId: string | null = null;
  let state: string | null = null;

  for (let attempt = 0; attempt < 24; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "auth-token": token,
        "transaction-id": txId
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const text = await res.text();

    if (res.status === 201) {
      try {
        const data = JSON.parse(text) as { id?: string; state?: string };
        accountId = data.id ?? null;
        state = data.state ?? null;
      } catch {
        return { ok: false, status: 502, message: "Invalid JSON from MetaApi provisioning" };
      }
      if (!accountId) {
        return { ok: false, status: 502, message: "MetaApi provisioning returned no account id" };
      }
      break;
    }

    if (res.status === 202) {
      const wait = parseRetryMs(res, text);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    return {
      ok: false,
      status: res.status,
      message: metaApiErrorMessage(text),
      details: text.length < 2000 ? text : undefined
    };
  }

  if (!accountId) {
    return {
      ok: false,
      status: 504,
      message: "MetaApi provisioning timed out (broker detection still in progress). Try again in a minute."
    };
  }

  const upper = (state ?? "").toUpperCase();
  if (upper && upper !== "DEPLOYED") {
    const deployUrl = `${base}/users/current/accounts/${encodeURIComponent(accountId)}/deploy`;
    const dRes = await fetch(deployUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "auth-token": token
      },
      cache: "no-store"
    });
    if (!dRes.ok && dRes.status !== 204) {
      const dText = await dRes.text();
      return {
        ok: false,
        status: dRes.status,
        message: metaApiErrorMessage(dText) || "Deploy failed after account creation"
      };
    }
  }

  return { ok: true, accountId, state: state ?? "DEPLOYED" };
}
