"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";

/* ─── Glitch text that corrupts then resolves ─── */
const GLITCH_CHARS = "!@#$%^&*<>?/|\\~`";
function useGlitch(target: string, active: boolean) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    let frame = 0;
    const total = 18;
    const id = setInterval(() => {
      frame++;
      if (frame >= total) { setDisplay(target); clearInterval(id); return; }
      setDisplay(
        target
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            const progress = frame / total;
            const threshold = i / target.length;
            if (progress > threshold) return ch;
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]!;
          })
          .join("")
      );
    }, 40);
    return () => clearInterval(id);
  }, [active, target]);
  return display;
}

/* ─── Scan line overlay ─── */
function ScanLines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.7) 2px, rgba(255,255,255,0.7) 4px)",
        backgroundSize: "100% 4px",
      }}
    />
  );
}

/* ─── Floating particle ─── */
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute h-[2px] w-[2px] rounded-full bg-red-500 pointer-events-none"
      style={style}
      animate={{ y: [-10, -80], opacity: [0.7, 0] }}
      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3, ease: "linear" }}
    />
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  left: `${4 + (i * 4) % 92}%`,
  top: `${30 + (i * 7) % 55}%`,
  background: i % 3 === 0 ? "#ff3c3c" : i % 3 === 1 ? "#ff8c00" : "rgba(255,255,255,0.4)",
}));

export default function NotFound() {
  const [glitchActive, setGlitchActive] = useState(false);
  const errorText = useGlitch("404", glitchActive);
  const subText = useGlitch("PAGE NOT FOUND", glitchActive);

  /* Trigger glitch periodically */
  useEffect(() => {
    const fire = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 800);
    };
    fire();
    const id = setInterval(fire, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: "#080809" }}
    >
      <ScanLines />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255,60,60,0.07) 0%, transparent 70%)" }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} style={{ left: p.left, top: p.top, background: p.background }} />
      ))}

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        {/* Big 404 */}
        <div className="relative mb-2 select-none">
          {/* Shadow copy for glitch depth */}
          <span
            className="absolute inset-0 select-none font-black"
            aria-hidden
            style={{
              fontSize: "clamp(120px, 22vw, 220px)",
              lineHeight: 1,
              fontFamily: "var(--font-display)",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,60,60,0.25)",
              transform: "translate(3px, 3px)",
            }}
          >
            {errorText}
          </span>
          <motion.span
            className="relative block font-black"
            style={{
              fontSize: "clamp(120px, 22vw, 220px)",
              lineHeight: 1,
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, #ff3c3c 0%, #ff8c00 50%, #ff3c3c 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            {errorText}
          </motion.span>
        </div>

        {/* Subtitle with glitch */}
        <motion.p
          className="mb-2 font-mono text-[13px] font-bold tracking-[0.35em]"
          style={{ color: "#ff3c3c" }}
          animate={{ opacity: glitchActive ? [1, 0.4, 1, 0.6, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {subText}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mb-8 h-px w-32"
          style={{ background: "linear-gradient(90deg, transparent, #ff3c3c, transparent)" }}
        />

        <p className="mb-8 text-sm text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          This route doesn&apos;t exist. Maybe it was moved, deleted,<br className="hidden sm:block" />
          or you followed a broken link.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 28px rgba(255,60,60,0.2)" }}
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </motion.div>

      {/* Bottom brand */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-xs font-mono text-slate-700"
      >
        RISKSENT · ERROR 404
      </motion.p>
    </div>
  );
}
