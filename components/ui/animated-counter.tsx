"use client";

/**
 * AnimatedCounter — counts from 0 to `to` when it enters the viewport.
 * Formats output with optional prefix/suffix (e.g. "+12.4%", "< 1s", "24/7").
 */

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  /** Target numeric value */
  to: number;
  /** Duration in ms (default 1200) */
  duration?: number;
  /** Text before the number (e.g. "+") */
  prefix?: string;
  /** Text after the number (e.g. "%") */
  suffix?: string;
  /** Decimal places (default 0) */
  decimals?: number;
  /** CSS class for the wrapper span */
  className?: string;
  /** Override rendered text entirely once done (e.g. "< 1s") */
  staticLabel?: string;
  /** Tailwind/inline color for text-shadow glow */
  glowColor?: string;
}

export default function AnimatedCounter({
  to,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  staticLabel,
  glowColor,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;

    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * to);
      if (progress < 1) requestAnimationFrame(step);
      else setValue(to);
    };
    requestAnimationFrame(step);
  }, [triggered, to, duration]);

  const display = staticLabel && triggered
    ? staticLabel
    : `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <span
      ref={ref}
      className={className}
      style={
        glowColor && triggered
          ? { textShadow: `0 0 30px ${glowColor}80` }
          : undefined
      }
    >
      {display}
    </span>
  );
}
