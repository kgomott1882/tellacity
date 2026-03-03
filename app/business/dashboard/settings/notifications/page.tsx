"use client";

import { useEffect, useState } from "react";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Prefs = {
  newsletter: boolean;
  service_1_2_star: boolean;
  service_3_star: boolean;
  service_4_5_star: boolean;
  product_1_star: boolean;
  product_2_star: boolean;
  product_3_star: boolean;
  product_4_star: boolean;
  product_5_star: boolean;
  product_modified_reviews: boolean;
  product_questions: boolean;
  product_replies: boolean;
};

const DEFAULT_PREFS: Prefs = {
  newsletter: false,
  service_1_2_star: true,
  service_3_star: true,
  service_4_5_star: true,
  product_1_star: false,
  product_2_star: false,
  product_3_star: false,
  product_4_star: false,
  product_5_star: false,
  product_modified_reviews: false,
  product_questions: false,
  product_replies: false,
};

export default function NotificationsPage() {
  const { user } = useBusinessAuth();
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  const businessName = selectedBusiness?.name ?? "your business";

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) {
        setPrefs({
          newsletter:              Boolean((data as any).newsletter),
          service_1_2_star:        Boolean((data as any).service_1_2_star),
          service_3_star:          Boolean((data as any).service_3_star),
          service_4_5_star:        Boolean((data as any).service_4_5_star),
          product_1_star:          Boolean((data as any).product_1_star),
          product_2_star:          Boolean((data as any).product_2_star),
          product_3_star:          Boolean((data as any).product_3_star),
          product_4_star:          Boolean((data as any).product_4_star),
          product_5_star:          Boolean((data as any).product_5_star),
          product_modified_reviews: Boolean((data as any).product_modified_reviews),
          product_questions:        Boolean((data as any).product_questions),
          product_replies:          Boolean((data as any).product_replies),
        });
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const setPref = <K extends keyof Prefs>(key: K, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setMessage(null); setSaving(true);
    const { error } = await supabase
      .from("user_notification_preferences")
      .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Saved." });
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Notifications</h1>
        <div className="mt-6 h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-64 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Notifications</h1>
      <p className="mt-1 text-sm text-gray-500">Choose which email notifications you receive.</p>

      {message && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">Tellacity&apos;s newsletter</h2>
          <div className="mt-3">
            <Checkbox label="Yes, I'd like to subscribe to Tellacity's newsletter." checked={prefs.newsletter} onChange={(v) => setPref("newsletter", v)} />
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Service Reviews for {businessName} – email me about:
          </h2>
          <div className="mt-3 space-y-2">
            <Checkbox label="1 and 2-star reviews"  checked={prefs.service_1_2_star} onChange={(v) => setPref("service_1_2_star", v)} />
            <Checkbox label="3-star reviews"         checked={prefs.service_3_star}   onChange={(v) => setPref("service_3_star", v)} />
            <Checkbox label="4 and 5-star reviews"   checked={prefs.service_4_5_star} onChange={(v) => setPref("service_4_5_star", v)} />
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Product Reviews for {businessName} – email me about:
          </h2>
          <div className="mt-3 space-y-2">
            <Checkbox label="1-star reviews"                                    checked={prefs.product_1_star}          onChange={(v) => setPref("product_1_star", v)} />
            <Checkbox label="2-star reviews"                                    checked={prefs.product_2_star}          onChange={(v) => setPref("product_2_star", v)} />
            <Checkbox label="3-star reviews"                                    checked={prefs.product_3_star}          onChange={(v) => setPref("product_3_star", v)} />
            <Checkbox label="4-star reviews"                                    checked={prefs.product_4_star}          onChange={(v) => setPref("product_4_star", v)} />
            <Checkbox label="5-star reviews"                                    checked={prefs.product_5_star}          onChange={(v) => setPref("product_5_star", v)} />
            <Checkbox label="Modified reviews resulting from moderation requests" checked={prefs.product_modified_reviews} onChange={(v) => setPref("product_modified_reviews", v)} />
            <Checkbox label="Questions via the Product Q&A widget"              checked={prefs.product_questions}       onChange={(v) => setPref("product_questions", v)} />
            <Checkbox label="Replies to reviews"                                checked={prefs.product_replies}         onChange={(v) => setPref("product_replies", v)} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50">
          Save changes
        </button>
      </form>
    </div>
  );
}
