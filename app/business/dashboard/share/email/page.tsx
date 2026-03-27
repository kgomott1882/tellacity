"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import UpgradeButton from "@/components/billing/UpgradeButton";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import TellacityStarStrip from "@/components/widgets/TellacityStarStrip";
import { EMAIL_WIDGET_CTA_BORDER, EMAIL_WIDGET_CTA_TEXT } from "@/lib/emailBranding";

const DEFAULT_WIDGET_SUBJECT = "Share your experience with us";
const DEFAULT_WIDGET_INTRO =
  "We'd love to hear about your experience. It only takes a minute.";

function isPremiumOrElite(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "premium" || p === "elite";
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter((e) => /\S+@\S+\.\S+/.test(e));
}

type WidgetTemplate = {
  subject: string | null;
  intro_message: string | null;
  layout_style: string | null;
  signature_enabled: boolean | null;
  signature_name: string | null;
};

function TellacityBranding() {
  return (
    <p className="mt-2 text-center text-[10px] leading-snug text-gray-400">
      Verified reviews powered by <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
    </p>
  );
}

export default function EmailWidgetsPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  if (!selectedBusiness?.id) return null;
  const businessId = selectedBusiness.id;

  const [template, setTemplate] = useState<WidgetTemplate | null>(null);
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null);

  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTemplate = useCallback(async () => {
    if (!businessId) {
      return;
    }
    try {
      await ensureSessionFresh();
      const [{ data: tmplData }, { data: bizData }] = await Promise.all([
        supabaseBrowser()
          .from("review_invite_email_templates")
          .select("subject, intro_message, layout_style, signature_enabled, signature_name")
          .eq("business_id", businessId)
          .eq("template_key", "widget")
          .maybeSingle(),
        supabaseBrowser()
          .from("businesses")
          .select("logo_url")
          .eq("id", businessId)
          .maybeSingle(),
      ]);
      setTemplate(tmplData as WidgetTemplate | null);
      setBusinessLogoUrl((bizData as { logo_url?: string | null } | null)?.logo_url ?? null);
    } catch {
      setTemplate(null);
    }
  }, [businessId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const business = selectedBusiness;

  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const canSend = isPremiumOrElite(normalizedPlan);

  const displaySubject = template?.subject?.trim() || DEFAULT_WIDGET_SUBJECT;
  const displayIntro = template?.intro_message?.trim() || DEFAULT_WIDGET_INTRO;
  const hasSignature = Boolean(template?.signature_enabled && template?.signature_name);
  const isEliteBranded =
    normalizedPlan === "elite" && template?.layout_style === "elite_branded";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !canSend) return;

    const emailList = parseEmails(recipients);
    if (emailList.length === 0) {
      setToast({ type: "error", text: "Please enter at least one valid email address." });
      return;
    }

    setSending(true);
    setToast(null);

    try {
      const res = await fetch("/api/email-widget/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, recipients: emailList }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", text: (data.error as string) || "Failed to send." });
        return;
      }
      const sent = (data.sent as number) ?? emailList.length;
      setToast({
        type: "success",
        text: `Sent to ${sent} recipient${sent !== 1 ? "s" : ""} successfully.`,
      });
      setRecipients("");
    } catch {
      setToast({ type: "error", text: "Failed to send." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <SimplePage
        title="Email Widgets"
        subtitle="Promote your Tellacity profile via email."
      />

      <PlanStatusBanner plan={normalizedPlan} />

      {/* Toast */}
      {toast && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          <span className="mt-0.5 shrink-0 text-base">
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto shrink-0 text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {!canSend && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-900">
            Available on Premium and Elite plans.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Send direct review links to customers without consuming invite credits.
          </p>
          <div className="mt-4">
            <UpgradeButton
              businessId={business.id}
              planCode="premium"
              amount={5000}
              email={user?.email ?? ""}
            />
          </div>
        </div>
      )}
      {/* ── Layout Options comparison ── */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">Layout Options</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Choose your email layout in{" "}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => canSend && router.push("/business/dashboard/get-reviews/email-templates")}
            className="text-[#124541] underline underline-offset-2 hover:text-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Email Templates
          </button>
          .
        </p>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Premium Widget Layout */}
              <div className={`rounded-xl border bg-white p-4 ${isEliteBranded ? "border-gray-200" : "border-[#124541] ring-1 ring-[#124541]"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Premium Widget Layout</p>
                  {!isEliteBranded && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-gray-500">Default Tellacity email layout.</p>

                {/* Standard mini-preview */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-5 text-center">
                  <p className="mb-2 text-xs font-semibold text-gray-800">Tell us about your experience</p>
                  <div className="flex justify-center">
                    <TellacityStarStrip size={12} />
                  </div>
                  <div
                    className="mt-2 inline-block rounded border px-3 py-1 text-[11px] font-semibold leading-tight bg-transparent"
                    style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                  >
                    Leave a Review
                  </div>
                  <TellacityBranding />
                </div>
              </div>

              {/* Elite Branded Layout */}
              <div
                className={`relative rounded-xl border border-dashed border-gray-300 bg-white p-4 transition ${
                  normalizedPlan === "elite" && isEliteBranded
                    ? "border-solid border-[#124541] ring-1 ring-[#124541]"
                    : normalizedPlan === "elite"
                    ? "border-solid border-gray-200"
                    : ""
                }`}
              >
                {/* Lock badge - non-elite only */}
                {normalizedPlan !== "elite" && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md">
                    🔒 Locked
                  </div>
                )}

                {/* Selected checkmark - elite + active */}
                {normalizedPlan === "elite" && isEliteBranded && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}

                <p className="mb-1 text-sm font-medium text-gray-900">Elite Branded Layout</p>
                <p className="mb-3 text-xs text-gray-500">Includes your business logo &amp; branded header</p>

                {/* Elite mini-preview */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white text-center shadow-sm">
                  {/* Business header */}
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
                    {businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt={selectedBusiness?.name ?? ""}
                        className="mx-auto mb-3 h-14 object-contain"
                      />
                    ) : (
                      <div className="mx-auto mb-3 flex h-14 w-20 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
                        logo
                      </div>
                    )}
                    <p className="text-lg font-semibold tracking-wide text-gray-800">
                      {selectedBusiness?.name ?? "Your Business"}
                    </p>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-4">
                    <p className="mb-2 text-xs font-semibold text-gray-800">Tell us about your experience</p>
                    <div className="flex justify-center">
                    <TellacityStarStrip size={12} />
                  </div>
                    <div
                      className="mt-2 inline-block rounded border px-3 py-1 text-[11px] font-semibold leading-tight bg-transparent"
                      style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                    >
                      Leave a Review
                    </div>
                    <TellacityBranding />
                  </div>
                </div>

                {/* Upgrade nudge - non-elite only */}
                {normalizedPlan !== "elite" && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">Upgrade to Elite to use branded email layout</p>
                    <button
                      type="button"
                      onClick={() => router.push("/business/dashboard/billing")}
                      className="mt-2 rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      Upgrade
                    </button>
                  </div>
                )}
              </div>

        </div>
      </div>

      {/* Combined example + send panel */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Email widget example</h2>
            <p className="mt-1 text-sm text-gray-500">
              This is a live example of how your email widget appears to recipients.
            </p>
          </div>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => canSend && router.push("/business/dashboard/get-reviews/email-templates")}
            className="shrink-0 text-sm font-medium text-[#124541] underline underline-offset-2 hover:text-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit template
          </button>
        </div>

            {/* Layout badge */}
            <div className="mt-3">
              {isEliteBranded ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#124541] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  <span>★</span> Elite Branded Layout
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  Standard Layout
                </span>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-[#f4f6f8]">
                <div className="mx-auto max-w-[560px] bg-white">

                  {/* Subject bar */}
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Subject: </span>
                    {displaySubject}
                  </div>

                  {/* Elite branded header */}
                  {isEliteBranded && (
                    <div className="border-b border-gray-100 px-5 py-5 text-center">
                      <div className="mb-2 flex h-10 items-center justify-center">
                        <div className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-400">
                          [Business logo]
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedBusiness?.name ?? "Your Business"}
                      </p>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-6">
                    <p className="text-sm leading-relaxed text-gray-700">{displayIntro}</p>

                    {/* Review Collector block */}
                    <div className="my-5 rounded-lg border border-gray-200 p-5 text-center">
                      <p className="text-sm font-semibold text-gray-900">Tell us about your experience</p>
                      <div className="mt-2 flex justify-center">
                        <TellacityStarStrip size={13} />
                      </div>
                      <div
                        className="mt-3 inline-block rounded border px-4 py-1.5 text-xs font-semibold leading-tight bg-transparent"
                        style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                      >
                        Leave a Review
                      </div>
                      <p className="mt-3 text-center text-[11px] text-gray-500">
                        Verified reviews powered by{" "}
                        <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                      </p>
                    </div>

                    {/* Signature hint */}
                    {hasSignature && (
                      <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{template?.signature_name}</span>
                        {" - email signature included"}
                      </div>
                    )}
                  </div>

                </div>
              </div>
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h3 className="text-base font-semibold text-gray-900">Send this email widget</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enter recipient addresses separated by commas or new lines. No invite credits are consumed.
          </p>
        {!canSend && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Locked on your current plan. Upgrade to Premium or Elite to send.
          </p>
        )}

        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="widget-recipients"
              className="block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Recipients
            </label>
            <textarea
              id="widget-recipients"
              rows={5}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder={"customer@example.com\nanother@example.com"}
              disabled={!canSend || sending}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0E0E0E] disabled:bg-gray-50 disabled:text-gray-500"
            />
            {recipients.trim() && (
              <p className="mt-1 text-xs text-gray-500">
                {parseEmails(recipients).length} valid address
                {parseEmails(recipients).length !== 1 ? "es" : ""} detected
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSend || sending || !businessId}
            className="rounded-lg bg-[#124541] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {!canSend ? "Upgrade to send" : sending ? "Sending…" : "Send"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
