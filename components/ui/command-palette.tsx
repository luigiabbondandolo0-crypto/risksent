"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  BarChart2,
  BookOpen,
  ShieldAlert,
  Bell,
  Brain,
  Home,
  CreditCard,
  LayoutDashboard,
  LogIn,
  ArrowRight,
  FileText,
  Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string[];
}

// ── Command registry ─────────────────────────────────────────────────────────
const COMMANDS: CommandItem[] = [
  // Marketing
  { id: "home",        label: "Home",          description: "Landing page",         icon: Home,          href: "/",              group: "Pages",    keywords: ["landing"] },
  { id: "backtest",    label: "Backtesting",   description: "Strategy validation",  icon: BarChart2,     href: "/backtest",       group: "Pages",    keywords: ["strategy","test"] },
  { id: "journal",     label: "Journaling",    description: "Trade log & patterns", icon: BookOpen,      href: "/journaling",     group: "Pages",    keywords: ["log","trades"] },
  { id: "risk",        label: "Risk Manager",  description: "Hard-block protection",icon: ShieldAlert,   href: "/risk-manager",   group: "Pages",    keywords: ["risk","block","alert"] },
  { id: "alerts",      label: "Live Alerts",   description: "Telegram notifications",icon: Bell,         href: "/live-alerts",    group: "Pages",    keywords: ["telegram","notify"] },
  { id: "ai-coach",    label: "AI Coach",      description: "Your trading edge",    icon: Brain,         href: "/ai-coach",       group: "Pages",    keywords: ["ai","coach","edge"] },
  { id: "pricing",     label: "Pricing",       description: "Plans & billing",      icon: CreditCard,    href: "/pricing",        group: "Pages",    keywords: ["plan","billing","subscription"] },
  { id: "changelog",   label: "Changelog",     description: "What's new",           icon: FileText,      href: "/changelog",      group: "Pages",    keywords: ["release","update","new","version"] },
  // Demo
  { id: "demo",        label: "Live Demo",     description: "Explore the mock app", icon: LayoutDashboard, href: "/mock/dashboard", group: "Actions", keywords: ["demo","preview"] },
  { id: "signup",      label: "Start for free",description: "Create account",       icon: Zap,           href: "/signup",          group: "Actions", keywords: ["register","account","free"] },
  { id: "login",       label: "Log in",        description: "Sign in to dashboard", icon: LogIn,         href: "/login",           group: "Actions", keywords: ["sign","signin"] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function filterCommands(query: string): CommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return COMMANDS;
  return COMMANDS.filter((c) => {
    const haystack = [c.label, c.description ?? "", ...(c.keywords ?? [])].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function groupBy<T>(arr: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return Array.from(map.entries());
}

// ── Component ────────────────────────────────────────────────────────────────
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = filterCommands(query);
  const grouped = groupBy(filtered, (c) => c.group);
  // Flat list for keyboard nav
  const flat = grouped.flatMap(([, items]) => items);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Keep active item in view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const execute = useCallback(
    (item: CommandItem) => {
      onClose();
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [onClose, router]
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[activeIdx]) {
      execute(flat[activeIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Reset activeIdx on query change
  const handleQuery = (val: string) => {
    setQuery(val);
    setActiveIdx(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="fixed left-1/2 top-[18vh] z-[301] w-full max-w-lg -translate-x-1/2"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "rgba(10,10,20,0.96)",
                borderColor: "rgba(99,102,241,0.3)",
                backdropFilter: "blur(32px)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* Search bar */}
              <div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button onClick={() => handleQuery("")} className="text-slate-600 hover:text-slate-300 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600 sm:block">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
                {flat.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-600">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  grouped.map(([group, items]) => {
                    let globalOffset = 0;
                    grouped.forEach(([g, its]) => {
                      if (g === group) return;
                      const idx = grouped.findIndex(([gg]) => gg === g);
                      const grpIdx = grouped.findIndex(([gg]) => gg === group);
                      if (idx < grpIdx) globalOffset += its.length;
                    });

                    return (
                      <div key={group}>
                        <div className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                          {group}
                        </div>
                        {items.map((item, localIdx) => {
                          const idx = flat.indexOf(item);
                          const isActive = idx === activeIdx;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              data-idx={idx}
                              onClick={() => execute(item)}
                              onMouseEnter={() => setActiveIdx(idx)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100"
                              style={{
                                background: isActive ? "rgba(99,102,241,0.14)" : "transparent",
                                borderLeft: isActive ? "2px solid #6366F1" : "2px solid transparent",
                              }}
                            >
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                                style={{
                                  background: isActive ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                                  borderColor: isActive ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)",
                                }}
                              >
                                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? "#6366F1" : "#64748b" }} />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-slate-200 truncate">{item.label}</span>
                                {item.description && (
                                  <span className="block text-[11px] text-slate-500 truncate">{item.description}</span>
                                )}
                              </span>
                              {isActive && (
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div
                className="flex items-center gap-4 border-t px-4 py-2.5 text-[10px] text-slate-600"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <span><kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">↑↓</kbd> navigate</span>
                <span><kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">↵</kbd> open</span>
                <span><kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">esc</kbd> close</span>
                <span className="ml-auto opacity-50">⌘K</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Hook: registers ⌘K / Ctrl+K globally ─────────────────────────────────────
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
