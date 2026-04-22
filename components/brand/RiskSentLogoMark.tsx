"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Variant = "live" | "mock";

type Props = {
  size?: number;
  className?: string;
  variant?: Variant;
  "aria-hidden"?: boolean;
  title?: string;
};

/**
 * Angular R + sottile “/” (richiamo al wordmark). Niente ciotole tonde: spigoli vivi.
 * Animazione leggera: respiro verticale + luce sull’accento — rispetta prefers-reduced-motion.
 */
export function RiskSentLogoMark({
  size = 32,
  className = "",
  variant = "live",
  "aria-hidden": ariaHidden = true,
  title = "RiskSent",
}: Props) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const gradId = `rs-lm-${uid}`;
  const slashId = `rs-slash-${uid}`;

  const rOuter =
    "M4 2 L4 30 L9 30 L9 20.5 L12.5 20.5 L20.5 30 L26 30 L16.5 15.5 L25.5 2 L9 2 L4 6.5 L4 2 Z";
  const rHole = "M10.5 5 L22 5 L16.2 12.8 L10.5 12.8 Z";

  // Slash fine a destra, non sovrapposto alla gamba
  const slashD = "M25.2 1.2 L26.3 1.2 L14.2 32 L13 32 Z";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`rs-logo-mark-svg ${className}`}
      aria-hidden={ariaHidden}
      role="img"
      initial={false}
      animate={reduce ? undefined : { y: [0, -1, 0] }}
      transition={reduce ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {title && !ariaHidden ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradId} x1="2" y1="32" x2="30" y2="0" gradientUnits="userSpaceOnUse">
          {variant === "mock" ? (
            <>
              <stop stopColor="#5b21b6" offset="0%" />
              <stop stopColor="#a78bfa" offset="0.55" />
              <stop stopColor="#e9d5ff" offset="100%" />
            </>
          ) : (
            <>
              <stop stopColor="#312e81" offset="0%" />
              <stop stopColor="#6366f1" offset="0.4" />
              <stop stopColor="#818cf8" offset="0.72" />
              <stop stopColor="#22d3ee" offset="100%" />
            </>
          )}
        </linearGradient>
        <linearGradient id={slashId} x1="26" y1="0" x2="14" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" stopOpacity="0.95" />
          <stop offset="1" stopColor="#a5b4fc" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <g>
        <path
          fill={`url(#${gradId})`}
          fillRule="evenodd"
          clipRule="evenodd"
          d={`${rOuter} ${rHole}`}
        />
        <motion.path
          d={slashD}
          fill={`url(#${slashId})`}
          initial={false}
          animate={reduce ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
    </motion.svg>
  );
}
