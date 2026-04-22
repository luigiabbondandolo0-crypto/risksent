"use client";

import { useReducedMotion } from "framer-motion";

type Variant = "live" | "mock";

type Props = {
  size?: number;
  className?: string;
  variant?: Variant;
  "aria-hidden"?: boolean;
  title?: string;
};

const MARK_SRC = "/brand/risk-sent-r.png";

/**
 * R stilizzata (PNG, sfondo rimosso). Luccichio leggero sulla silhouette (vedi globals.css).
 */
export function RiskSentLogoMark({
  size = 38,
  className = "",
  variant = "live",
  "aria-hidden": ariaHidden = true,
  title = "RiskSent",
}: Props) {
  const reduce = useReducedMotion();

  return (
    <div
      className={`rs-logo-r-stack rs-logo-mark-svg relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : title}
    >
      {!ariaHidden ? <span className="sr-only">{title}</span> : null}
      <img
        src={MARK_SRC}
        width={size}
        height={size}
        alt=""
        draggable={false}
        data-variant={variant}
        className="rs-logo-r-img h-full w-full object-contain"
      />
      {!reduce ? (
        <span className="rs-logo-r-shine" aria-hidden>
          <span className="rs-logo-r-shine-bar" />
        </span>
      ) : null}
    </div>
  );
}
