"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Settings = {
  send_delay_days: number;
  reminder_enabled: boolean;
  reminder_delay_days: number;
  custom_subject: string;
  custom_message: string;
  custom_signature: string;
  legal_footer_enabled: boolean;
};

const DEFAULTS: Settings = {
  send_delay_days: 1,
  reminder_enabled: false,
  reminder_delay_days: 3,
  custom_subject: "",
  custom_message: "",
  custom_signature: "",
  legal_footer_enabled: false,
};

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabaseBrowser.auth.getSession();
  return data.session?.access_token ?? null;
}

// ---- small reusable field wrappers ----

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#0E0E0E]">{children}</label>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-400">{children}</p>;
}

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 border-b border-gray-200 pb-3">
      <h2 className="text-base font-semibold text-[#0E0E0E]">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[#2fb2a8]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ---- page ----

export default function InviteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/business/invite-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!mounted) return;
      if (res.ok) {
        const data: Settings = await res.json();
        setForm({
          send_delay_days:      data.send_delay_days      ?? DEFAULTS.send_delay_days,
          reminder_enabled:     data.reminder_enabled     ?? DEFAULTS.reminder_enabled,
          reminder_delay_days:  data.reminder_delay_days  ?? DEFAULTS.reminder_delay_days,
          custom_subject:       data.custom_subject       ?? DEFAULTS.custom_subject,
          custom_message:       data.custom_message       ?? DEFAULTS.custom_message,
          custom_signature:     data.custom_signature     ?? DEFAULTS.custom_signature,
          legal_footer_enabled: data.legal_footer_enabled ?? DEFAULTS.legal_footer_enabled,
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated. Please sign in again." });
        setSaving(false);
        return;
      }
      const res = await fetch("/api/business/invite-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error ?? "Failed to save." });
      } else {
        setMessage({ type: "success", text: "Invite settings saved." });
      }
    } catch {
      setMessage({ type: "error", text: "Unexpected error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Invite Settings</h1>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Invite Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure how review invitations are sent to your customers.
        </p>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ---- Timing ---- */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading
            title="Timing"
            sub="Control when invitations and reminders are sent after a transaction."
          />
          <div className="space-y-5">
            <div>
              <FieldLabel>Send delay (days after transaction)</FieldLabel>
              <input
                type="number"
                min={0}
                max={30}
                value={form.send_delay_days}
                onChange={(e) => set("send_delay_days", Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-2 w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
              <FieldHint>How many days after the transaction to send the first invite. 0 = same day.</FieldHint>
            </div>

            <div className="space-y-3">
              <Toggle
                checked={form.reminder_enabled}
                onChange={(v) => set("reminder_enabled", v)}
                label="Send a reminder if the customer has not reviewed"
              />

              {form.reminder_enabled && (
                <div className="ml-14">
                  <FieldLabel>Reminder delay (days after first invite)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.reminder_delay_days}
                    onChange={(e) =>
                      set("reminder_delay_days", Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="mt-2 w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  />
                  <FieldHint>Days after the first invite to send the reminder.</FieldHint>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Email Content ---- */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading
            title="Email Content"
            sub="Customise the subject line, message body, and signature of your invite emails."
          />
          <div className="space-y-5">
            <div>
              <FieldLabel>Custom subject line</FieldLabel>
              <input
                type="text"
                value={form.custom_subject}
                onChange={(e) => set("custom_subject", e.target.value)}
                placeholder="e.g. How was your experience with us?"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
              <FieldHint>Leave blank to use the default Tellacity subject line.</FieldHint>
            </div>

            <div>
              <FieldLabel>Custom message</FieldLabel>
              <textarea
                rows={4}
                value={form.custom_message}
                onChange={(e) => set("custom_message", e.target.value)}
                placeholder="e.g. Hi {first_name}, we hope you enjoyed your recent visit. We would love to hear your feedback."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
              <FieldHint>
                Personalise the body of the invite email. Leave blank to use the default message.
              </FieldHint>
            </div>

            <div>
              <FieldLabel>Custom signature</FieldLabel>
              <textarea
                rows={3}
                value={form.custom_signature}
                onChange={(e) => set("custom_signature", e.target.value)}
                placeholder="e.g. The team at Acme Ltd"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
              <FieldHint>Shown at the bottom of the email. Leave blank to use your business name.</FieldHint>
            </div>
          </div>
        </div>

        {/* ---- Legal ---- */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading
            title="Legal"
            sub="Compliance options for your invitation emails."
          />
          <Toggle
            checked={form.legal_footer_enabled}
            onChange={(v) => set("legal_footer_enabled", v)}
            label="Include legal footer in invitation emails"
          />
          <FieldHint>
            Adds an unsubscribe link and legal notice to the bottom of every invite email.
          </FieldHint>
        </div>

        {/* ---- Save ---- */}
        <div className="pb-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#2fb2a8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
