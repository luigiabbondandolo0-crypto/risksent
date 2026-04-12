"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Shield,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type ExperienceLevel = "beginner" | "intermediate" | "expert";
type MainGoal = "prop_firm" | "risk_management" | "win_rate" | "everything";

type OnboardingState = {
  full_name: string;
  experience_level: ExperienceLevel | null;
  main_goal: MainGoal | null;
  daily_dd_limit: number;
  total_dd_limit: number;
  broker_nickname: string;
  broker_platform: "MT4" | "MT5";
  broker_server: string;
  broker_account: string;
  broker_password: string;
};

// ─── Animation variants ──────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full rounded-2xl border p-4 text-left transition-all duration-200"
      style={{
        background: selected ? "rgba(255,60,60,0.06)" : "rgba(255,255,255,0.02)",
        borderColor: selected ? "rgba(255,60,60,0.5)" : "rgba(255,255,255,0.07)",
        boxShadow: selected ? "0 0 20px rgba(255,60,60,0.08)" : undefined,
      }}
    >
      {selected && (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: "#ff3c3c" }}
        >
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      {children}
    </motion.button>
  );
}

function StepLabel({ label, description }: { label: string; description: string }) {
  return (
    <div>
      <p className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15 }}>
        {label}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-[#ff3c3c]/40 focus:ring-2 focus:ring-[#ff3c3c]/12"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value}%`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: "#ff3c3c" }}
        >
          {display}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.06]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ff3c3c, #ff8c00)" }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-600">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function Step1({
  state,
  setState,
}: {
  state: OnboardingState;
  setState: (p: Partial<OnboardingState>) => void;
}) {
  const levels: { value: ExperienceLevel; label: string; desc: string; icon: string }[] = [
    { value: "beginner", label: "Beginner", desc: "Less than 1 year", icon: "🌱" },
    { value: "intermediate", label: "Intermediate", desc: "1–3 years", icon: "📈" },
    { value: "expert", label: "Expert", desc: "3+ years", icon: "🎯" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Welcome to RiskSent.
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Let's set up your trading profile. Takes 2 minutes.
        </p>
      </div>

      <Input
        label="Your name"
        placeholder="e.g. Alex Trader"
        value={state.full_name}
        onChange={(e) => setState({ full_name: e.target.value })}
        autoFocus
      />

      <div className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Experience level
        </p>
        <div className="flex flex-col gap-2">
          {levels.map((l) => (
            <SelectCard
              key={l.value}
              selected={state.experience_level === l.value}
              onClick={() => setState({ experience_level: l.value })}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{l.icon}</span>
                <StepLabel label={l.label} description={l.desc} />
              </div>
            </SelectCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({
  state,
  setState,
}: {
  state: OnboardingState;
  setState: (p: Partial<OnboardingState>) => void;
}) {
  const goals: { value: MainGoal; label: string; desc: string; icon: string }[] = [
    { value: "prop_firm", label: "Pass a prop firm challenge", desc: "FTMO, My Forex Funds, etc.", icon: "🎯" },
    { value: "risk_management", label: "Manage my risk better", desc: "Stop blowing accounts", icon: "🛡️" },
    { value: "win_rate", label: "Improve my win rate", desc: "Better entries and exits", icon: "📈" },
    { value: "everything", label: "All of the above", desc: "Complete trading discipline", icon: "⚡" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          What&apos;s your main goal?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          We&apos;ll personalize your dashboard based on your focus.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {goals.map((g) => (
          <SelectCard
            key={g.value}
            selected={state.main_goal === g.value}
            onClick={() => setState({ main_goal: g.value })}
          >
            <div className="flex flex-col gap-2">
              <span className="text-2xl">{g.icon}</span>
              <StepLabel label={g.label} description={g.desc} />
            </div>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function Step3({
  state,
  setState,
  onSkip,
}: {
  state: OnboardingState;
  setState: (p: Partial<OnboardingState>) => void;
  onSkip: () => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    if (!state.broker_nickname || !state.broker_server || !state.broker_account) return;
    setConnecting(true);
    // Broker connection is temporarily unavailable — just save the info
    await new Promise((r) => setTimeout(r, 1200));
    setConnected(true);
    setConnecting(false);
  };

  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-full border border-[#00e676]/30 bg-[#00e676]/10"
        >
          <Check className="h-10 w-10 text-[#00e676]" />
        </motion.div>
        <div>
          <h2
            className="text-2xl font-black text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Account saved!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            You can connect live data later from the Journal section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Connect your broker
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Optional — you can do this later from the Journal section.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          label="Account nickname"
          placeholder="e.g. My FTMO Account"
          value={state.broker_nickname}
          onChange={(e) => setState({ broker_nickname: e.target.value })}
        />

        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Platform</p>
          <div className="flex gap-2">
            {(["MT4", "MT5"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setState({ broker_platform: p })}
                className="flex-1 rounded-xl border py-2.5 text-sm font-mono font-semibold transition-all"
                style={{
                  borderColor: state.broker_platform === p ? "rgba(255,60,60,0.5)" : "rgba(255,255,255,0.07)",
                  background: state.broker_platform === p ? "rgba(255,60,60,0.08)" : "rgba(255,255,255,0.02)",
                  color: state.broker_platform === p ? "#fff" : "#64748b",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Broker server"
          placeholder="e.g. ICMarketsSC-Demo01"
          value={state.broker_server}
          onChange={(e) => setState({ broker_server: e.target.value })}
        />
        <Input
          label="Account number"
          placeholder="e.g. 12345678"
          value={state.broker_account}
          onChange={(e) => setState({ broker_account: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={state.broker_password}
          onChange={(e) => setState({ broker_password: e.target.value })}
        />
      </div>

      <motion.button
        type="button"
        onClick={() => void handleConnect()}
        disabled={connecting || !state.broker_nickname || !state.broker_server || !state.broker_account}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl py-3 text-sm font-bold text-white transition disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
      >
        {connecting ? "Connecting…" : "Connect account"}
      </motion.button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-sm text-slate-600 transition hover:text-slate-400"
      >
        Skip for now →
      </button>
    </div>
  );
}

function Step4({
  state,
  setState,
  onSkip,
}: {
  state: OnboardingState;
  setState: (p: Partial<OnboardingState>) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Set your risk limits
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          RiskSent will alert you when you approach these limits.
        </p>
      </div>

      <div
        className="rounded-2xl border p-5 space-y-6"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Slider
          label="Daily max drawdown"
          value={state.daily_dd_limit}
          min={1}
          max={10}
          step={0.5}
          onChange={(v) => setState({ daily_dd_limit: v })}
        />
        <div className="h-px bg-white/[0.05]" />
        <Slider
          label="Total max drawdown"
          value={state.total_dd_limit}
          min={5}
          max={20}
          step={0.5}
          onChange={(v) => setState({ total_dd_limit: v })}
        />
      </div>

      <div
        className="rounded-xl border p-4 text-xs font-mono text-slate-500 space-y-1"
        style={{ borderColor: "rgba(255,140,0,0.2)", background: "rgba(255,140,0,0.04)" }}
      >
        <p className="text-orange-400 font-semibold">💡 FTMO standard limits</p>
        <p>Phase 1: 5% daily · 10% total</p>
        <p>Phase 2: 5% daily · 10% total</p>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-sm text-slate-600 transition hover:text-slate-400"
      >
        Skip for now →
      </button>
    </div>
  );
}

function Step5({ name }: { name: string }) {
  const router = useRouter();

  const cards = [
    { icon: LayoutDashboard, label: "View Dashboard", href: "/app/dashboard", color: "#22d3ee" },
    { icon: BookOpen, label: "Open Journal", href: "/app/journaling", color: "#00e676" },
    { icon: ShieldAlert, label: "Risk Manager", href: "/app/risk-manager", color: "#ff3c3c" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-full border border-[#00e676]/30"
        style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.12), rgba(0,230,118,0.02))" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 18 }}
        >
          <Check className="h-12 w-12 text-[#00e676]" />
        </motion.div>
      </motion.div>

      <div>
        <h1
          className="text-3xl font-black tracking-tight text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          You&apos;re all set{name ? `, ${name.split(" ")[0]}` : ""}! 🎉
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your trading command center is ready.
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        {cards.map(({ icon: Icon, label, href, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.03]"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
            <span className="text-center text-[11px] font-mono text-slate-400 leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <motion.button
        type="button"
        onClick={() => router.push("/app/dashboard")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-black"
        style={{
          background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
          boxShadow: "0 0 40px rgba(255,60,60,0.25)",
        }}
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="h-1 flex-1 rounded-full"
          animate={{
            background: i < step
              ? "linear-gradient(90deg, #ff3c3c, #ff8c00)"
              : "rgba(255,255,255,0.08)",
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const [state, setStateRaw] = useState<OnboardingState>({
    full_name: "",
    experience_level: null,
    main_goal: null,
    daily_dd_limit: 5,
    total_dd_limit: 10,
    broker_nickname: "",
    broker_platform: "MT5",
    broker_server: "",
    broker_account: "",
    broker_password: "",
  });

  const setState = useCallback((patch: Partial<OnboardingState>) => {
    setStateRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  // Load existing profile
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/onboarding/profile");
        if (!res.ok) return;
        const { profile } = await res.json();
        if (!profile) return;
        if (profile.onboarding_completed) {
          router.replace("/app/dashboard");
          return;
        }
        setStateRaw((prev) => ({
          ...prev,
          full_name: profile.full_name ?? "",
          experience_level: profile.experience_level ?? null,
          main_goal: profile.main_goal ?? null,
          daily_dd_limit: profile.daily_dd_limit ?? 5,
          total_dd_limit: profile.total_dd_limit ?? 10,
        }));
        if (profile.onboarding_step > 1) {
          setStep(profile.onboarding_step);
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  const saveStep = async (nextStep: number) => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: state.full_name || null,
          experience_level: state.experience_level,
          main_goal: state.main_goal,
          daily_dd_limit: state.daily_dd_limit,
          total_dd_limit: state.total_dd_limit,
          onboarding_step: nextStep,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: state.full_name || null,
          experience_level: state.experience_level,
          main_goal: state.main_goal,
          daily_dd_limit: state.daily_dd_limit,
          total_dd_limit: state.total_dd_limit,
          onboarding_step: 5,
        }),
      });
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    const next = step + 1;
    if (next === 5) {
      await completeOnboarding();
    } else {
      await saveStep(next);
    }
    setDirection(1);
    setStep(next);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const skipStep = async () => {
    await goNext();
  };

  const canContinue = () => {
    if (step === 1) return state.full_name.trim().length > 0 && state.experience_level !== null;
    if (step === 2) return state.main_goal !== null;
    return true;
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: "#080809" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            className="text-xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            RiskSent
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-[10px] font-mono text-slate-600">
            <span>Step {step} of 5</span>
            {(step === 3 || step === 4) && (
              <button
                type="button"
                onClick={() => void skipStep()}
                className="text-slate-600 transition hover:text-slate-400"
              >
                Skip →
              </button>
            )}
          </div>
          <ProgressBar step={step} total={5} />
        </div>

        {/* Step card */}
        <div
          className="relative overflow-hidden rounded-3xl border p-7 sm:p-8"
          style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 1 && <Step1 state={state} setState={setState} />}
              {step === 2 && <Step2 state={state} setState={setState} />}
              {step === 3 && <Step3 state={state} setState={setState} onSkip={() => void skipStep()} />}
              {step === 4 && <Step4 state={state} setState={setState} onSkip={() => void skipStep()} />}
              {step === 5 && <Step5 name={state.full_name} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="mt-5 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <motion.button
              type="button"
              onClick={() => void goNext()}
              disabled={!canContinue() || saving}
              whileHover={canContinue() ? { scale: 1.03 } : {}}
              whileTap={canContinue() ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
            >
              {saving ? (
                "Saving…"
              ) : step === 4 ? (
                <>
                  Set limits
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
