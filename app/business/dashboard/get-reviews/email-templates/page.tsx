"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import {
  canUseCustomEmail,
  normalizePlanCodeToKey,
  nextTierUpgradeCtaLabel,
  type PlanKey,
} from "@/lib/plans";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import SignatureSection, { SignatureState } from "@/components/reviews/email-templates/SignatureSection";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import {
  DEFAULT_GROW_MESSAGE_STYLE,
  INVITE_FONT_CSS,
  INVITE_FONT_KEYS,
  INVITE_TEXT_COLOR_PRESETS,
  parseGrowMessageStyle,
  sanitizeGrowMessageStyleForDb,
  type GrowMessageStyle,
  type InviteFontKey,
} from "@/lib/reviewInviteGrowStyle";

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
  grow_message_style?: unknown;
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
  const [customSaveGateOpen, setCustomSaveGateOpen] = useState(false);
  const [saveBlockedAttempted, setSaveBlockedAttempted] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [growStyle, setGrowStyle] = useState<GrowMessageStyle>(DEFAULT_GROW_MESSAGE_STYLE);
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
          setGrowStyle(parseGrowMessageStyle(custom.grow_message_style));
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
          setGrowStyle(DEFAULT_GROW_MESSAGE_STYLE);
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
  const isPremiumOrElite = normalizedPlan === "premium" || normalizedPlan === "elite";
  const [premiumFeaturesOpen, setPremiumFeaturesOpen] = useState(isPremiumOrElite);

  useEffect(() => {
    setPremiumFeaturesOpen(isPremiumOrElite);
  }, [isPremiumOrElite]);

  const saveCustomTemplate = async () => {
    if (!businessId || !canEditCustom) return;
    setSavingCustom(true);
    setMessage(null);
    console.log("Saving template start");
    try {
      const basePayload: Partial<TemplateRow> = {
        subject: customSubject || null,
        body: customBody || null,
        grow_message_style: sanitizeGrowMessageStyleForDb(growStyle) as any,
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

  const requestSaveCustomTemplate = () => {
    if (!businessId) return;
    if (!canEditCustom) {
      setSaveBlockedAttempted(true);
      setCustomSaveGateOpen(true);
      return;
    }
    void saveCustomTemplate();
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
          {canEditCustom ? <AvailableToUseLabel /> : (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Preview
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-800">Grow</span> is your custom wording (subject and body).{" "}
          <span className="font-medium text-gray-800">Premium</span> adds logo and company signature on sends.{" "}
          <span className="font-medium text-gray-800">Elite</span> adds reply-to, CTAs, and footer branding.
        </p>
        {!canEditCustom ? (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
            You can draft your Grow message here on any plan. Saving it to your live template needs{" "}
            <span className="font-semibold">Grow</span> or higher, use <span className="font-semibold">Save</span>{" "}
            to see upgrade options.
          </p>
        ) : null}

        <>
          {/* Grow: text-only customisation (what Grow actually includes) */}
          <div className="mt-5 rounded-xl border-2 border-[#2fb2a8]/50 bg-[#f4fbfa] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#124541] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Grow
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Your message</h3>
              {normalizedPlan === "grow" && canEditCustom ? (
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-800">
                  Included in your plan
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Grow covers the words in the email above the review link, not the branded footer block. Expand
              Premium below to work on signature and logo.
            </p>
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
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0E0E0E]"
                style={{
                  fontFamily: INVITE_FONT_CSS[growStyle.subjectFont],
                  color: growStyle.subjectColor,
                  fontWeight: growStyle.subjectBold ? 700 : 400,
                }}
              />
              <div className="mt-2 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-gray-200 bg-white/60 px-3 py-2.5">
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">Subject font</span>
                  <select
                    aria-label="Subject font"
                    value={growStyle.subjectFont}
                    onChange={(e) => {
                      const v = e.target.value;
                      if ((INVITE_FONT_KEYS as readonly string[]).includes(v)) {
                        setGrowStyle({ ...growStyle, subjectFont: v as InviteFontKey });
                      }
                    }}
                    className="mt-0.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900"
                  >
                    {INVITE_FONT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">Subject colour</span>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {INVITE_TEXT_COLOR_PRESETS.map((c) => (
                      <button
                        key={`subj-${c}`}
                        type="button"
                        aria-label={`Subject colour ${c}`}
                        title={c}
                        onClick={() => setGrowStyle({ ...growStyle, subjectColor: c })}
                        className={`h-7 w-7 rounded-full border-2 shadow-sm ${growStyle.subjectColor === c ? "border-gray-900" : "border-white"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 pb-0.5 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
                    checked={growStyle.subjectBold}
                    onChange={(e) => setGrowStyle({ ...growStyle, subjectBold: e.target.checked })}
                  />
                  Bold subject
                </label>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                Inboxes usually show the subject in plain text; this preview matches your picks where the app can.
              </p>
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
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0E0E0E]"
                style={{
                  fontFamily: INVITE_FONT_CSS[growStyle.bodyFont],
                  color: growStyle.bodyColor,
                  fontWeight: growStyle.bodyBold ? 700 : 400,
                }}
              />
              <div className="mt-2 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-gray-200 bg-white/60 px-3 py-2.5">
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">Body font</span>
                  <select
                    aria-label="Body font"
                    value={growStyle.bodyFont}
                    onChange={(e) => {
                      const v = e.target.value;
                      if ((INVITE_FONT_KEYS as readonly string[]).includes(v)) {
                        setGrowStyle({ ...growStyle, bodyFont: v as InviteFontKey });
                      }
                    }}
                    className="mt-0.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900"
                  >
                    {INVITE_FONT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">Body colour</span>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {INVITE_TEXT_COLOR_PRESETS.map((c) => (
                      <button
                        key={`body-${c}`}
                        type="button"
                        aria-label={`Body colour ${c}`}
                        title={c}
                        onClick={() => setGrowStyle({ ...growStyle, bodyColor: c })}
                        className={`h-7 w-7 rounded-full border-2 shadow-sm ${growStyle.bodyColor === c ? "border-gray-900" : "border-white"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 pb-0.5 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
                    checked={growStyle.bodyBold}
                    onChange={(e) => setGrowStyle({ ...growStyle, bodyBold: e.target.checked })}
                  />
                  Bold body
                </label>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                These body choices are applied in the HTML email your customers receive.
              </p>
            </div>
          </div>

          {/* Premium+: collapsible so Grow users are not overwhelmed */}
          <div className="mt-5 overflow-hidden rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-white">
            <button
              type="button"
              id="premium-email-features-toggle"
              aria-expanded={premiumFeaturesOpen}
              aria-controls="premium-email-features-panel"
              onClick={() => setPremiumFeaturesOpen((o) => !o)}
              className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-indigo-50/80 sm:items-center sm:px-5"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-indigo-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Premium
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">Branded signature and logo</span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  Full control of how your business appears on every invite. Elite-only controls stay inside
                  under “Elite email options”.
                </span>
              </span>
              {premiumFeaturesOpen ? (
                <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-indigo-800" aria-hidden />
              ) : (
                <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-indigo-800" aria-hidden />
              )}
            </button>

            {premiumFeaturesOpen ? (
              <div
                id="premium-email-features-panel"
                role="region"
                aria-labelledby="premium-email-features-toggle"
                className="border-t border-indigo-100 px-4 pb-5 pt-2 sm:px-5"
              >
                <SignatureSection
                  plan={normalizedPlan}
                  value={signatureState}
                  onChange={setSignatureState}
                  businessId={businessId}
                  suppressTeaser
                />
              </div>
            ) : (
              <p className="border-t border-indigo-100 px-4 py-3 text-xs text-gray-600 sm:px-5">
                Collapsed, open to preview or edit signature, logo, and (for Elite) reply-to and CTAs.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={savingCustom || !businessId}
              onClick={requestSaveCustomTemplate}
              aria-label={
                canEditCustom
                  ? savingCustom
                    ? "Saving template"
                    : "Save custom template"
                  : "Save opens upgrade options for your plan"
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35] disabled:opacity-50"
            >
              {saveBlockedAttempted && !canEditCustom ? (
                <Lock className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              ) : null}
              {savingCustom ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      </div>

      {customSaveGateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px]"
            aria-label="Close upgrade dialog"
            onClick={() => setCustomSaveGateOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900/90 px-7 py-8 text-left shadow-2xl backdrop-blur-md sm:px-8 sm:py-9"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-template-save-gate-title"
          >
            <p className="text-center text-2xl" aria-hidden>
              🔒
            </p>
            <h3
              id="custom-template-save-gate-title"
              className="mt-1 text-center text-lg font-semibold text-neutral-100"
            >
              Save a custom invite template
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-400">
              You can draft your message on any plan. Saving it to your live template (and sending it
              to customers) unlocks on <strong className="text-neutral-100">Grow</strong> and above.
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-neutral-200">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-neutral-100">Grow:</strong> your own subject and full message.
                  Save, edit, and send on-brand review invites anytime.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-neutral-100">Premium:</strong> branded{" "}
                  <strong className="text-neutral-100">company signature</strong> with logo, name, title,
                  phone, and website on every invite.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-neutral-100">Elite:</strong> custom reply-to address, signature
                  call-to-action links, address line, and optional removal of Tellacity branding in the
                  footer.
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setCustomSaveGateOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-transparent px-6 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-white/5 sm:w-auto"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => router.push("/business/dashboard/settings/usage")}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-[#2fb2a8] sm:w-auto"
              >
                {nextTierUpgradeCtaLabel(normalizedPlan)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
