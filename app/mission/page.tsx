"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Brain,
  Compass,
  Flame,
  Heart,
  LineChart,
  Scale,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────────────────── */
/* Content                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Risk is a craft",
    body: "Returns get the applause, risk pays the bill. We build every feature around one question: does this help you survive long enough to compound?",
    accent: "#ff3c3c",
  },
  {
    icon: Scale,
    title: "Discipline beats prediction",
    body: "Nobody can call every move. But anyone can follow rules. RiskSent turns good intentions into enforced behaviour — before the heat of the moment.",
    accent: "#ff8c00",
  },
  {
    icon: Brain,
    title: "The edge is in the review",
    body: "Most traders trade a lot and review nothing. We make reviewing as fast as trading — so your next session starts where your last one ended.",
    accent: "#ffb347",
  },
  {
    icon: Compass,
    title: "One platform, zero chaos",
    body: "Backtest, journal, monitor and coach — in one place, with your data. No more 7 tabs, 3 spreadsheets and a broken Zapier.",
    accent: "#ff6b6b",
  },
];

const STATS = [
  { value: 92, suffix: "%", label: "of retail traders blow up on risk, not entries" },
  { value: 7, suffix: "×", label: "faster post-session review vs. manual spreadsheets" },
  { value: 24, suffix: "/7", label: "risk rules enforced with live alerts" },
  { value: 1, suffix: "", label: "subscription — everything included" },
];

const STORY = [
  {
    year: "The breaking point",
    title: "Too many tabs, not enough discipline.",
    body: "We were traders before we were builders. TradingView in one tab, Excel in another, Telegram bots, broker dashboards, MetaTrader, ChatGPT prompts — and at the end of the month, no idea why we were up or down.",
  },
  {
    year: "The insight",
    title: "The problem wasn’t the strategy. It was the system.",
    body: "Every trader we respected had the same habit: a brutal, honest review loop. They knew their numbers, their tilts, their setups that worked. The tooling to do that didn’t exist in one place — so we built it.",
  },
  {
    year: "The bet",
    title: "Backtest, journal, risk — as one product.",
    body: "Splitting them across tools was the original sin. RiskSent unifies them: your strategy, your trades and your rules share the same data and the same language. The loop closes on itself.",
  },
  {
    year: "Today",
    title: "A platform for disciplined traders.",
    body: "RiskSent exists to make the boring, compounding habits of professional trading — plan, execute, review, adjust — feel inevitable. You bring the edge. We make sure you live long enough to use it.",
  },
];

const PROMISES = [
  {
    icon: Heart,
    title: "We trade the product.",
    body: "We use RiskSent on our own accounts, every day. If it’s not good enough for us, it never ships.",
  },
  {
    icon: Zap,
    title: "Ship weekly.",
    body: "Every Friday you get something new — a feature, an integration, a fix. No 6-month roadmap vapor.",
  },
  {
    icon: Target,
    title: "No dark patterns.",
    body: "No fake scarcity, no hidden upgrades, no gamified losses. Cancel in one click. Your data exports in one click.",
  },
  {
    icon: Timer,
    title: "Your time > our vanity metrics.",
    body: "Every screen has to answer one question in under 5 seconds. If it doesn’t, we redesign it.",
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Little animated helpers                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function AnimatedNumber({
  to,
  suffix,
  duration = 2,
}: {
  to: number;
  suffix: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!inView || !numRef.current) return;
    let raf = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.floor(eased * to);
      if (numRef.current) numRef.current.textContent = String(v);
      if (t < 1) raf = requestAnimationFrame(animate);
      else if (numRef.current) numRef.current.textContent = String(to);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="inline-flex items-baseline">
      <span ref={numRef}>0</span>
      <span>{suffix}</span>
    </span>
  );
}

function ScrambleText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const chars = "!<>-_\\/[]{}—=+*^?#_abcdefghijklmnopqrstuvwxyz";
    const target = text;
    const el = ref.current;
    let frame = 0;
    const total = 28;
    const length = target.length;

    const tick = () => {
      let out = "";
      for (let i = 0; i < length; i++) {
        const reveal = (frame - delay * 60) / total;
        if (i < reveal * length) {
          out += target[i];
        } else if (i < (reveal + 0.15) * length) {
          out += chars[Math.floor(Math.random() * chars.length)];
        } else {
          out += " ";
        }
      }
      el.textContent = out;
      frame++;
      if (frame < total + length * 1.5 + delay * 60) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(tick);
  }, [inView, text, delay]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Page                                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

export default function MissionPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Scroll progress bar
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const bar = document.getElementById("mission-progress");
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
        },
      });

      // Hero words stagger
      gsap.from(".mission-hero-word", {
        yPercent: 110,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: "expo.out",
        delay: 0.15,
      });

      gsap.from(".mission-hero-sub", {
        opacity: 0,
        y: 20,
        duration: 0.9,
        delay: 0.9,
        ease: "power3.out",
      });

      // Parallax for hero
      gsap.to(".mission-hero-inner", {
        y: -80,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: ".mission-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Pillars reveal
      gsap.utils.toArray<HTMLElement>(".pillar-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: "power3.out",
          delay: i * 0.08,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        });
      });

      // Story timeline line grow
      gsap.from(".story-line", {
        scaleY: 0,
        transformOrigin: "top",
        ease: "none",
        scrollTrigger: {
          trigger: ".story-section",
          start: "top 70%",
          end: "bottom 70%",
          scrub: 0.6,
        },
      });

      // Story items pop
      gsap.utils.toArray<HTMLElement>(".story-item").forEach((item, i) => {
        gsap.from(item, {
          opacity: 0,
          x: i % 2 === 0 ? -30 : 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 80%" },
        });
      });

      // Promises
      gsap.utils.toArray<HTMLElement>(".promise-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          delay: i * 0.05,
          scrollTrigger: { trigger: card, start: "top 88%" },
        });
      });

      // CTA glow float
      gsap.to(".cta-glow", {
        scale: 1.06,
        opacity: 0.9,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ background: "#070710" }}
    >
      {/* Scroll progress */}
      <div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left"
        id="mission-progress"
        style={{
          transform: "scaleX(0)",
          background: "linear-gradient(90deg, #ff3c3c, #ff8c00)",
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "radial-gradient(900px 500px at 50% 0%, rgba(255,60,60,0.18), transparent 60%), radial-gradient(600px 400px at 80% 10%, rgba(255,140,0,0.1), transparent 60%)",
        }}
      />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="mission-hero relative px-6 pb-24 pt-32 lg:px-16 lg:pt-40">
        <div className="mission-hero-inner mx-auto max-w-5xl">
          <p className="mb-6 text-[11px] font-mono uppercase tracking-[0.28em] text-[#ff8c00]">
            ── Our Mission ──
          </p>

          <h1
            className="text-5xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[88px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block overflow-hidden">
              <span className="mission-hero-word inline-block">Make</span>{" "}
              <span className="mission-hero-word inline-block">discipline</span>
            </span>
            <span className="block overflow-hidden">
              <span
                className="mission-hero-word inline-block"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #ff3c3c 0%, #ff8c00 60%, #ffb347 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                inevitable.
              </span>
            </span>
          </h1>

          <p className="mission-hero-sub mt-10 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            We’re building the trading platform we wish existed when we were
            getting wiped out by our own decisions. One home for your
            strategies, your trades and your rules — so the next move is
            always the right one for the trader you want to become.
          </p>

          <div className="mission-hero-sub mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                boxShadow: "0 14px 36px -14px rgba(255,60,60,0.6)",
              }}
            >
              Start your free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/mock/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              See it live
            </Link>
          </div>
        </div>

        {/* Floating chart-ish accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-10 top-40 hidden h-40 w-56 rotate-[6deg] rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm lg:block"
          style={{ boxShadow: "0 20px 60px -20px rgba(255,60,60,0.35)" }}
        >
          <div className="flex items-center gap-1.5 px-3 pt-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3c3c]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8c00]" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <svg viewBox="0 0 200 120" className="h-[85%] w-full" aria-hidden>
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff3c3c" />
                <stop offset="100%" stopColor="#ff8c00" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0,90 L20,86 L40,92 L60,70 L80,76 L100,52 L120,58 L140,40 L160,46 L180,28 L200,34"
              fill="none"
              stroke="url(#spark)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, ease: "easeOut", delay: 0.6 }}
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════ MANIFESTO TICKER ═══════════════════ */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.01] py-6">
        <div className="flex animate-[mission-marquee_30s_linear_infinite] gap-10 whitespace-nowrap text-[13px] font-mono uppercase tracking-[0.24em] text-slate-500">
          {Array.from({ length: 4 }).flatMap((_, block) =>
            [
              "Plan the trade",
              "Trade the plan",
              "Risk first, always",
              "Review > predict",
              "Your edge is your process",
              "Survive, then compound",
            ].map((phrase, i) => (
              <span
                key={`${block}-${i}`}
                className="inline-flex items-center gap-10"
              >
                <span>{phrase}</span>
                <span className="text-[#ff8c00]">◆</span>
              </span>
            )),
          )}
        </div>
        <style jsx>{`
          @keyframes mission-marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="relative px-6 py-24 lg:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative rounded-2xl border p-5 sm:p-6"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,140,0,0.45), transparent)",
                }}
              />
              <div
                className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <AnimatedNumber to={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ MANIFESTO / PILLARS ═══════════════════ */}
      <section className="relative px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-3xl">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#ff8c00]">
              Manifesto
            </p>
            <h2
              className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <ScrambleText text="Four beliefs that shape every pixel we ship." />
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="pillar-card group relative overflow-hidden rounded-3xl border p-7 transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60"
                  style={{ background: accent }}
                />
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: `${accent}55`,
                    background: `linear-gradient(135deg, ${accent}22, ${accent}0D)`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <h3
                  className="text-2xl font-bold tracking-tight text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-slate-400">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STORY TIMELINE ═══════════════════ */}
      <section className="story-section relative px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#ff8c00]">
              Origin
            </p>
            <h2
              className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How RiskSent started.
            </h2>
          </div>

          <div className="relative pl-12">
            <div
              aria-hidden
              className="story-line absolute left-4 top-2 h-full w-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, #ff3c3c, #ff8c00, transparent)",
              }}
            />
            <ol className="space-y-10">
              {STORY.map((s, i) => (
                <li key={s.year} className="story-item relative">
                  <span
                    aria-hidden
                    className="absolute -left-[38px] top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[#070710]"
                    style={{
                      borderColor: "#ff8c00",
                      boxShadow: "0 0 24px -4px rgba(255,140,0,0.6)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                      }}
                    />
                  </span>
                  <p className="mb-1 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">
                    {s.year} · {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PROMISES ═══════════════════ */}
      <section className="relative px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-3xl">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#ff8c00]">
              Promises
            </p>
            <h2
              className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What you can expect from us.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="promise-card flex items-start gap-5 rounded-2xl border p-6"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "rgba(255,60,60,0.35)",
                    background:
                      "linear-gradient(135deg, rgba(255,60,60,0.12), rgba(255,140,0,0.08))",
                  }}
                >
                  <Icon className="h-5 w-5 text-[#ff8c00]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-slate-400">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BIG QUOTE ═══════════════════ */}
      <section className="relative px-6 py-32 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <Flame
            className="mx-auto mb-6 h-8 w-8 text-[#ff8c00]"
            strokeWidth={2}
          />
          <blockquote
            className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-slate-600">“</span>
            The market doesn’t reward the smartest trader.{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #ff3c3c, #ff8c00, #ffb347)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              It rewards the most consistent one.
            </span>
            <span className="text-slate-600">”</span>
          </blockquote>
          <p className="mt-6 text-[12px] font-mono uppercase tracking-[0.22em] text-slate-500">
            — The RiskSent team
          </p>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="relative px-6 pb-32 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div
            className="relative overflow-hidden rounded-[32px] border px-8 py-16 text-center sm:px-16"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(255,60,60,0.08), rgba(255,140,0,0.05))",
            }}
          >
            <div
              aria-hidden
              className="cta-glow pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,60,60,0.35), transparent 60%)",
              }}
            />
            <div
              aria-hidden
              className="cta-glow pointer-events-none absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,140,0,0.3), transparent 60%)",
              }}
            />

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-300">
                <TrendingUp className="h-3 w-3 text-[#ff8c00]" />
                Built for disciplined traders
              </div>

              <h2
                className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                The edge you’ve been looking for
                <br />
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #ff3c3c, #ff8c00, #ffb347)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  was never a new indicator.
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                It’s the system around the trader. We built it. Come use it.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                    boxShadow: "0 18px 46px -14px rgba(255,60,60,0.65)",
                  }}
                >
                  Start your 14-day trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-[15px] font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <LineChart className="h-4 w-4" />
                  Explore the demo
                </Link>
              </div>

              <p className="mt-8 text-[12px] font-mono text-slate-500">
                No card required · cancel in one click · export your data any
                time
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
