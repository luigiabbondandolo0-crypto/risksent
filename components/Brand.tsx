import Image from "next/image";

type Variant = "live" | "mock";

type WordmarkProps = {
  /** Visual tone — live uses red/orange, mock uses violet. */
  variant?: Variant;
  /** Extra classes applied to the outer span (controls font size, etc.). */
  className?: string;
  /** Hide the pulsing risk dot (useful on very tight spaces). */
  hideDot?: boolean;
  /** Apply the diagonal highlight sweep. */
  shine?: boolean;
};

/**
 * Animated RISKSENT wordmark used in the topbar / mobile drawer.
 *
 * - "RISK" flows through a red → orange gradient (violet in mock)
 * - "SENT" is a clean white/silver gradient for contrast
 * - Small pulsing dot evokes a live risk heartbeat
 * - Optional periodic shine sweep across the letters
 *
 * Animations respect `prefers-reduced-motion` via globals.css.
 */
export function BrandWordmark({
  variant = "live",
  className = "",
  hideDot = false,
  shine = true,
}: WordmarkProps) {
  return (
    <span
      className={`rs-wordmark ${shine ? "rs-wordmark-shine" : ""} ${className}`}
      data-variant={variant}
      aria-label="RiskSent"
    >
      <span className="rs-wordmark-risk">RISK</span>
      <span className="rs-wordmark-sent">SENT</span>
      {!hideDot && <span className="rs-wordmark-dot" aria-hidden />}
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
