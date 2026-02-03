"use client";

import { useEffect, useState } from "react";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { supabase } from "@/lib/supabaseBrowser";
import RatingStars from "@/components/RatingStars";
import { Pencil, HelpCircle } from "lucide-react";

const REFERENCE_TYPES = [
  { value: "order", label: "Order" },
  { value: "invoice", label: "Invoice" },
  { value: "booking", label: "Booking" },
  { value: "customer", label: "Customer" },
  { value: "generic", label: "Generic" },
  { value: "custom", label: "Other (custom)" },
] as const;

type ReferenceType = (typeof REFERENCE_TYPES)[number]["value"];

function referenceLabel(type: ReferenceType, customLabel: string | null): string {
  if (type === "custom" && customLabel?.trim()) return customLabel.trim();
  const found = REFERENCE_TYPES.find((t) => t.value === type);
  return found ? found.label : "Reference number";
}

export default function ReferenceNumberPage() {
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [referenceEnabled, setReferenceEnabled] = useState(false);
  const [referenceType, setReferenceType] = useState<ReferenceType>("generic");
  const [referenceCustomLabel, setReferenceCustomLabel] = useState("");
  const [previewTab, setPreviewTab] = useState<"reviewer" | "you">("reviewer");

  const businessId = selectedBusiness?.id ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("businesses")
        .select("reference_number_enabled, reference_number_type, reference_number_label_custom")
        .eq("id", businessId)
        .single();
      if (!mounted) return;
      if (!error && data) {
        const row = data as {
          reference_number_enabled?: boolean;
          reference_number_type?: string | null;
          reference_number_label_custom?: string | null;
        };
        setReferenceEnabled(Boolean(row.reference_number_enabled));
        const t = row.reference_number_type;
        setReferenceType(
          REFERENCE_TYPES.some((r) => r.value === t) ? (t as ReferenceType) : "generic"
        );
        setReferenceCustomLabel(row.reference_number_label_custom ?? "");
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setMessage(null);
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        reference_number_enabled: referenceEnabled,
        reference_number_type: referenceType,
        reference_number_label_custom:
          referenceType === "custom" ? referenceCustomLabel.trim() || null : null,
      })
      .eq("id", businessId);
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Saved." });
  };

  const showSelectPrompt = !selectedBusiness;
  const showSkeleton = selectedBusiness && loading;
  const showContent = selectedBusiness && !loading;

  return (
    <>
      {showSelectPrompt && (
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Reference number</h1>
          <p className="mt-2 text-sm text-gray-600">Select a business from the sidebar to configure reference number settings.</p>
        </div>
      )}
      {showSkeleton && (
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Reference number</h1>
          <div className="mt-6 h-8 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="mt-4 h-32 rounded bg-gray-100 animate-pulse" />
        </div>
      )}
      {showContent && (
    <div className="max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
        {/* Left: Configuration */}
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Reference number</h1>
          <h2 className="mt-4 text-base font-semibold text-[#0E0E0E]">Connect organic reviews to genuine customer experiences</h2>
          <p className="mt-2 text-sm text-gray-600">
            Make sure that every organic review is based on a genuine experience by asking reviewers for a reference number of your choice when they write a review. They can choose whether they want to share a reference number.
          </p>

          {message && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="reference"
                  checked={!referenceEnabled}
                  onChange={() => setReferenceEnabled(false)}
                  className="mt-1 h-4 w-4 border-gray-300 text-[#124541] focus:ring-[#124541]"
                />
                <span className="text-sm text-gray-800">No thanks, I don&apos;t want a reference number from reviewers</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="reference"
                  checked={referenceEnabled}
                  onChange={() => setReferenceEnabled(true)}
                  className="mt-1 h-4 w-4 border-gray-300 text-[#124541] focus:ring-[#124541]"
                />
                <span className="text-sm text-gray-800">Yes please, I&apos;d like reviewers to provide a reference number</span>
              </label>
            </div>

            {referenceEnabled && (
              <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <div>
                  <label htmlFor="reference-type" className="block text-sm font-medium text-[#0E0E0E]">
                    Reference type
                  </label>
                  <select
                    id="reference-type"
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value as ReferenceType)}
                    className="mt-2 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  >
                    {REFERENCE_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {referenceType === "custom" && (
                  <div>
                    <label htmlFor="reference-custom-label" className="block text-sm font-medium text-[#0E0E0E]">
                      Custom label
                    </label>
                    <input
                      id="reference-custom-label"
                      type="text"
                      value={referenceCustomLabel}
                      onChange={(e) => setReferenceCustomLabel(e.target.value)}
                      placeholder="e.g. Ticket number"
                      className="mt-2 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </div>

        {/* Right: Preview */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex gap-2 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setPreviewTab("reviewer")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${previewTab === "reviewer" ? "bg-gray-100 text-[#0E0E0E]" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Reviewer
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("you")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${previewTab === "you" ? "bg-gray-100 text-[#0E0E0E]" : "text-gray-600 hover:bg-gray-50"}`}
            >
              You
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-600">
            {referenceEnabled
              ? `Reviewers will see an optional "${referenceLabel(referenceType, referenceCustomLabel)}" field with a tooltip.`
              : "Enable reference number above to show an optional field on the reviewer form."}
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-700">Rate your recent experience</p>
              <div className="mt-2">
                <RatingStars rating={3} size={14} editable={false} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Give your review a title</label>
              <div className="relative mt-2">
                <input
                  readOnly
                  type="text"
                  value="Good service"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-9 text-sm text-gray-600"
                />
                <Pencil size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Your review</label>
              <textarea
                readOnly
                rows={3}
                value="Very helpful and sorted out what I needed with no fuss"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
            </div>
            {referenceEnabled && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  {referenceLabel(referenceType, referenceCustomLabel)}{" "}
                  <span className="text-gray-400">(optional)</span>
                  <span
                    className="inline-flex cursor-help rounded-full text-gray-400 hover:text-gray-600"
                    title="This helps the business respond to your review and link it to your experience."
                  >
                    <HelpCircle size={14} />
                  </span>
                </label>
                <input
                  readOnly
                  type="text"
                  placeholder="e.g. order or booking ID"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder:text-gray-400"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}
