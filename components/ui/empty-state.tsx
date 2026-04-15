"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  accentColor?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accentColor = "#6366F1",
  size = "md",
}: EmptyStateProps) {
  const sizeMap = {
    sm: { icon: "h-8 w-8", pad: "py-10", title: "text-base", desc: "text-xs" },
    md: { icon: "h-10 w-10", pad: "py-16", title: "text-lg", desc: "text-sm" },
    lg: { icon: "h-14 w-14", pad: "py-24", title: "text-2xl", desc: "text-base" },
  };
  const sz = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center text-center ${sz.pad} px-6`}
    >
      {/* Animated icon ring */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
        className="relative mb-5"
      >
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: `${accentColor}20`, transform: "scale(1.8)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center rounded-2xl border p-4"
          style={{
            background: `${accentColor}12`,
            borderColor: `${accentColor}30`,
          }}
        >
          <Icon
            className={sz.icon}
            style={{ color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor}60)` }}
          />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className={`font-bold text-slate-100 tracking-tight mb-2 ${sz.title}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
        className={`text-slate-500 max-w-xs leading-relaxed ${sz.desc}`}
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.44 }}
          className="mt-6"
        >
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                boxShadow: `0 0 24px ${accentColor}40`,
              }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                boxShadow: `0 0 24px ${accentColor}40`,
              }}
            >
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
