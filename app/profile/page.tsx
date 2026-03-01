"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type ProfileData = {
  email: string;
  fullName: string;
  phone: string;
  company: string;
  role: string;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    fullName: "",
    phone: "",
    company: "",
    role: "customer",
    createdAt: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login?redirectedFrom=/profile");
        return;
      }

      // Load user data (mock for now)
      setProfile({
        email: user.email || "",
        fullName: user.user_metadata?.full_name || "",
        phone: user.user_metadata?.phone || "",
        company: user.user_metadata?.company || "",
        role: "customer", // This would come from app_user table
        createdAt: user.created_at || ""
      });

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        return;
      }

      // Update user metadata (mock - in production would update app_user table)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          phone: profile.phone,
          company: profile.company
        }
      });

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setInfo("Profile updated successfully!");
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-400" />
          Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account information and preferences.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface/80 p-6 shadow-lg shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="email">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500">Email cannot be changed</p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="fullName">
                <User className="h-3.5 w-3.5" />
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="company">
                Company
              </label>
              <input
                id="company"
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Your company name"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="role">
                <Shield className="h-3.5 w-3.5" />
                Role
              </label>
              <input
                id="role"
                type="text"
                value={profile.role}
                disabled
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500">Role is managed by administrators</p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-400" htmlFor="createdAt">
                <Calendar className="h-3.5 w-3.5" />
                Member Since
              </label>
              <input
                id="createdAt"
                type="text"
                value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                disabled
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/40 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          {info && !error && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-2 py-1">
              {info}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-slate-700 bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
