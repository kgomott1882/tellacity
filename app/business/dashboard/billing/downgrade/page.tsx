"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BillingOverviewResponse } from "@/lib/billingOverview";
import { planRank } from "@/lib/billingPlanRank";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

const PLAN_BLURBS: Record<PlanKey, string> = {
  free: "Basic review collection for getting started.",
  grow: "Growth tools for steady review volume and stronger visibility.",
  premium: "Advanced automation and analytics for scaling teams.",
  elite: "Enterprise-grade review management with strategic oversight.",
};

/** Highest rank first among valid downgrade targets (e.g. Premium → Grow, then Free). */
const LOWER_CANDIDATE_ORDER: PlanKey[] = ["elite", "premium", "grow", "free"];

function formatBillingInstant(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function BillingDowngradePage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;

  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<PlanKey | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<{ target: PlanKey; atIso: string } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const currentPlan = useMemo(
    () => normalizePlanCodeToKey(overview?.current?.plan_code ?? null),
    [overview?.current?.plan_code]
  );

  const periodEndIso = overview?.current?.current_period_end?.trim() || null;
  const periodEndLabel = periodEndIso ? formatBillingInstant(periodEndIso) : null;

  const lowerTargets = useMemo(() => {
    const r = planRank(currentPlan);
    return LOWER_CANDIDATE_ORDER.filter((k) => planRank(k) < r);
  }, [currentPlan]);

  const loadOverview = useCallback(async () => {
    if (!businessId) return;
    setLoadError(null);
    try {
      const data = await dashboardApiGet<BillingOverviewResponse>(
        `/api/billing/overview?businessId=${encodeURIComponent(businessId)}`
      );
      setOverview(data);
      const pending = data.current?.pending_plan_code?.trim();
      const at = data.current?.pending_change_at?.trim();
      if (pending && at) {
        setScheduled({
          target: normalizePlanCodeToKey(pending),
          atIso: at,
        });
      } else {
        setScheduled(null);
      }
    } catch {
      setOverview(null);
      setLoadError("Could not load billing details.");
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadOverview();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, loadOverview]);

  const handleCancelDowngrade = async () => {
    if (!businessId) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel the scheduled downgrade?"
    );
    if (!confirmed) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/billing/cancel-downgrade", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Failed to cancel downgrade"
        );
      }

      await loadOverview();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel downgrade");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDowngrade = async (targetPlan: PlanKey) => {
    if (!businessId || scheduled) return;
    setActionError(null);
    setCancelError(null);
    setSubmitting(targetPlan);
    try {
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, targetPlan }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        target_plan?: string;
        pending_change_at?: string;
      };
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not schedule downgrade.");
        return;
      }
      const tgt = typeof data.target_plan === "string" ? normalizePlanCodeToKey(data.target_plan) : targetPlan;
      const at =
        typeof data.pending_change_at === "string" && data.pending_change_at.trim()
          ? data.pending_change_at.trim()
          : periodEndIso ?? "";
      setScheduled({ target: tgt, atIso: at });
      await loadOverview();
    } catch {
      setActionError("Could not schedule downgrade.");
    } finally {
      setSubmitting(null);
    }
  };

  if (!businessId) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SimplePage
          title="Downgrade your plan"
          subtitle="Your downgrade will take effect at the end of your billing period."
        />
        <button
          type="button"
          onClick={() => router.push("/business/dashboard/settings/billing-profile")}
          className="shrink-0 text-sm font-medium text-[#124541] underline-offset-2 hover:underline"
        >
          Back to billing settings
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-red-700" role="alert">
          {loadError}
        </p>
      ) : currentPlan === "free" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">
            You are already on the Free plan. There is no lower plan to switch to.
          </p>
          <Link
            href="/business/dashboard/settings/usage"
            className="mt-4 inline-flex text-sm font-semibold text-[#124541] underline-offset-2 hover:underline"
          >
            View plans to upgrade
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Current plan</h2>
            <p className="mt-2 text-2xl font-semibold text-[#0E0E0E]">{PLAN_LABELS[currentPlan]}</p>
            <p className="mt-4 text-sm text-gray-600">
              Next billing date
              {periodEndLabel ? (
                <>
                  : <span className="font-semibold text-[#0E0E0E]">{periodEndLabel}</span>
                </>
              ) : (
                <span className="text-amber-800"> — not set yet. Complete a paid checkout first, or contact support.</span>
              )}
            </p>
          </section>

          {scheduled ? (
            <div
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              role="status"
            >
              <p className="text-sm font-medium text-[#0E0E0E]">
                Your plan will change to {PLAN_LABELS[scheduled.target]} on{" "}
                {formatBillingInstant(scheduled.atIso)}.
              </p>
              <button
                type="button"
                onClick={() => void handleCancelDowngrade()}
                disabled={cancelLoading}
                className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLoading ? "Cancelling..." : "Cancel downgrade"}
              </button>
              {cancelError ? (
                <p className="mt-2 text-sm text-red-500" role="alert">
                  {cancelError}
                </p>
              ) : null}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
              {actionError}
            </div>
          ) : null}

          {!scheduled ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#0E0E0E]">Choose a lower plan</h2>
              <p className="text-sm text-gray-600">
                You will keep your current features until the date above. Upgrades are not available on this page.
              </p>
              <ul className="space-y-4">
                {lowerTargets.map((key) => (
                  <li
                    key={key}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0E0E0E]">{PLAN_LABELS[key]}</h3>
                        <p className="mt-1 text-sm text-gray-600">{PLAN_BLURBS[key]}</p>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(submitting) || Boolean(scheduled) || !periodEndIso}
                        onClick={() => void handleDowngrade(key)}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#124541] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting === key ? "Saving…" : `Downgrade to ${PLAN_LABELS[key]}`}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
