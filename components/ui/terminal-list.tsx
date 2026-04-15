"use client";

/**
 * TerminalList — items "type in" one-by-one when the container enters the viewport.
 * Each item is prefixed with a terminal prompt character.
 */

import { useEffect, useRef, useState } from "react";

interface TerminalItem {
  text: string;
  /** Optional accent color for the prompt/value (hex) */
  accent?: string;
  /** Optional right-side value label */
  value?: string;
}

interface TerminalListProps {
  items: TerminalItem[];
  /** Delay between items appearing in ms (default 120) */
  stagger?: number;
  /** Prompt character (default "›") */
  prompt?: string;
  className?: string;
  accentColor?: string;
}

export default function TerminalList({
  items,
  stagger = 120,
  prompt = "›",
  className = "",
  accentColor = "#22d3ee",
}: TerminalListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    let count = 0;
    const id = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= items.length) clearInterval(id);
    }, stagger);
    return () => clearInterval(id);
  }, [triggered, items.length, stagger]);

  return (
    <div
      ref={containerRef}
      className={`font-mono text-sm leading-relaxed ${className}`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 py-2 border-b transition-all duration-300"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "translateX(0)" : "translateX(-12px)",
            transition: `opacity 0.3s ease ${i * 20}ms, transform 0.3s ease ${i * 20}ms`,
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: accentColor, opacity: 0.8 }}>{prompt}</span>
            <span className="text-slate-300">{item.text}</span>
          </div>
          {item.value && (
            <span
              className="text-xs tabular-nums shrink-0"
              style={{ color: item.accent ?? accentColor }}
            >
              {item.value}
            </span>
          )}
        </div>
      ))}
      {/* Blinking cursor on last visible item */}
      {triggered && visibleCount < items.length && (
        <div className="flex items-center gap-3 py-2">
          <span style={{ color: accentColor, opacity: 0.8 }}>{prompt}</span>
          <span
            className="inline-block w-2 h-4 align-middle animate-cursor-blink"
            style={{
              background: accentColor,
              animation: "cursor-blink 1s step-end infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}
