"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cookie, Settings, Shield, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";

/* ------------------------------------------------------------------ */
/*  Types + storage helpers                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "risksent_cookie_consent_v1";
const COOKIE_NAME = "risksent_consent";
const CONSENT_VERSION = 1;
/** 180 days — GDPR-common validity for stored consent. */
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export type CookieConsent = {
  version: number;
  timestamp: string;
  /** Always true; session, auth, CSRF, preferences. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_REJECTED: CookieConsent = {
  version: CONSENT_VERSION,
  timestamp: "",
  necessary: true,
  analytics: false,
  marketing: false,
};

function parseConsent(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  // Purposefully NOT HttpOnly (this client sets it). Secure in prod so it only
  // rides over HTTPS; Lax so it's sent on top-level navigations.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  // Prefer the cookie (authoritative, survives storage clears and is readable
  // server-side); fall back to localStorage for users migrating from v0.
  return (
    parseConsent(readCookie(COOKIE_NAME)) ||
    parseConsent(window.localStorage.getItem(STORAGE_KEY))
  );
}

function writeConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(consent);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  writeCookie(COOKIE_NAME, serialized, COOKIE_MAX_AGE_SECONDS);
  window.dispatchEvent(new CustomEvent<CookieConsent>("cookie-consent:change", { detail: consent }));
}

/** Public helper — use in analytics/marketing wiring. */
export function getCookieConsent(): CookieConsent {
  return readConsent() ?? DEFAULT_REJECTED;
}

/** Public helper — opens the preferences modal from anywhere (e.g. footer link). */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cookie-consent:open"));
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3c3c] disabled:cursor-not-allowed"
      style={{
        background: checked ? "rgba(255,60,60,0.85)" : "rgba(255,255,255,0.08)",
        borderColor: checked ? "rgba(255,60,60,0.6)" : "rgba(255,255,255,0.12)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow"
        style={{ left: checked ? "calc(100% - 1.25rem)" : "0.25rem" }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Banner + Preferences modal                                         */
/* ------------------------------------------------------------------ */

export function CookieConsentBanner() {
  const [hydrated, setHydrated] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const firstRenderRef = useRef(true);

  const persist = useCallback(
    (patch: Partial<CookieConsent>) => {
      const next: CookieConsent = {
        version: CONSENT_VERSION,
        necessary: true,
        analytics,
        marketing,
        timestamp: new Date().toISOString(),
        ...patch,
      };
      writeConsent(next);
      setSavedAt(next.timestamp);
      return next;
    },
    [analytics, marketing]
  );

  // Hydrate from storage on mount.
  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      setSavedAt(existing.timestamp || null);
      setBannerOpen(false);
    } else {
      setBannerOpen(true);
    }
    setHydrated(true);
  }, []);

  // Imperative "open preferences" from anywhere. When reopened, resync state
  // from the persisted cookie so the toggles always match what's actually saved.
  useEffect(() => {
    const handler = () => {
      const existing = readConsent();
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
        setSavedAt(existing.timestamp || null);
      }
      setModalOpen(true);
    };
    window.addEventListener("cookie-consent:open", handler);
    return () => window.removeEventListener("cookie-consent:open", handler);
  }, []);

  // Prevent initial animation glitch on SSR → CSR boundary.
  useEffect(() => {
    firstRenderRef.current = false;
  }, []);

  const toastSaved = useCallback((analyticsOn: boolean, marketingOn: boolean) => {
    const on: string[] = ["Necessary"];
    if (analyticsOn) on.push("Analytics");
    if (marketingOn) on.push("Marketing");
    const allOff = !analyticsOn && !marketingOn;
    toast.success(
      "Cookie preferences saved",
      allOff ? "Only strictly necessary cookies are active." : `Active: ${on.join(", ")}.`
    );
  }, []);

  const acceptAll = useCallback(() => {
    setAnalytics(true);
    setMarketing(true);
    persist({ analytics: true, marketing: true });
    setBannerOpen(false);
    setModalOpen(false);
    toastSaved(true, true);
  }, [persist, toastSaved]);

  const rejectAll = useCallback(() => {
    setAnalytics(false);
    setMarketing(false);
    persist({ analytics: false, marketing: false });
    setBannerOpen(false);
    setModalOpen(false);
    toastSaved(false, false);
  }, [persist, toastSaved]);

  const saveChoices = useCallback(() => {
    persist({ analytics, marketing });
    setBannerOpen(false);
    setModalOpen(false);
    toastSaved(analytics, marketing);
  }, [persist, analytics, marketing, toastSaved]);

  const showBanner = hydrated && bannerOpen && !modalOpen;

  // Close modal on ESC.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const bannerCopy = useMemo(
    () =>
      "We use strictly necessary cookies to keep RiskSent running and, with your consent, optional analytics and marketing cookies to improve the product and measure campaigns. You can change your choice anytime from the footer.",
    []
  );

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed inset-x-3 bottom-3 z-[1000] sm:inset-x-6 sm:bottom-6"
          >
            <div
              className="mx-auto max-w-4xl overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, rgba(14,14,18,0.96), rgba(10,10,14,0.96))",
                boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            >
              <div
                aria-hidden
                className="h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,60,60,0.45), rgba(255,140,0,0.45), transparent)",
                }}
              />
              <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-5">
                <div
                  className="hidden shrink-0 items-center justify-center rounded-xl border sm:flex"
                  style={{
                    width: 42,
                    height: 42,
                    borderColor: "rgba(255,60,60,0.3)",
                    background: "rgba(255,60,60,0.08)",
                  }}
                >
                  <Cookie className="h-5 w-5 text-[#ff8c00]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13px] font-semibold text-white sm:text-[14px]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    We value your privacy
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-400 sm:text-[12.5px]">
                    {bannerCopy}{" "}
                    <Link href="/cookies" className="text-slate-300 underline underline-offset-2 hover:text-white">
                      Read the Cookie Policy
                    </Link>
                    .
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="rounded-xl border px-3.5 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    Reject all
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Customize
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-xl px-4 py-2 text-[12px] font-bold text-black transition-transform hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                      boxShadow: "0 0 22px rgba(255,60,60,0.25)",
                    }}
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
            style={{ background: "rgba(4,4,8,0.72)", backdropFilter: "blur(6px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Cookie preferences"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, rgba(14,14,18,0.98), rgba(10,10,14,0.98))",
              }}
            >
              <div
                aria-hidden
                className="h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,60,60,0.45), rgba(255,140,0,0.45), transparent)",
                }}
              />

              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div className="min-w-0">
                  <p
                    className="text-[18px] font-bold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Cookie preferences
                  </p>
                  <p className="mt-1 text-[12.5px] text-slate-400">
                    Choose which cookies RiskSent can set on your device. You can change this at any time.
                  </p>
                  {savedAt && (
                    <div
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-mono font-semibold uppercase tracking-wider text-emerald-300"
                      style={{
                        borderColor: "rgba(16,185,129,0.35)",
                        background: "rgba(16,185,129,0.08)",
                      }}
                      title={new Date(savedAt).toLocaleString()}
                    >
                      <Check className="h-3 w-3" />
                      Saved {formatRelative(savedAt)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close cookie preferences"
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 px-6 py-5">
                <CategoryRow
                  icon={<Shield className="h-4 w-4 text-emerald-400" />}
                  title="Strictly necessary"
                  description="Session, authentication, CSRF protection and saved preferences. Required for the Platform to work — cannot be disabled."
                  checked
                  disabled
                  onChange={() => {}}
                  pill="Always on"
                />
                <CategoryRow
                  icon={<Cookie className="h-4 w-4 text-[#6366f1]" />}
                  title="Analytics"
                  description="Aggregated usage and performance metrics to understand how features are used and fix issues (e.g. Sentry)."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <CategoryRow
                  icon={<Cookie className="h-4 w-4 text-[#ff8c00]" />}
                  title="Marketing"
                  description="Used on the public website to measure campaigns and show relevant RiskSent content on other platforms."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>

              <div
                className="flex flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <Link
                  href="/cookies"
                  className="text-[11.5px] font-mono text-slate-500 underline underline-offset-2 hover:text-slate-300"
                  onClick={() => setModalOpen(false)}
                >
                  Read the Cookie Policy →
                </Link>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="rounded-xl border px-3.5 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    Reject all
                  </button>
                  <button
                    type="button"
                    onClick={saveChoices}
                    className="rounded-xl border px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.04] hover:text-white"
                    style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  >
                    Save choices
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-xl px-4 py-2 text-[12px] font-bold text-black transition-transform hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                      boxShadow: "0 0 22px rgba(255,60,60,0.25)",
                    }}
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
  pill,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  pill?: string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="text-[13px] font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </p>
          {pill && (
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-emerald-300"
              style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.08)" }}>
              {pill}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{description}</p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} label={title} />
    </div>
  );
}

export default CookieConsentBanner;
