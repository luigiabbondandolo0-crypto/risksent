"use client";

/**
 * ScanCard — glassmorphism card with a horizontal scan-line sweep on hover.
 * The sweep is driven by the CSS .scan-card class defined in globals.css.
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface ScanCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Accent color for the hover radial glow (CSS color string) */
  accentColor?: string;
  /** Glow position: "tl" | "tr" | "bl" | "br" | "center" (default "tl") */
  glowPosition?: "tl" | "tr" | "bl" | "br" | "center";
  /** Whether to show an animated gradient border on hover */
  animatedBorder?: boolean;
  className?: string;
}

const glowOriginMap = {
  tl: "0% 0%",
  tr: "100% 0%",
  bl: "0% 100%",
  br: "100% 100%",
  center: "50% 50%",
};

export default function ScanCard({
  children,
  accentColor = "#ff3c3c",
  glowPosition = "tl",
  animatedBorder = false,
  className = "",
  style,
  ...motionProps
}: ScanCardProps) {
  const glowOrigin = glowOriginMap[glowPosition];

  return (
    <motion.div
      className={`scan-card group relative overflow-hidden rounded-2xl ${animatedBorder ? "animated-border" : ""} ${className}`}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        cursor: "pointer",
        ...style,
      }}
      {...motionProps}
    >
      {/* Radial accent glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at ${glowOrigin}, ${accentColor}12 0%, transparent 65%)`,
        }}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
