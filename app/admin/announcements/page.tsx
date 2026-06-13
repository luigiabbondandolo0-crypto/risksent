"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

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
  info: "text-blue-700 bg-blue-50 border-blue-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  success: "text-emerald-700 bg-emerald-50 border-emerald-200",
  error: "text-red-700 bg-red-50 border-red-200",
};

const PLAN_COLORS: Record<string, string> = {
  all: "text-slate-600 bg-slate-100",
  free: "text-slate-500 bg-slate-50",
  new_trader: "text-cyan-700 bg-cyan-50",
  experienced: "text-amber-700 bg-amber-50",
};

const PLAN_LABELS: Record<string, string> = {
  all: "All users",
  free: "Free",
  new_trader: "New Trader",
  experienced: "Experienced",
};

const TYPE_BANNER: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
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
  const [formError, setFormError] = useState<string | null>(null);

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
      const res = await fetch("/api/admin/announcements", { credentials: "same-origin" });
      const d = (await res.json()) as { announcements?: Announcement[]; error?: string };
      if (!res.ok) {
        setAnnouncements([]);
        return;
      }
      setAnnouncements(d.announcements ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const title = form.title.trim();
    const message = form.message.trim();
    if (!title || !message) {
      setFormError("Title and message are required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title,
          message,
          expires_at: form.expires_at.trim() || undefined,
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        await fetchAnnouncements();
      } else {
        setFormError(d.error ?? `Could not create (${res.status}).`);
      }
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
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
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-700">Access denied</h2>
          <p className="mt-1 text-sm text-slate-600">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
            <Bell className="h-6 w-6 text-amber-500" />
            Announcements
          </h1>
          <p className="mt-1 text-sm font-mono text-slate-500">
            Create in-app banners for users by plan or globally.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #6366f1, #fb923c)" }}
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900">
                New announcement
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate-500">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 font-mono"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 font-mono resize-none"
                />
              </div>

              {/* Preview */}
              {form.title.trim() && form.message.trim() && (
                <div>
                  <p className="mb-2 text-xs font-mono text-slate-500">Preview:</p>
                  <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${TYPE_BANNER[form.type] ?? ""}`}>
                    <Bell className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>{form.title.trim()}</strong> — {form.message.trim()}
                    </span>
                  </div>
                </div>
              )}

              {formError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-mono text-red-700"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={submitting || !form.title.trim() || !form.message.trim()}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #6366f1, #fb923c)" }}
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    setFormError(null);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900"
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
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-300 mb-3" />
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
              className={`rounded-2xl border p-5 transition-all ${ann.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{ann.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${TYPE_COLORS[ann.type] ?? ""}`}>
                      {ann.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${PLAN_COLORS[ann.target_plan] ?? ""}`}>
                      {PLAN_LABELS[ann.target_plan] ?? ann.target_plan}
                    </span>
                    {!ann.active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 font-mono line-clamp-2">{ann.message}</p>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    Created {new Date(ann.created_at).toLocaleDateString()}
                    {ann.expires_at && ` · Expires ${new Date(ann.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(ann.id, !ann.active)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
                  >
                    {ann.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                    {ann.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(ann.id)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-500 transition-all hover:border-red-300 hover:bg-red-50"
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
