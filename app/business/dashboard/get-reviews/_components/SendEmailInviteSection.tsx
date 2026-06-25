"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  canAccessEmailWidget,
  canUseCustomEmail,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";
import {
  GrowUnlockButton,
  GrowUnlockError,
} from "@/components/dashboard/GrowUnlockCta";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";

type TemplateChoice = "standard" | "custom" | "widget";

type Props = {
  businessId: string;
  plan: string | null | undefined;
  trialEligible: boolean;
  subscriptionStatus?: string | null;
  onInviteSent?: () => void;
  onTrialStarted?: () => void;
};

export default function SendEmailInviteSection({
  businessId,
  plan,
  trialEligible,
  subscriptionStatus,
  onInviteSent,
  onTrialStarted,
}: Props) {
  const [templateChoice, setTemplateChoice] = useState<TemplateChoice>("standard");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [inviteLimitModalOpen, setInviteLimitModalOpen] = useState(false);

  const normalizedPlan: PlanKey = normalizePlanCodeToKey(plan);
  const canChooseCustom = canUseCustomEmail(normalizedPlan);
  const canChooseWidget = canAccessEmailWidget(normalizedPlan, "premium_layout");

  const growUnlock = useGrowUnlockCta({
    businessId,
    currentPlan: normalizedPlan,
    trialEligible,
    subscriptionStatus,
    onTrialStarted,
    paidDestination: {
      type: "href",
      href: "/business/dashboard/settings/usage",
    },
  });

  const isInviteLimitReached = monthlyLimit > 0 && monthlyUsage >= monthlyLimit;

  const openInviteLimitModal = () => {
    logDashboardActivityClient({
      businessId,
      action: "invite_limit_hit",
    });
    setInviteLimitModalOpen(true);
  };

  const fetchUsage = useCallback(async () => {
    if (!businessId) {
      setMonthlyUsage(0);
      setMonthlyLimit(0);
      return;
    }
    try {
      const data = await dashboardApiPost<{
        monthlyCount: number;
        limit: number;
      }>("/api/review-invites/usage", { businessId });
      setMonthlyUsage(data.monthlyCount);
      setMonthlyLimit(data.limit);
    } catch {
      setMonthlyUsage(0);
      setMonthlyLimit(0);
    }
  }, [businessId]);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (!canChooseCustom && templateChoice === "custom") {
      setTemplateChoice("standard");
    }
  }, [canChooseCustom, templateChoice]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !recipientEmail.trim()) return;
    setError(null);
    setSuccess(false);

    const effectiveTemplate: TemplateChoice =
      templateChoice === "widget" && canChooseWidget
        ? "widget"
        : templateChoice === "custom" && canChooseCustom
          ? "custom"
          : "standard";

    if (effectiveTemplate !== "widget" && isInviteLimitReached) {
      openInviteLimitModal();
      return;
    }

    setLoading(true);

    try {
      if (effectiveTemplate === "widget") {
        const res = await fetch("/api/email-widget/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            recipients: [recipientEmail.trim()],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data.error as string) || "Failed to send widget email.");
          return;
        }
      } else {
        const res = await fetch("/api/review-invites/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            recipientEmail: recipientEmail.trim(),
            template: effectiveTemplate,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = String((data as { error?: string }).error || "");
          if (
            res.status === 403 &&
            errMsg.toLowerCase().includes("monthly invite limit")
          ) {
            void fetchUsage();
            openInviteLimitModal();
            return;
          }
          setError(errMsg || "Failed to send invite.");
          return;
        }
      }
      setSuccess(true);
      setRecipientEmail("");
      void fetchUsage();
      onInviteSent?.();
    } catch {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        id="send-invite"
        className="scroll-mt-24 mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-gray-900">
          Send email invite
          <AvailableToUseLabel />
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Send a one-off review invitation to a customer by email.
        </p>

        <div className="mt-6">
          <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Email template
          </span>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 transition has-[:checked]:border-[#124541] has-[:checked]:ring-1 has-[:checked]:ring-[#124541]">
              <input
                type="radio"
                name="template"
                value="standard"
                checked={templateChoice === "standard"}
                onChange={() => setTemplateChoice("standard")}
                className="h-4 w-4 border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-900">
                Standard
                <AvailableToUseLabel />
              </span>
            </label>
            <label
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition ${
                canChooseCustom
                  ? "cursor-pointer border-gray-200 bg-white has-[:checked]:border-[#124541] has-[:checked]:ring-1 has-[:checked]:ring-[#124541]"
                  : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              <input
                type="radio"
                name="template"
                value="custom"
                checked={templateChoice === "custom"}
                onChange={() => canChooseCustom && setTemplateChoice("custom")}
                disabled={!canChooseCustom}
                className="h-4 w-4 border-gray-300 text-[#124541] focus:ring-[#124541] disabled:cursor-not-allowed"
              />
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-900">
                Custom
                {canChooseCustom ? <AvailableToUseLabel /> : null}
              </span>
              {!canChooseCustom && (
                <span className="text-xs text-amber-800">
                  🔒 Custom emails available on Grow and above
                </span>
              )}
            </label>
            <label
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition ${
                canChooseWidget
                  ? "cursor-pointer border-gray-200 bg-white has-[:checked]:border-[#124541] has-[:checked]:ring-1 has-[:checked]:ring-[#124541]"
                  : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              <input
                type="radio"
                name="template"
                value="widget"
                checked={templateChoice === "widget"}
                onChange={() => canChooseWidget && setTemplateChoice("widget")}
                disabled={!canChooseWidget}
                className="h-4 w-4 border-gray-300 text-[#124541] focus:ring-[#124541] disabled:cursor-not-allowed"
              />
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-900">
                Email Widget
                {canChooseWidget ? <AvailableToUseLabel /> : null}
              </span>
            </label>
          </div>
          {templateChoice === "widget" && canChooseWidget && (
            <p className="mt-2 text-xs text-gray-500">
              Sends a direct review link — no invite token generated, no credits consumed.
            </p>
          )}
        </div>

        <form onSubmit={handleSendInvite} className="mt-6 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="invite-email" className="sr-only">
              Recipient email
            </label>
            <input
              id="invite-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              required
              disabled={!businessId || loading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0E0E0E] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={!businessId || loading}
            className="rounded-lg bg-[#124541] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "Sending…" : "Send invite"}
          </button>
        </form>
        {success && (
          <p className="mt-3 text-sm font-medium text-green-700">Invite sent.</p>
        )}
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {inviteLimitModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setInviteLimitModalOpen(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-limit-title"
          >
            <h2 id="invite-limit-title" className="text-lg font-semibold text-[#0E0E0E]">
              You&apos;ve reached your limit
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Upgrade your plan to continue sending review invitations and keep growing your
              feedback. New review requests will stop until you upgrade.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setInviteLimitModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <GrowUnlockButton
                {...growUnlock}
                onClick={() => {
                  setInviteLimitModalOpen(false);
                  growUnlock.onClick();
                }}
              />
            </div>
            <GrowUnlockError message={growUnlock.errorMessage} className="mt-4" />
          </div>
        </div>
      ) : null}
    </>
  );
}
