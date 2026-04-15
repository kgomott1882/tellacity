"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import {
  canAccessAnalytics,
  canUseCustomEmail,
  normalizePlanCodeToKey,
  nextTierUpgradeCtaLabel,
  type PlanKey,
} from "@/lib/plans";
import SignatureSection, { SignatureState } from "@/components/reviews/email-templates/SignatureSection";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";

const DEFAULT_STANDARD_SUBJECT = "You're invited to leave a review";
const DEFAULT_STANDARD_BODY =
  "You've been invited to leave a review.\n\nClick the link in this email to leave your review. If the button doesn't work, copy and paste the link into your browser.";

/**
 * Polished demo only: always shown when custom email is locked so the paywall
 * never surfaces half-finished drafts from the database.
 */
const LOCKED_CUSTOM_PREVIEW_SUBJECT = "How was your experience with us?";
const LOCKED_CUSTOM_PREVIEW_BODY =
  "Hi there,\n\nWe hope your recent visit lived up to what we promised. Honest feedback helps us improve and helps other customers choose with confidence.\n\nWhen you have a moment, use the secure review link in this email. It only takes a minute.\n\nWith thanks,\nYour team at [Your business]\n\nA personalised review button is added automatically below this message.";

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
      const templatesResponse = await fetch("/api/review-invite-email-templates", { method: "GET" });

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
        .filter((r) => ["standard", "custom"].includes(r.template_key))
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
  const standardSubject = standardRow?.subject ?? DEFAULT_STANDARD_SUBJECT;
  const standardBody = standardRow?.body ?? DEFAULT_STANDARD_BODY;
  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const canEditCustom = canUseCustomEmail(normalizedPlan);

  const saveCustomTemplate = async () => {
    if (!businessId || !canEditCustom) return;
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

      if (canAccessAnalytics(normalizedPlan)) {
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
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-gray-900">
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#124541] text-xs font-bold text-white">
              1
            </span>
            Standard template
          </span>
          <AvailableToUseLabel />
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
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-gray-900">
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#124541] text-xs font-bold text-white">
              2
            </span>
            Custom template
          </span>
          {canEditCustom ? <AvailableToUseLabel /> : null}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Customise the subject and body for your review invitation emails. Higher tiers add branded
          signatures and advanced sending options.
        </p>

        {!canEditCustom ? (
          <div className="relative mt-6 min-h-[min(520px,70vh)] overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
            <div className="pointer-events-none select-none p-4 sm:p-5">
              <div className="mt-0">
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Subject
                </span>
                <div className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm">
                  {LOCKED_CUSTOM_PREVIEW_SUBJECT}
                </div>
              </div>
              <div className="mt-4">
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Body
                </span>
                <div className="mt-1 min-h-[9rem] w-full whitespace-pre-wrap rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-800 shadow-sm">
                  {LOCKED_CUSTOM_PREVIEW_BODY}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-[#2fb2a8]/40 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#124541]">
                  Company signature
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Example: unlock on Premium with logo, name, role, and contact lines
                </p>
                <div className="mt-3 flex gap-3 border-t border-gray-100 pt-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-[10px] font-medium text-gray-400"
                    aria-hidden
                  >
                    Logo
                  </div>
                  <div className="min-w-0 text-xs leading-snug text-gray-700">
                    <p className="text-sm font-semibold text-gray-900">Jordan Lee</p>
                    <p className="text-gray-600">Head of Customer Experience</p>
                    <p className="mt-1 font-medium text-[#124541]">www.yourcompany.com</p>
                    <p className="text-gray-500">+1 (555) 010-0142</p>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="absolute inset-0 z-20 rounded-xl bg-neutral-950/40 backdrop-blur-[2px]"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6">
              <div
                className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900/80 px-7 py-8 text-left shadow-2xl backdrop-blur-md sm:px-8 sm:py-9"
                role="region"
                aria-label="Custom email template requires an upgrade"
              >
                <p className="text-center text-2xl" aria-hidden>
                  🔒
                </p>
                <h3 className="mt-1 text-center text-lg font-semibold text-neutral-100">
                  Email invites that feel unmistakably yours
                </h3>
                <p className="mt-2 text-center text-sm text-neutral-400">
                  Everything in the preview behind this card is included when you unlock the right
                  plan.
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-neutral-200">
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                      ✓
                    </span>
                    <span>
                      <strong className="text-neutral-100">Grow:</strong> your own subject and full
                      message. Save, edit, and send on-brand review invites anytime.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                      ✓
                    </span>
                    <span>
                      <strong className="text-neutral-100">Premium:</strong> branded{" "}
                      <strong className="text-neutral-100">company signature</strong> with logo, name,
                      title, phone, and website on every invite.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                      ✓
                    </span>
                    <span>
                      <strong className="text-neutral-100">Elite:</strong> custom reply-to address,
                      signature call-to-action links, address line, and optional removal of Tellacity
                      branding in the footer.
                    </span>
                  </li>
                </ul>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push("/business/dashboard/billing")}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-[#2fb2a8] sm:w-auto"
                  >
                    {nextTierUpgradeCtaLabel(normalizedPlan)}
                  </button>
                </div>
              </div>
            </div>
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
    </div>
  );
}
