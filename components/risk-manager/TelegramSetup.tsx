"use client";

import { motion } from "framer-motion";

export type TelegramSettings = {
  telegram_chat_id: string | null;
  telegram_enabled: boolean;
  notify_daily_dd: boolean;
  notify_max_dd: boolean;
  notify_position_size: boolean;
  notify_consecutive_losses: boolean;
  notify_weekly_loss: boolean;
  notify_overtrading: boolean;
  notify_revenge: boolean;
};

type Props = {
  settings: TelegramSettings;
  chatIdDraft: string;
  onChatIdChange: (v: string) => void;
  onSaveField: (patch: Partial<TelegramSettings>) => void;
  onTest: () => void;
  isMock?: boolean;
  testDisabledReason?: string;
};

function ToggleRow({
  label,
  on,
  onToggle,
  disabled
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
    >
      <span className="text-sm text-slate-200">{label}</span>
      <motion.div
        className="relative h-7 w-12 shrink-0 rounded-full border border-white/[0.1]"
        style={{ background: on ? "rgba(0,230,118,0.2)" : "rgba(255,255,255,0.06)" }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <motion.span
          layout
          className="absolute top-0.5 left-1 h-6 w-6 rounded-full shadow-md"
          style={{ background: on ? "#00e676" : "#64748b" }}
          animate={{ x: on ? 22 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </motion.div>
    </button>
  );
}

export function TelegramSetup({
  settings,
  chatIdDraft,
  onChatIdChange,
  onSaveField,
  onTest,
  isMock,
  testDisabledReason
}: Props) {
  const masterDisabled = isMock ? false : !settings.telegram_chat_id?.trim();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
          <li>Open Telegram</li>
          <li>
            Search for{" "}
            <a
              href="https://t.me/RiskSentConnectBot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
            >
              @RiskSentConnectBot
            </a>
          </li>
          <li>
            Press <span className="font-[family-name:var(--font-mono)] text-slate-200">Start</span>
          </li>
          <li>Copy the Chat ID it sends you</li>
          <li>Paste it below</li>
        </ol>
      </div>

      <div>
        <label className="rs-kpi-label mb-2 block">Chat ID</label>
        <input
          className="rs-input max-w-md font-[family-name:var(--font-mono)] text-sm"
          placeholder="e.g. 123456789"
          value={chatIdDraft}
          onChange={(e) => onChatIdChange(e.target.value)}
          onBlur={() => {
            if (!isMock && chatIdDraft.trim() !== (settings.telegram_chat_id ?? "")) {
              onSaveField({ telegram_chat_id: chatIdDraft.trim() || null });
            }
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isMock ? false : !!testDisabledReason}
          title={isMock ? undefined : testDisabledReason}
          onClick={onTest}
          className="rounded-xl border border-white/[0.1] bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Test connection
        </motion.button>
        {isMock && (
          <span className="self-center text-xs font-[family-name:var(--font-mono)] text-amber-400/90">
            Demo: test shows a mock success toast.
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="rs-kpi-label">Master</p>
        <ToggleRow
          label="Telegram alerts enabled"
          on={settings.telegram_enabled}
          disabled={masterDisabled && !isMock}
          onToggle={() => onSaveField({ telegram_enabled: !settings.telegram_enabled })}
        />
      </div>

      <div className="space-y-2">
        <p className="rs-kpi-label">Per rule</p>
        <ToggleRow
          label="Daily DD"
          on={settings.notify_daily_dd}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_daily_dd: !settings.notify_daily_dd })}
        />
        <ToggleRow
          label="Max DD"
          on={settings.notify_max_dd}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_max_dd: !settings.notify_max_dd })}
        />
        <ToggleRow
          label="Position Size"
          on={settings.notify_position_size}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_position_size: !settings.notify_position_size })}
        />
        <ToggleRow
          label="Consec Losses"
          on={settings.notify_consecutive_losses}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() =>
            onSaveField({ notify_consecutive_losses: !settings.notify_consecutive_losses })
          }
        />
        <ToggleRow
          label="Weekly Loss"
          on={settings.notify_weekly_loss}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_weekly_loss: !settings.notify_weekly_loss })}
        />
        <ToggleRow
          label="Overtrading"
          on={settings.notify_overtrading}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_overtrading: !settings.notify_overtrading })}
        />
        <ToggleRow
          label="Revenge Trading"
          on={settings.notify_revenge}
          disabled={!settings.telegram_enabled && !isMock}
          onToggle={() => onSaveField({ notify_revenge: !settings.notify_revenge })}
        />
      </div>
    </div>
  );
}
