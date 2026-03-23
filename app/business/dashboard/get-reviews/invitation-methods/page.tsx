"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import type { PlanKey } from "@/lib/plans";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";

type TemplateChoice = "standard" | "custom" | "widget";

function isPlanAtLeastGrow(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "grow" || p === "premium" || p === "elite";
}

function isPremiumOrElite(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "premium" || p === "elite";
}

export default function InvitationMethodsPage() {
  const router = useRouter();
  const { selectedBusiness, isLoading } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;

  const [templateChoice, setTemplateChoice] = useState<TemplateChoice>("standard");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <SimplePage
          title="Send Invitation"
          subtitle="Collect verified customer feedback through automated invites."
        />
        <div className="mt-8 h-48 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }
  if (!selectedBusiness) {
    return (
      <div>
        <SimplePage
          title="Send Invitation"
          subtitle="Collect verified customer feedback through automated invites."
        />
        <p className="mt-6 text-sm text-gray-600">
          Select a business from the switcher to send invitations.
        </p>
      </div>
    );
  }

  const normalizedPlan: PlanKey = selectedBusiness.plan as PlanKey;
  const canChooseCustom = isPlanAtLeastGrow(normalizedPlan);
  const canChooseWidget = isPremiumOrElite(normalizedPlan);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !recipientEmail.trim()) return;
    setError(null);
    setSuccess(false);
    setLoading(true);

    const effectiveTemplate: TemplateChoice =
      templateChoice === "widget" && canChooseWidget
        ? "widget"
        : templateChoice === "custom" && canChooseCustom
        ? "custom"
        : "standard";

    try {
      if (effectiveTemplate === "widget") {
        // Widget send: no token, no quota
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
          setError((data.error as string) || "Failed to send invite.");
          return;
        }
      }
      setSuccess(true);
      setRecipientEmail("");
    } catch {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SimplePage
        title="Send Invitation"
        subtitle="Collect verified customer feedback through automated invites."
      />

      <PlanStatusBanner plan={normalizedPlan} />

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Send email invite</h2>
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
              <span className="text-sm font-medium text-gray-900">Standard</span>
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
              <span className="text-sm font-medium text-gray-900">Custom</span>
              {!canChooseCustom && (
                <span className="text-xs text-gray-500">(Grow plan and above)</span>
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
              <span className="text-sm font-medium text-gray-900">Email Widget</span>
              {!canChooseWidget && (
                <span className="text-xs text-gray-500">(Premium and above)</span>
              )}
            </label>
          </div>
          {templateChoice === "widget" && canChooseWidget && (
            <p className="mt-2 text-xs text-gray-500">
              Sends a direct review link - no invite token generated, no credits consumed.
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
        {error && (() => {
          const isLimitError = error?.toLowerCase().includes("monthly invite limit");
          if (isLimitError) {
            return (
              <div className="mt-4 p-5 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-teal-500" />

                <p className="text-sm font-semibold text-gray-900">
                  You've reached your monthly invite limit.
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  Upgrade your plan to continue collecting verified reviews and unlock more visibility.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-black text-white font-medium shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Upgrade Plan to Continue
                </button>
              </div>
            );
          }
          return (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          );
        })()}
      </div>
    </div>
  );
}
