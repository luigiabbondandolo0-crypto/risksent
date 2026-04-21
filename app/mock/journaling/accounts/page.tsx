import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";

const MOCK_ACCOUNTS = [
  {
    id: "mock-acc-1",
    nickname: "FTMO Demo",
    platform: "mt5",
    broker_server: "FTMO-Demo",
    current_balance: 98_420.34,
    status: "active" as const,
    account_number: "500123",
  },
  {
    id: "mock-acc-2",
    nickname: "IC Markets Live",
    platform: "mt4",
    broker_server: "ICMarkets-Live07",
    current_balance: 12_184.12,
    status: "active" as const,
    account_number: "874001",
  },
  {
    id: "mock-acc-3",
    nickname: "Personal Demo",
    platform: "mt5",
    broker_server: "MetaQuotes-Demo",
    current_balance: 10_000.0,
    status: "disconnected" as const,
    account_number: "6001122",
  },
];

function maskNumber(n: string) {
  if (n.length <= 4) return "••••";
  return `••••${n.slice(-4)}`;
}

export default function MockJournalingAccountsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <Link
        href="/mock/journaling"
        className="inline-flex items-center gap-1 text-sm font-mono text-slate-500 hover:text-slate-300"
      >
        <ChevronLeft className="h-4 w-4" /> Back to journal
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Journal accounts
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            Demo mode — showing sample accounts. Sign up to connect real MT4/MT5 accounts.
          </p>
        </div>
        <span
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-mono text-slate-500"
          title="Disabled in demo"
        >
          <Plus className="h-4 w-4" />
          Add account
        </span>
      </header>

      <ul className="space-y-3">
        {MOCK_ACCOUNTS.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-100">{a.nickname}</p>
              <p className="truncate text-xs font-mono text-slate-500">
                {a.broker_server} · {maskNumber(a.account_number)}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                  {a.platform}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    a.status === "active"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      : "bg-slate-500"
                  }`}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {a.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-slate-100">
                {a.current_balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                USD
              </p>
              <p className="text-[10px] font-mono text-slate-600">current balance</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
