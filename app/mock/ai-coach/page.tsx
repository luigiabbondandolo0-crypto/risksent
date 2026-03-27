import { MOCK_AI_INSIGHTS } from "@/lib/mock/siteMockData";

export default function MockAICoachPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">AI Coach</h1>
        <p className="rs-page-sub">
          Esempio di insight testuali. L&apos;integrazione con modello linguistico sarà nella build di produzione.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_AI_INSIGHTS.map((item) => (
          <section key={item.title} className="rs-card p-5 shadow-rs-soft">
            <h2 className="text-base font-semibold text-violet-200">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
          </section>
        ))}
      </div>

      <section className="rs-card border-violet-500/20 bg-violet-950/20 p-5 shadow-rs-soft">
        <p className="text-sm text-slate-300">
          Questa pagina fa parte della <strong className="text-white">versione mock</strong> accessibile da home →
          Versione mock. Nessun dato reale viene inviato a un LLM da questa anteprima.
        </p>
      </section>
    </div>
  );
}
