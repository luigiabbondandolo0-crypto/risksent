"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, Plus, Trash2, ToggleLeft, ToggleRight, Eye } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  target_plan: "all" | "free" | "new_trader" | "experienced";
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-300 bg-blue-500/15 border-blue-500/30",
  warning: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  success: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  error: "text-red-300 bg-red-500/15 border-red-500/30",
};

const PLAN_COLORS: Record<string, string> = {
  all: "text-slate-300 bg-slate-500/15",
  free: "text-slate-400 bg-slate-600/15",
  new_trader: "text-cyan-300 bg-cyan-500/15",
  experienced: "text-amber-300 bg-amber-500/15",
};

const PLAN_LABELS: Record<string, string> = {
  all: "All users",
  free: "Free",
  new_trader: "New Trader",
  experienced: "Experienced",
};

const TYPE_BANNER: Record<string, string> = {
  info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/20 bg-red-500/10 text-red-200",
};

const emptyForm = {
  title: "",
  message: "",
  type: "info" as const,
  target_plan: "all" as const,
  expires_at: "",
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) { setIsAdmin(false); router.push("/app/dashboard"); }
        else { setIsAdmin(true); void fetchAnnouncements(); }
      })
      .catch(() => setIsAdmin(false));
  }, [router]);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const d = await res.json() as { announcements: Announcement[] };
      setAnnouncements(d.announcements ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title || !form.message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expires_at: form.expires_at || undefined,
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        await fetchAnnouncements();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">Access denied</h2>
          <p className="mt-1 text-sm text-slate-400">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            <Bell className="h-6 w-6 text-amber-400" />
            Announcements
          </h1>
          <p className="mt-1 text-sm font-mono text-slate-500">
            Create in-app banners for users by plan or globally.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
        >
          <Plus className="h-4 w-4" />
          New announcement
        </button>
      </header>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                New announcement
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff3c3c] font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Target plan</label>
                  <select
                    value={form.target_plan}
                    onChange={(e) => setForm((f) => ({ ...f, target_plan: e.target.value as typeof form.target_plan }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="all">All users</option>
                    <option value="free">Free only</option>
                    <option value="new_trader">New Trader only</option>
                    <option value="experienced">Experienced only</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Expires at (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff3c3c] font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  placeholder="Announcement message…"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff3c3c] font-mono resize-none"
                />
              </div>

              {/* Preview */}
              {form.title && form.message && (
                <div>
                  <p className="mb-2 text-xs font-mono text-slate-500">Preview:</p>
                  <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${TYPE_BANNER[form.type] ?? ""}`}>
                    <Bell className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>{form.title}</strong> — {form.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => void handleCreate()}
                  disabled={submitting || !form.title || !form.message}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-sm font-mono text-slate-500">Loading announcements…</div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm font-mono">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border p-5 transition-all ${ann.active ? "border-white/[0.07] bg-white/[0.02]" : "border-white/[0.04] bg-white/[0.01] opacity-60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{ann.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${TYPE_COLORS[ann.type] ?? ""}`}>
                      {ann.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${PLAN_COLORS[ann.target_plan] ?? ""}`}>
                      {PLAN_LABELS[ann.target_plan] ?? ann.target_plan}
                    </span>
                    {!ann.active && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-mono line-clamp-2">{ann.message}</p>
                  <p className="mt-1 text-xs text-slate-600 font-mono">
                    Created {new Date(ann.created_at).toLocaleDateString()}
                    {ann.expires_at && ` · Expires ${new Date(ann.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => void toggleActive(ann.id, !ann.active)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
                  >
                    {ann.active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                    {ann.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="rounded-lg border border-red-500/20 p-1.5 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
