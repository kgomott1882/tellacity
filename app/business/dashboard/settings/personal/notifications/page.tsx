"use client";

import { useEffect, useState } from "react";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { supabase } from "@/lib/supabaseBrowser";

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

export default function EmailNotificationsPage() {
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
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (!error && data) {
        setPrefs({
          newsletter: Boolean((data as any).newsletter),
          service_1_2_star: Boolean((data as any).service_1_2_star),
          service_3_star: Boolean((data as any).service_3_star),
          service_4_5_star: Boolean((data as any).service_4_5_star),
          product_1_star: Boolean((data as any).product_1_star),
          product_2_star: Boolean((data as any).product_2_star),
          product_3_star: Boolean((data as any).product_3_star),
          product_4_star: Boolean((data as any).product_4_star),
          product_5_star: Boolean((data as any).product_5_star),
          product_modified_reviews: Boolean((data as any).product_modified_reviews),
          product_questions: Boolean((data as any).product_questions),
          product_replies: Boolean((data as any).product_replies),
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const setPref = <K extends keyof Prefs>(key: K, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setMessage(null);
    setSaving(true);
    const payload = {
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("user_notification_preferences")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Saved." });
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Email notifications</h1>
        <div className="mt-6 h-8 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="mt-4 h-64 rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Email notifications</h1>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {/* Newsletter */}
        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">Tellacity&apos;s newsletter</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={prefs.newsletter}
              onChange={(e) => setPref("newsletter", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
            />
            <span className="text-sm text-gray-700">Yes, I&apos;d like to subscribe to Tellacity&apos;s newsletter.</span>
          </label>
        </div>

        {/* Service reviews */}
        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Service Reviews for {businessName} – Please email me about:
          </h2>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.service_1_2_star}
                onChange={(e) => setPref("service_1_2_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">1 and 2-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.service_3_star}
                onChange={(e) => setPref("service_3_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">3-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.service_4_5_star}
                onChange={(e) => setPref("service_4_5_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">4 and 5-star reviews</span>
            </label>
          </div>
        </div>

        {/* Product reviews */}
        <div>
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Product Reviews for {businessName} – Please email me about:
          </h2>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_1_star}
                onChange={(e) => setPref("product_1_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">1-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_2_star}
                onChange={(e) => setPref("product_2_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">2-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_3_star}
                onChange={(e) => setPref("product_3_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">3-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_4_star}
                onChange={(e) => setPref("product_4_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">4-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_5_star}
                onChange={(e) => setPref("product_5_star", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">5-star reviews</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_modified_reviews}
                onChange={(e) => setPref("product_modified_reviews", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">modified reviews resulting from moderation requests</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_questions}
                onChange={(e) => setPref("product_questions", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">questions via the Product Q&A widget</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.product_replies}
                onChange={(e) => setPref("product_replies", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">replies to reviews</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
