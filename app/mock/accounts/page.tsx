import Link from "next/link";
import { PlusCircle, CreditCard } from "lucide-react";
import { MOCK_ACCOUNTS } from "@/lib/mock/siteMockData";

export default function MockAccountsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="rs-page-title">Account</h1>
          <p className="rs-page-sub">Tabella dimostrativa. In produzione i conti sono collegati a MetaAPI.</p>
        </div>
        <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-500">
          <PlusCircle className="h-4 w-4" />
          Aggiungi account (solo live)
        </span>
      </header>

      <div className="rs-card overflow-hidden shadow-rs-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Piattaforma</th>
              <th className="px-4 py-3 font-medium">Login · Nome</th>
              <th className="px-4 py-3 font-medium">Provider ID</th>
              <th className="px-4 py-3 font-medium">Aggiunto</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ACCOUNTS.map((a) => (
              <tr key={a.id} className="border-b border-slate-800/60">
                <td className="px-4 py-3 text-slate-200">{a.broker_type}</td>
                <td className="px-4 py-3 text-slate-400">
                  {a.account_number}
                  {a.account_name ? <span className="text-slate-500"> · {a.account_name}</span> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.metaapi_account_id}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(a.created_at).toLocaleDateString("it-IT")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rs-card flex items-start gap-3 p-4 shadow-rs-soft">
        <CreditCard className="h-5 w-5 shrink-0 text-slate-500" />
        <p className="text-sm text-slate-500">
          Per collegare un account vero torna al{" "}
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            sito principale
          </Link>{" "}
          e registrati.
        </p>
      </div>
    </div>
  );
}
