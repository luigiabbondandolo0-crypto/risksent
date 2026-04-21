import Image from "next/image";

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
  priority?: boolean;
  alt?: string;
  /**
   * Visual treatment:
   * - "tile": logo sits inside a subtle rounded tile with ring (compact, chrome-like)
   * - "bare": transparent, no chrome — pairs the logo with a soft teal halo so it
   *   still reads well against dark backgrounds. Use this when the logo is the
   *   only brand element shown.
   */
  treatment?: "tile" | "bare";
};

/**
 * RiskSent logo mark (the stylized "R"). Used in the sidebar and
 * anywhere a compact square logo fits better than the wordmark.
 */
export function BrandLogo({
  size = 28,
  className = "",
  priority = false,
  alt = "RiskSent",
  treatment = "tile",
}: LogoMarkProps) {
  if (treatment === "bare") {
    return (
      <span
        className={`rs-logo-bare relative inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt={alt}
          width={size}
          height={size}
          priority={priority}
          className="relative h-full w-full object-contain"
        />
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
          "radial-gradient(120% 120% at 10% 10%, rgba(255,255,255,0.08), transparent 55%), #0b0f12",
      }}
    >
      <Image
        src="/logo.png"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain"
      />
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
      {withLogo && <BrandLogo size={logoSize} />}
      <BrandWordmark
        variant={variant}
        className={WORDMARK_SIZE[size]}
        hideDot={hideDot}
        shine={shine}
      />
    </span>
  );
}
