"use client";

import { useId } from "react";

type Variant = "live" | "mock";

type Props = {
  size?: number;
  className?: string;
  variant?: Variant;
  "aria-hidden"?: boolean;
  title?: string;
};

/**
 * Geometric “R” mark: stem, bowl with inner counter, diagonal leg.
 * Live: indigo → violet → cyan. Mock: purple → soft violet.
 */
export function RiskSentLogoMark({
  size = 32,
  className = "",
  variant = "live",
  "aria-hidden": ariaHidden = true,
  title = "RiskSent",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const gradId = `rs-lm-${uid}`;

  // Even-odd: outer R + inner bowl hole (coordinates in 32×32)
  const d =
    "M5 3 L5 29 L9 29 L9 20 L12 20 L21 29 L26 29 L17 17 C22.5 16.2 25 12 25 7 C25 3.5 21 3 10 3 L5 3 Z " +
    "M9.5 6.5 L15.5 6.5 C18.5 6.5 20.5 7.8 20.5 10.2 C20.5 12.5 18.5 13.5 15.5 13.5 L9.5 13.5 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden={ariaHidden}
      role="img"
    >
      {title && !ariaHidden ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradId}
          x1="2"
          y1="30"
          x2="30"
          y2="2"
          gradientUnits="userSpaceOnUse"
        >
          {variant === "mock" ? (
            <>
              <stop stopColor="#5b21b6" />
              <stop offset="0.5" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#c4b5fd" />
            </>
          ) : (
            <>
              <stop stopColor="#312e81" />
              <stop offset="0.28" stopColor="#6366f1" />
              <stop offset="0.72" stopColor="#818cf8" />
              <stop offset="1" stopColor="#22d3ee" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        fillRule="evenodd"
        clipRule="evenodd"
        d={d}
      />
    </svg>
  );
}
