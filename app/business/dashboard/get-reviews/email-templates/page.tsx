"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import SignatureSection, { SignatureState } from "@/components/reviews/email-templates/SignatureSection";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import TellacityStarStrip from "@/components/widgets/TellacityStarStrip";
import WidgetStars from "@/components/widgets/WidgetStars";
import { EMAIL_WIDGET_CTA_BORDER, EMAIL_WIDGET_CTA_TEXT } from "@/lib/emailBranding";

const DEFAULT_STANDARD_SUBJECT = "You're invited to leave a review";
const DEFAULT_STANDARD_BODY =
  "You've been invited to leave a review.\n\nClick the link in this email to leave your review. If the button doesn't work, copy and paste the link into your browser.";

type TemplateType = "standard" | "custom" | "widget";
type TemplateRow = {
  id: string;
  business_id: string;
  template_key: TemplateType;
  subject: string | null;
  body: string | null;
  signature_enabled?: boolean | null;
  signature_name?: string | null;
  signature_title?: string | null;
  signature_phone?: string | null;
  signature_website?: string | null;
  signature_logo_url?: string | null;
  signature_address?: string | null;
  signature_cta_text?: string | null;
  signature_cta_url?: string | null;
  remove_tellacity_branding?: boolean | null;
  reply_to_email?: string | null;
};

function isPlanAtLeastGrow(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "grow" || p === "premium" || p === "elite";
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;
  const businessId = selectedBusiness.id;

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [widgetSubject, setWidgetSubject] = useState("");
  const [widgetIntro, setWidgetIntro] = useState("");
  const [widgetSignature, setWidgetSignature] = useState<SignatureState>({
    signature_enabled: false,
    signature_name: "",
    signature_title: "",
    signature_phone: "",
    signature_website: "",
    signature_logo_url: "",
    signature_address: "",
    signature_cta_text: "",
    signature_cta_url: "",
    remove_tellacity_branding: false,
    reply_to_email: "",
  });
  const [widgetLayoutStyle, setWidgetLayoutStyle] = useState<
    "standard" | "elite_branded" | "review_card" | "rating_ladder"
  >("standard");
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null);
  const [savingWidget, setSavingWidget] = useState(false);
  const [widgetMessage, setWidgetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [signatureState, setSignatureState] = useState<SignatureState>({
    signature_enabled: false,
    signature_name: "",
    signature_title: "",
    signature_phone: "",
    signature_website: "",
    signature_logo_url: "",
    signature_address: "",
    signature_cta_text: "",
    signature_cta_url: "",
    remove_tellacity_branding: false,
    reply_to_email: "",
  });

  const fetchData = useCallback(async () => {
    if (!businessId) {
      setError(null);
      return;
    }
    console.log("Fetching template data...");
    setError(null);
    try {
      await ensureSessionFresh();
      const supabase = supabaseBrowser();
      const [templatesResponse, { data: bizData }] = await Promise.all([
        fetch("/api/review-invite-email-templates", { method: "GET" }),
        supabase
          .from("businesses")
          .select("logo_url")
          .eq("id", businessId)
          .maybeSingle(),
      ]);

      setBusinessLogoUrl((bizData as { logo_url?: string | null } | null)?.logo_url ?? null);
      if (!templatesResponse.ok) {
        const payload = (await templatesResponse.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Failed to load email templates.");
        return;
      }
      const payload = (await templatesResponse.json()) as {
        data?: TemplateRow[];
      };
      const rows = Array.isArray(payload.data) ? payload.data : [];
      const filteredRows = rows
        .filter((r) => r.business_id === businessId)
        .filter((r) => ["standard", "custom", "widget"].includes(r.template_key))
        .sort((a, b) => a.template_key.localeCompare(b.template_key));

      if (Array.isArray(filteredRows)) {
        setTemplates(filteredRows as TemplateRow[]);
        const custom = filteredRows.find((r: { template_key: string }) => r.template_key === "custom") as TemplateRow | undefined;
        if (custom) {
          setCustomSubject(custom.subject ?? "");
          setCustomBody(custom.body ?? "");
          setSignatureState({
            signature_enabled: Boolean(custom.signature_enabled),
            signature_name: custom.signature_name ?? "",
            signature_title: custom.signature_title ?? "",
            signature_phone: custom.signature_phone ?? "",
            signature_website: custom.signature_website ?? "",
            signature_logo_url: custom.signature_logo_url ?? "",
            signature_address: custom.signature_address ?? "",
            signature_cta_text: custom.signature_cta_text ?? "",
            signature_cta_url: custom.signature_cta_url ?? "",
            remove_tellacity_branding: Boolean(custom.remove_tellacity_branding),
            reply_to_email: custom.reply_to_email ?? "",
          });
        } else {
          setCustomSubject("");
          setCustomBody("");
          setSignatureState({
            signature_enabled: false,
            signature_name: "",
            signature_title: "",
            signature_phone: "",
            signature_website: "",
            signature_logo_url: "",
            signature_address: "",
            signature_cta_text: "",
            signature_cta_url: "",
            remove_tellacity_branding: false,
            reply_to_email: "",
          });
        }
        const widget = filteredRows.find((r: { template_key: string }) => r.template_key === "widget") as (TemplateRow & { intro_message?: string | null; layout_style?: string | null }) | undefined;
        setWidgetSubject(widget?.subject ?? "");
        setWidgetIntro((widget as any)?.intro_message ?? "");
        const wls = (widget as { layout_style?: string | null })?.layout_style;
        setWidgetLayoutStyle(
          wls === "elite_branded"
            ? "elite_branded"
            : wls === "review_card"
              ? "review_card"
              : wls === "rating_ladder"
                ? "rating_ladder"
                : "standard",
        );
        if (widget) {
          setWidgetSignature({
            signature_enabled: Boolean(widget.signature_enabled),
            signature_name: widget.signature_name ?? "",
            signature_title: widget.signature_title ?? "",
            signature_phone: widget.signature_phone ?? "",
            signature_website: widget.signature_website ?? "",
            signature_logo_url: widget.signature_logo_url ?? "",
            signature_address: widget.signature_address ?? "",
            signature_cta_text: widget.signature_cta_text ?? "",
            signature_cta_url: widget.signature_cta_url ?? "",
            remove_tellacity_branding: Boolean(widget.remove_tellacity_branding),
            reply_to_email: widget.reply_to_email ?? "",
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email templates.");
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const standardRow = templates.find((t) => t.template_key === "standard");
  const customRow = templates.find((t) => t.template_key === "custom");
  const widgetRow = templates.find((t) => t.template_key === "widget");
  const standardSubject = standardRow?.subject ?? DEFAULT_STANDARD_SUBJECT;
  const standardBody = standardRow?.body ?? DEFAULT_STANDARD_BODY;
  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const canEditCustom = isPlanAtLeastGrow(normalizedPlan);
  const canEditWidget = normalizedPlan === "premium" || normalizedPlan === "elite";

  const saveCustomTemplate = async () => {
    if (!businessId || !canEditCustom) return;
    if (normalizedPlan === "free") {
      return;
    }
    setSavingCustom(true);
    setMessage(null);
    console.log("Saving template start");
    try {
      const basePayload: Partial<TemplateRow> = {
        subject: customSubject || null,
        body: customBody || null,
        updated_at: new Date().toISOString(),
      } as any;

      let payload: any = basePayload;

      if (normalizedPlan === "premium" || normalizedPlan === "elite") {
        payload = {
          ...payload,
          signature_enabled: signatureState.signature_enabled,
          signature_name: signatureState.signature_name || null,
          signature_title: signatureState.signature_title || null,
          signature_phone: signatureState.signature_phone || null,
          signature_website: signatureState.signature_website || null,
          signature_logo_url: signatureState.signature_logo_url || null,
        };
      }

      if (normalizedPlan === "elite") {
        payload = {
          ...payload,
          signature_address: signatureState.signature_address || null,
          signature_cta_text: signatureState.signature_cta_text || null,
          signature_cta_url: signatureState.signature_cta_url || null,
          remove_tellacity_branding: signatureState.remove_tellacity_branding,
          reply_to_email: signatureState.reply_to_email || null,
        };
      }

      if (customRow) {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("review_invite_email_templates")
          .update(payload)
          .eq("id", customRow.id)
          .select()
          .single();
        console.log("Supabase response:", { data, error });
        if (error) {
          setMessage({ type: "error", text: error.message || "Failed to save." });
          return;
        }
      } else {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("review_invite_email_templates")
          .insert({
            business_id: businessId,
            template_key: "custom",
            updated_at: new Date().toISOString(),
            ...payload,
          })
          .select()
          .single();
        console.log("Supabase response:", { data, error });
        if (error) {
          setMessage({ type: "error", text: error.message || "Failed to save." });
          return;
        }
      }
      setMessage({ type: "success", text: "Custom template saved." });
      await fetchData();
    } catch (err) {
      console.error("Save template error:", err);
    } finally {
      console.log("Saving template finally triggered");
      setSavingCustom(false);
    }
  };

  const saveWidgetTemplate = async () => {
    if (!businessId || !canEditWidget) return;
    setSavingWidget(true);
    setWidgetMessage(null);
    try {
      let effectiveLayoutStyle:
        | "standard"
        | "elite_branded"
        | "review_card"
        | "rating_ladder" = "standard";
      if (normalizedPlan === "elite") {
        effectiveLayoutStyle = widgetLayoutStyle;
      } else if (normalizedPlan === "premium") {
        effectiveLayoutStyle =
          widgetLayoutStyle === "elite_branded"
            ? "standard"
            : widgetLayoutStyle;
      } else {
        effectiveLayoutStyle = "standard";
      }

      const payload: Record<string, unknown> = {
        subject: widgetSubject || null,
        intro_message: widgetIntro || null,
        template_type: "email_widget",
        layout_style: effectiveLayoutStyle,
        updated_at: new Date().toISOString(),
        signature_enabled: widgetSignature.signature_enabled,
        signature_name: widgetSignature.signature_name || null,
        signature_title: widgetSignature.signature_title || null,
        signature_phone: widgetSignature.signature_phone || null,
        signature_website: widgetSignature.signature_website || null,
        signature_logo_url: widgetSignature.signature_logo_url || null,
        signature_address: widgetSignature.signature_address || null,
        signature_cta_text: widgetSignature.signature_cta_text || null,
        signature_cta_url: widgetSignature.signature_cta_url || null,
        remove_tellacity_branding: widgetSignature.remove_tellacity_branding,
        reply_to_email: widgetSignature.reply_to_email || null,
      };
      const fallbackPayload: Record<string, unknown> = {
        subject: widgetSubject || null,
        updated_at: new Date().toISOString(),
        signature_enabled: widgetSignature.signature_enabled,
        signature_name: widgetSignature.signature_name || null,
        signature_title: widgetSignature.signature_title || null,
        signature_phone: widgetSignature.signature_phone || null,
        signature_website: widgetSignature.signature_website || null,
        signature_logo_url: widgetSignature.signature_logo_url || null,
        signature_address: widgetSignature.signature_address || null,
        signature_cta_text: widgetSignature.signature_cta_text || null,
        signature_cta_url: widgetSignature.signature_cta_url || null,
        remove_tellacity_branding: widgetSignature.remove_tellacity_branding,
        reply_to_email: widgetSignature.reply_to_email || null,
      };
      if (widgetRow) {
        const supabase = supabaseBrowser();
        const { error } = await supabase
          .from("review_invite_email_templates")
          .update(payload)
          .eq("id", widgetRow.id);
        if (error?.code === "42703") {
          const { error: retryError } = await supabase
            .from("review_invite_email_templates")
            .update(fallbackPayload)
            .eq("id", widgetRow.id);
          if (retryError) {
            setWidgetMessage({
              type: "error",
              text: retryError.message || "Failed to save widget template.",
            });
            return;
          }
        } else if (error) {
          setWidgetMessage({
            type: "error",
            text: error.message || "Failed to save widget template.",
          });
          return;
        }
      } else {
        const supabase = supabaseBrowser();
        const { error } = await supabase
          .from("review_invite_email_templates")
          .insert({ business_id: businessId, template_key: "widget", ...payload });
        if (error?.code === "42703") {
          const { error: retryError } = await supabase
            .from("review_invite_email_templates")
            .insert({
              business_id: businessId,
              template_key: "widget",
              ...fallbackPayload,
            });
          if (retryError) {
            setWidgetMessage({
              type: "error",
              text: retryError.message || "Failed to save widget template.",
            });
            return;
          }
        } else if (error) {
          setWidgetMessage({
            type: "error",
            text: error.message || "Failed to save widget template.",
          });
          return;
        }
      }
      setWidgetMessage({ type: "success", text: "Widget template saved." });
      await fetchData();
    } catch (err) {
      console.error("Save widget template error:", err);
      setWidgetMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save widget template.",
      });
    } finally {
      setSavingWidget(false);
    }
  };

  return (
    <div>
      <SimplePage
        title="Email templates"
        subtitle="Manage templates for review invitation emails."
      />

      <PlanStatusBanner plan={normalizedPlan} />

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">Failed to load email templates.</p>
          <p className="mt-1 text-xs text-red-600/80">{error}</p>
        </div>
      )}

      {message && (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Standard template */}
      <div className="mt-8 rounded-xl border-2 border-[#2fb2a8] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#124541] text-xs font-bold text-white">1</span>
          Standard template
        </h2>
        <p className="mt-1 text-sm text-gray-500">Default subject and body used for review invites.</p>
        {(
          <>
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Subject</div>
              <p className="mt-1 text-sm text-gray-900">{standardSubject}</p>
              <div className="mt-3 text-xs uppercase tracking-wide text-gray-500">Body preview</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{standardBody}</p>
            </div>
          </>
        )}
      </div>

      {/* Custom template */}
      <div className="mt-8 rounded-xl border-2 border-[#2fb2a8] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#124541] text-xs font-bold text-white">2</span>
          Custom template
        </h2>
        <p className="mt-1 text-sm text-gray-500">Customise the subject and body for your review invitation emails.</p>

        {!canEditCustom ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-900">
              Upgrade to access custom email template.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Custom templates are available from the Grow plan and above.
            </p>
            <button
              type="button"
              onClick={() => router.push("/business/dashboard/billing")}
              className="mt-4 rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35]"
            >
              Upgrade from Grow Plan
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <label htmlFor="custom-subject" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Subject
              </label>
              <input
                id="custom-subject"
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. We'd love your feedback"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="custom-body" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Body
              </label>
              <textarea
                id="custom-body"
                rows={6}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Write your custom message…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
              />
            </div>
            <SignatureSection
              plan={normalizedPlan}
              value={signatureState}
              onChange={setSignatureState}
              businessId={businessId}
            />
            {normalizedPlan === "grow" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Custom Email Signature</p>
                <p className="mt-1">
                  Upgrade to Premium to add a branded email signature to your review invites.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/business/dashboard/billing")}
                  className="mt-3 rounded-lg bg-[#124541] px-4 py-2 text-xs font-medium text-white hover:bg-[#0f3a35]"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={savingCustom || !businessId}
                onClick={saveCustomTemplate}
                className="rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35] disabled:opacity-50"
              >
                {savingCustom ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Email Widget template */}
      <div className="mt-8 rounded-xl border-2 border-[#2fb2a8] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#124541] text-xs font-bold text-white">3</span>
          Email Widget Template
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Send a direct review link without consuming invite credits.
        </p>

        {!canEditWidget ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-900">
              Available on Premium and Elite plans.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Upgrade to send direct review links without consuming invite credits.
            </p>
            <button
              type="button"
              onClick={() => router.push("/business/dashboard/billing")}
              className="mt-4 rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35]"
            >
              Upgrade to Premium
            </button>
          </div>
        ) : (
          <>
            {widgetMessage && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  widgetMessage.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
                role="alert"
              >
                {widgetMessage.text}
              </div>
            )}

            {/* Subject */}
            <div className="mt-4">
              <label htmlFor="widget-subject" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Subject
              </label>
              <input
                id="widget-subject"
                type="text"
                value={widgetSubject}
                onChange={(e) => setWidgetSubject(e.target.value)}
                placeholder="e.g. Share your experience with us"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
              />
            </div>

            {/* Intro message */}
            <div className="mt-4">
              <label htmlFor="widget-intro" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Intro message
              </label>
              <p className="mt-0.5 text-xs text-gray-400">
                Appears above the Review Collector block. Keep it short and personal.
              </p>
              <textarea
                id="widget-intro"
                rows={4}
                value={widgetIntro}
                onChange={(e) => setWidgetIntro(e.target.value)}
                placeholder="e.g. We'd love to hear about your experience. It only takes a minute."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
              />
            </div>

            {/* ── Layout Options ── */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Email Layout</h3>
              <p className="mt-0.5 text-xs text-gray-500">Choose how your widget email will look.</p>

              <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Standard Layout card */}
                <button
                  type="button"
                  onClick={() => setWidgetLayoutStyle("standard")}
                  className={`relative rounded-xl border p-4 text-left transition focus:outline-none ${
                    widgetLayoutStyle === "standard"
                      ? "border-[#124541] ring-1 ring-[#124541]"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Review Strip</p>
                    {widgetLayoutStyle === "standard" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-gray-500">Elegant review collector strip</p>
                  <div className="pointer-events-none flex justify-center rounded-lg border border-gray-100 bg-gray-50 px-4 py-5">
                    <TellacityReviewUsBadge size="sm" />
                  </div>
                </button>

                {/* Review showcase — Premium & Elite */}
                <button
                  type="button"
                  onClick={() => {
                    if (normalizedPlan === "premium" || normalizedPlan === "elite") {
                      setWidgetLayoutStyle("review_card");
                    }
                  }}
                  className={`relative rounded-xl border p-4 text-left transition focus:outline-none ${
                    normalizedPlan !== "premium" && normalizedPlan !== "elite"
                      ? "cursor-not-allowed border-dashed border-gray-300 bg-white"
                      : widgetLayoutStyle === "review_card"
                        ? "border-[#124541] ring-1 ring-[#124541]"
                        : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {(normalizedPlan !== "premium" && normalizedPlan !== "elite") && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md">
                      🔒 Locked
                    </div>
                  )}
                  {widgetLayoutStyle === "review_card" &&
                    (normalizedPlan === "premium" || normalizedPlan === "elite") && (
                      <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  <p className="mb-1 text-sm font-semibold text-gray-800">Review showcase</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Card with latest public review, aggregate stats, Tellacity stars (Premium+).
                  </p>
                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 text-left shadow-sm">
                    <div className="h-1 bg-gray-100" />
                    <div className="pt-2">
                      <div className="flex items-start justify-between gap-2">
                        <WidgetStars rating={4} size={10} />
                        <span className="text-[9px] text-gray-400">20 Jun 2019</span>
                      </div>
                      <p className="mt-1 text-[9px] text-gray-400">by Sample Customer</p>
                      <p className="mt-1 text-[11px] font-bold text-gray-900">Recent review</p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-600">
                        Short excerpt from the review…
                      </p>
                    </div>
                    <div className="mt-2 border-t border-gray-100 py-2 text-center text-[9px] text-gray-600">
                      Rated <strong>4.8</strong> out of <strong>5</strong> on{" "}
                      <strong className="text-[#0E0E0E]">Tellacity</strong>
                    </div>
                  </div>
                </button>

                {/* Rating ladder — Premium & Elite */}
                <button
                  type="button"
                  onClick={() => {
                    if (normalizedPlan === "premium" || normalizedPlan === "elite") {
                      setWidgetLayoutStyle("rating_ladder");
                    }
                  }}
                  className={`relative rounded-xl border p-4 text-left transition focus:outline-none ${
                    normalizedPlan !== "premium" && normalizedPlan !== "elite"
                      ? "cursor-not-allowed border-dashed border-gray-300 bg-white"
                      : widgetLayoutStyle === "rating_ladder"
                        ? "border-[#124541] ring-1 ring-[#124541]"
                        : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {(normalizedPlan !== "premium" && normalizedPlan !== "elite") && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md">
                      🔒 Locked
                    </div>
                  )}
                  {widgetLayoutStyle === "rating_ladder" &&
                    (normalizedPlan === "premium" || normalizedPlan === "elite") && (
                      <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  <p className="mb-1 text-sm font-semibold text-gray-800">Rating ladder</p>
                  <p className="mb-3 text-xs text-gray-500">
                    &quot;How did we do?&quot; rows; each row links to your review page with that rating (Tellacity stars).
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-left">
                    <p className="mb-1.5 text-center text-[9px] font-bold text-gray-800 underline">How did we do?</p>
                    {[5, 4, 3].map((r) => (
                      <div key={r} className="flex items-center gap-2 border-b border-gray-50 py-1 last:border-0">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300" />
                        <WidgetStars rating={r} size={9} />
                      </div>
                    ))}
                  </div>
                </button>

                {/* Elite Branded Layout card */}
                <div
                  onClick={() => { if (normalizedPlan === "elite") setWidgetLayoutStyle("elite_branded"); }}
                  className={`relative rounded-xl border p-4 transition ${
                    normalizedPlan !== "elite"
                      ? "cursor-not-allowed border-dashed border-gray-300 bg-white"
                      : widgetLayoutStyle === "elite_branded"
                      ? "cursor-pointer border-[#124541] ring-1 ring-[#124541]"
                      : "cursor-pointer border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {/* Lock badge for non-elite */}
                  {normalizedPlan !== "elite" && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md">
                      🔒 Locked
                    </div>
                  )}
                  {/* Selected checkmark for elite */}
                  {normalizedPlan === "elite" && widgetLayoutStyle === "elite_branded" && (
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
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                      {businessLogoUrl ? (
                        <img src={businessLogoUrl} alt={selectedBusiness?.name ?? ""} className="mx-auto mb-2 h-10 object-contain" />
                      ) : (
                        <div className="mx-auto mb-2 flex h-10 w-16 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">logo</div>
                      )}
                      <p className="text-sm font-semibold tracking-wide text-gray-800">{selectedBusiness?.name ?? "Your Business"}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="mb-2 text-xs font-semibold text-gray-800">Tell us about your experience</p>
                      <div className="flex justify-center">
                        <TellacityStarStrip size={11} />
                      </div>
                      <div
                        className="mt-2 inline-block rounded border px-3 py-1 text-[11px] font-semibold leading-tight bg-transparent"
                        style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                      >
                        Leave a Review
                      </div>
                      <p className="mt-2 text-center text-[10px] leading-snug text-gray-400">
                        Verified reviews powered by{" "}
                        <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                      </p>
                    </div>
                  </div>

                  {/* Upgrade nudge for non-elite */}
                  {normalizedPlan !== "elite" && (
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-600">Upgrade to Elite to use branded email layout</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); router.push("/business/dashboard/billing"); }}
                        className="mt-2 rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Full email preview (matches Email Widgets page) ── */}
            <div className="mt-6">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Email preview <span className="normal-case font-normal text-gray-400">(reflects your subject, intro &amp; layout)</span>
              </span>

              {/* Layout badge */}
              <div className="mt-2">
                {widgetLayoutStyle === "elite_branded" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#124541] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <span>★</span> Elite Branded Layout
                  </span>
                ) : widgetLayoutStyle === "review_card" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#124541] bg-[#f0faf8] px-2.5 py-1 text-[11px] font-semibold text-[#124541]">
                    Review showcase
                  </span>
                ) : widgetLayoutStyle === "rating_ladder" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#124541] bg-[#f0faf8] px-2.5 py-1 text-[11px] font-semibold text-[#124541]">
                    Rating ladder
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                    Standard Layout
                  </span>
                )}
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-[#f4f6f8]">
                <div className="mx-auto max-w-[560px] bg-white">

                  {/* Subject bar */}
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Subject: </span>
                    {widgetSubject.trim() || "Share your experience with us"}
                  </div>

                  {/* Elite branded header */}
                  {widgetLayoutStyle === "elite_branded" && (
                    <div className="border-b border-gray-100 px-5 py-5 text-center">
                      {businessLogoUrl ? (
                        <img src={businessLogoUrl} alt={selectedBusiness?.name ?? ""} className="mx-auto mb-3 max-h-12 object-contain" />
                      ) : (
                        <div className="mx-auto mb-3 flex h-10 items-center justify-center">
                          <div className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-400">[Business logo]</div>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900">{selectedBusiness?.name ?? "Your Business"}</p>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-6">
                    <p className="text-sm leading-relaxed text-gray-700">
                      {widgetIntro.trim() || "We'd love to hear about your experience. It only takes a minute."}
                    </p>

                    {widgetLayoutStyle === "rating_ladder" ? (
                      <>
                        <p className="mt-4 text-base font-bold text-gray-900 underline">How did we do?</p>
                        <div className="my-4 overflow-hidden rounded-md border border-gray-200 bg-white">
                          {[5, 4, 3, 2, 1].map((r) => (
                            <div
                              key={r}
                              className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
                            >
                              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
                              <WidgetStars rating={r} size={11} />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs leading-relaxed text-gray-600">
                          Each row links to the invite-style review form with that star count pre-selected (Tellacity tier stars).
                        </p>
                        <p className="mt-3 text-center text-[11px] text-gray-500">
                          Verified reviews powered by{" "}
                          <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                        </p>
                      </>
                    ) : widgetLayoutStyle === "review_card" ? (
                      <>
                        <div className="my-5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                          <div className="h-2 bg-gray-100" />
                          <div className="px-5 py-4 text-left">
                            <div className="flex items-start justify-between gap-3">
                              <WidgetStars rating={4} size={11} />
                              <span className="shrink-0 text-xs text-gray-400">20 Jun 2019</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400">by Sample Customer</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">Your latest public review</p>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">
                              Sent emails use your most recent published, visible review and live stats from Tellacity.
                            </p>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-600">
                            Rated <strong>4.8</strong> out of <strong>5</strong> | <strong>1,672</strong> reviews on{" "}
                            <strong className="text-[#0E0E0E]">Tellacity</strong>
                          </div>
                          <div className="h-2 bg-gray-100" />
                        </div>
                        <div className="text-center">
                          <span
                            className="inline-block rounded border px-4 py-1.5 text-xs font-semibold leading-tight"
                            style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                          >
                            Leave a review
                          </span>
                        </div>
                        <p className="mt-3 text-center text-[11px] text-gray-500">
                          Verified reviews powered by{" "}
                          <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                        </p>
                      </>
                    ) : (
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
                    )}

                    {/* Signature hint */}
                    {widgetSignature.signature_enabled && widgetSignature.signature_name && (
                      <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{widgetSignature.signature_name}</span>
                        {" - email signature included"}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Signature */}
            <SignatureSection
              plan={normalizedPlan}
              value={widgetSignature}
              onChange={setWidgetSignature}
              businessId={businessId}
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={savingWidget || !businessId}
                onClick={saveWidgetTemplate}
                className="rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35] disabled:opacity-50"
              >
                {savingWidget ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
