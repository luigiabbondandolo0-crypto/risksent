import { RiskSentLogoMark } from "@/components/brand/RiskSentLogoMark";

type Variant = "live" | "mock";

type WordmarkProps = {
  /** Visual tone — live uses red accent, mock uses violet accent. */
  variant?: Variant;
  /** Extra classes applied to the outer span (controls font size, etc.). */
  className?: string;
  /** Deprecated — kept for backwards compat. No-op in the mono variant. */
  hideDot?: boolean;
  /** Deprecated — kept for backwards compat. No-op in the mono variant. */
  shine?: boolean;
};

/**
 * RISK/SENT terminal-style wordmark.
 *
 * - Monospace (JetBrains Mono), uppercase, wide tracking
 * - Solid white letters, red `/` separator (violet in mock)
 * - Zero animations — clean, trading-terminal aesthetic
 */
export function BrandWordmark({
  variant = "live",
  className = "",
}: WordmarkProps) {
  return (
    <span
      className={`rs-wordmark ${className}`}
      data-variant={variant}
      aria-label="RiskSent"
    >
      <span className="rs-wordmark-risk">RISK</span>
      <span className="rs-wordmark-sep" aria-hidden>
        /
      </span>
      <span className="rs-wordmark-sent">SENT</span>
    </span>
  );
}

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Kept for API compatibility; asset è in cache. */
  priority?: boolean;
  alt?: string;
  /** Live = indigo/cyan; mock = violet (demo chrome). */
  variant?: Variant;
  /**
   * "tile" = pannello con angolo tenue + ring; "bare" = solo mark
   */
  treatment?: "tile" | "bare";
};

/**
 * RiskSent logo mark (R stilizzata, PNG con sfondo trasparente). Sidebar, topbar, mock shell.
 */
export function BrandLogo({
  size = 48,
  className = "",
  priority: _priority = false,
  alt = "RiskSent",
  variant = "live",
  treatment = "tile",
}: LogoMarkProps) {
  const mark = <RiskSentLogoMark size={size} variant={variant} aria-hidden />;

  if (treatment === "bare") {
    return (
      <span
        className={`rs-logo-bare relative inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm ring-1 ring-white/[0.1] ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(128deg, rgba(99,102,241,0.14) 0%, rgba(12,10,20,0.4) 42%, #0b0b14 100%)",
      }}
      aria-label={alt}
    >
      <span className="flex h-full w-full items-center justify-center p-[2px]">{mark}</span>
    </span>
  );
}

type BrandLockupProps = {
  variant?: Variant;
  /** Font size preset for the wordmark. */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** If true, render the logo image alongside the wordmark. */
  withLogo?: boolean;
  logoSize?: number;
  hideDot?: boolean;
  shine?: boolean;
};

const WORDMARK_SIZE: Record<NonNullable<BrandLockupProps["size"]>, string> = {
  sm: "text-[15px]",
  md: "text-[17px]",
  lg: "text-[20px]",
};

/**
 * Combined logo + wordmark used in sidebars / drawer headers.
 */
export function BrandLockup({
  variant = "live",
  size = "md",
  className = "",
  withLogo = true,
  logoSize = 48,
  hideDot = false,
  shine = true,
}: BrandLockupProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {withLogo && <BrandLogo size={logoSize} variant={variant} />}
      <BrandWordmark
        variant={variant}
        className={WORDMARK_SIZE[size]}
        hideDot={hideDot}
        shine={shine}
      />
    </span>
  );
}
