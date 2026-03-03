"use client";

import { useEffect, useState } from "react";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const COUNTRY_OPTIONS = [
  "South Africa","United States","United Kingdom","Australia","Canada",
  "Germany","France","Netherlands","Ireland","New Zealand",
  "India","Nigeria","Kenya","Ghana","Zimbabwe","Botswana","Namibia","Other",
];

const LANGUAGE_OPTIONS = [
  "English (United States)","English (United Kingdom)","Afrikaans",
  "French","German","Spanish","Portuguese","Dutch","Other",
];

const CODE_MAP: Record<string, string> = {
  ZA:"South Africa",US:"United States",GB:"United Kingdom",AU:"Australia",
  CA:"Canada",DE:"Germany",FR:"France",NL:"Netherlands",IE:"Ireland",
  NZ:"New Zealand",IN:"India",NG:"Nigeria",KE:"Kenya",GH:"Ghana",
  ZW:"Zimbabwe",BW:"Botswana",NA:"Namibia",
};

function normalizeCountry(v: string | undefined | null): string {
  if (!v?.trim()) return "South Africa";
  const s = v.trim();
  if (COUNTRY_OPTIONS.includes(s)) return s;
  return CODE_MAP[s] ?? "South Africa";
}
function normalizeLanguage(v: string | undefined | null): string {
  if (!v?.trim()) return "English (United States)";
  const s = v.trim();
  if (LANGUAGE_OPTIONS.includes(s)) return s;
  return "English (United States)";
}

export default function AccountPage() {
  const { user } = useBusinessAuth();
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [message,            setMessage]            = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [email,              setEmail]              = useState("");
  const [userId,             setUserId]             = useState("");
  const [form, setForm] = useState({ name: "", country: "South Africa", language: "English (United States)" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      let sessionData: any = null;
      try {
        const result = await supabaseBrowser().auth.getSession();
        sessionData = result.data;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") { if (mounted) setLoading(false); return; }
        throw e;
      }
      const u = sessionData?.session?.user;
      if (!mounted || !u) { setLoading(false); return; }
      setUserId(u.id);
      setEmail(u.email ?? "");
      const displayName = (u.user_metadata?.display_name as string)?.trim() ?? "";
      let nameValue = displayName;
      if (!nameValue) {
        const supabase = supabaseBrowser();
        const { data: bp } = await supabase.from("business_profiles").select("business_name").eq("id", u.id).maybeSingle();
        if (mounted && bp && (bp as any).business_name) nameValue = (bp as any).business_name.trim();
      }
      setForm({
        name:     nameValue,
        country:  normalizeCountry(u.user_metadata?.country as string),
        language: normalizeLanguage(u.user_metadata?.language as string),
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); setSaving(true);
    const nameTrim = form.name.trim();
    const { error } = await supabaseBrowser().auth.updateUser({
      data: { display_name: nameTrim || null, country: form.country || null, language: form.language || null },
    });
    if (error) { setSaving(false); setMessage({ type: "error", text: error.message }); return; }
    if (user?.id) {
      const supabase = supabaseBrowser();
      await supabase.from("business_profiles").update({ business_name: nameTrim || null }).eq("id", user.id);
    }
    setSaving(false);
    setMessage({ type: "success", text: "Saved." });
  };

  const handleChangePassword = () => {
    supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` })
      .then(({ error }) => {
        if (error) setMessage({ type: "error", text: error.message });
        else setMessage({ type: "success", text: "Check your email for a password reset link." });
      });
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
    setMessage({ type: "error", text: "Account deletion must be done via support or your backend." });
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Account</h1>
        <div className="mt-6 h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-32 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Account</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your personal details, security, and account settings.</p>

      {message && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0E0E0E]">User ID</label>
          <input type="text" value={userId} readOnly
            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0E0E0E]">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
            placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0E0E0E]">Country</label>
          <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20">
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0E0E0E]">Language</label>
          <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20">
            {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving}
          className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50">
          Save changes
        </button>
      </form>

      {/* Security */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">Security</h2>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-medium text-[#0E0E0E]">Email</label>
              <input type="email" value={email} readOnly
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600" />
              <p className="mt-1 text-xs text-gray-500">We won&apos;t change this email until we&apos;ve received your confirmation.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-[#0E0E0E]">Password</span>
            <button type="button" onClick={handleChangePassword}
              className="rounded-lg bg-[#2fb2a8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91]">
              Change password
            </button>
          </div>
        </div>
      </div>

      {/* Delete account */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">Delete account</h2>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ll lose access to Tellacity Business and will no longer receive notifications.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={handleDeleteAccount} disabled={saving}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${showDeleteConfirm ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"}`}>
            {showDeleteConfirm ? "Confirm delete my account" : "Delete my account"}
          </button>
          {showDeleteConfirm && (
            <button type="button" onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
