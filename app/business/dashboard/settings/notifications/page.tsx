"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useBusinessContext } from "../../_context/BusinessContext";
import {
  canAccessNotifications,
  normalizePlanCodeToKey,
  nextTierUpgradeCtaLabel,
} from "@/lib/plans";

type Prefs = {
  newsletter_enabled: boolean;
  notify_1_2_star: boolean;
  notify_3_star: boolean;
  notify_4_5_star: boolean;
};

const DEFAULT_PREFS: Prefs = {
  newsletter_enabled: false,
  notify_1_2_star: true,
  notify_3_star: true,
  notify_4_5_star: true,
};

export default function NotificationsPage() {
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  /** `notify_only_low_reviews` — UI only; API not wired yet */
  const [notifyOnlyLowReviews, setNotifyOnlyLowReviews] = useState(false);

  const businessId = selectedBusiness.id;
  const planKey = normalizePlanCodeToKey(selectedBusiness.plan);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/business/notification-preferences?businessId=${encodeURIComponent(businessId)}`,
        { credentials: "same-origin" }
      );
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        const text =
          typeof body.error === "string" ? body.error : `Could not load preferences (${res.status}).`;
        setMessage({ type: "error", text });
        setPrefs(DEFAULT_PREFS);
        return;
      }

      setPrefs((prev) => ({
        ...prev,
        newsletter_enabled:
          typeof body.newsletter_enabled === "boolean" ? body.newsletter_enabled : DEFAULT_PREFS.newsletter_enabled,
        notify_1_2_star:
          typeof body.notify_1_2_star === "boolean" ? body.notify_1_2_star : DEFAULT_PREFS.notify_1_2_star,
        notify_3_star: typeof body.notify_3_star === "boolean" ? body.notify_3_star : DEFAULT_PREFS.notify_3_star,
        notify_4_5_star:
          typeof body.notify_4_5_star === "boolean" ? body.notify_4_5_star : DEFAULT_PREFS.notify_4_5_star,
      }));
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      setMessage({ type: "error", text: "Could not load preferences. Please try again." });
      setPrefs(DEFAULT_PREFS);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setPref = <K extends keyof Prefs>(key: K, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/business/notification-preferences", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          newsletter_enabled: prefs.newsletter_enabled,
          notify_1_2_star: prefs.notify_1_2_star,
          notify_3_star: prefs.notify_3_star,
          notify_4_5_star: prefs.notify_4_5_star,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

      if (!res.ok || !body.success) {
        const text =
          typeof body.error === "string" ? body.error : res.ok ? "Save failed." : `Save failed (${res.status}).`;
        setMessage({ type: "error", text });
        return;
      }

      setMessage({ type: "success", text: "Saved." });
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      setMessage({ type: "error", text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1.5 transition-colors hover:bg-gray-50/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
      />
      <span className="text-sm leading-snug text-gray-800">{label}</span>
    </label>
  );

  if (!canAccessNotifications(planKey)) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0E0E0E]">🔒 Notifications</h1>
        <p className="mt-3 text-sm text-gray-600">
          Stay on top of new reviews and activity. Enable notifications with a Grow plan.
        </p>
        <Link
          href="/business/dashboard/billing"
          className="mt-8 inline-flex rounded-xl bg-[#124541] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a36]"
        >
          {nextTierUpgradeCtaLabel(planKey)}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0E0E0E]">Notifications</h1>
      <p className="mt-1.5 text-sm text-gray-500">Control email updates for your business.</p>

      {message && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Newsletter</h2>
          <p className="mt-1 text-sm text-gray-600">Product news and tips from Tellacity.</p>
          <div className="mt-4">
            <Checkbox
              label="Subscribe to the Tellacity newsletter"
              checked={prefs.newsletter_enabled}
              onChange={(v) => setPref("newsletter_enabled", v)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Review notifications</h2>
          <p className="mt-1 text-sm text-gray-600">When someone publishes a new review of your business.</p>
          <div className="mt-4 space-y-1">
            <Checkbox
              label="Bad reviews (1–2★)"
              checked={prefs.notify_1_2_star}
              onChange={(v) => setPref("notify_1_2_star", v)}
            />
            <Checkbox
              label="Neutral reviews (3★)"
              checked={prefs.notify_3_star}
              onChange={(v) => setPref("notify_3_star", v)}
            />
            <Checkbox
              label="Positive reviews (4–5★)"
              checked={prefs.notify_4_5_star}
              onChange={(v) => setPref("notify_4_5_star", v)}
            />
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={notifyOnlyLowReviews}
                aria-label="Only notify for negative reviews"
                onClick={() => setNotifyOnlyLowReviews((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#124541]/30 focus:ring-offset-2 ${
                  notifyOnlyLowReviews ? "bg-[#124541]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    notifyOnlyLowReviews ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-900">Only notify me for negative reviews</p>
                <p className="mt-0.5 text-xs text-gray-500">Account sync for this option is not available yet.</p>
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || loading}
          className="rounded-xl bg-[#124541] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a36] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
