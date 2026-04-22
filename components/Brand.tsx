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
  /** Kept for API compatibility; SVG loads instantly. */
  priority?: boolean;
  alt?: string;
  /** Live = indigo/cyan; mock = violet (demo chrome). */
  variant?: Variant;
  /**
   * "tile" = rounded tile + ring; "bare" = mark + soft indigo glow on dark UIs
   */
  treatment?: "tile" | "bare";
};

/**
 * RiskSent logo mark (vector “R”). Sidebar, topbar, mock shell.
 */
export function BrandLogo({
  size = 28,
  className = "",
  priority: _priority = false,
  alt = "RiskSent",
  variant = "live",
  treatment = "tile",
}: LogoMarkProps) {
  const mark = <RiskSentLogoMark size={size} variant={variant} aria-hidden />;

  const glow =
    variant === "mock"
      ? "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)"
      : "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)";

  if (treatment === "bare") {
    return (
      <span
        className={`rs-logo-bare relative inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        <span
          className="absolute inset-0 -z-10 scale-110 opacity-35 blur-md"
          style={{ background: glow }}
          aria-hidden
        />
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/[0.08] ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(120% 120% at 10% 10%, rgba(99,102,241,0.1), transparent 55%), #0b0b14",
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
  logoSize = 30,
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
