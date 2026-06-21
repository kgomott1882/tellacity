"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getGrowUnlockLabel,
  resolveGrowUnlockMode,
  type GrowUnlockMode,
} from "@/lib/growUnlockCta";
import { startGrowTrial } from "@/lib/startGrowTrialClient";
import type { PlanKey } from "@/lib/plans";

export type GrowUnlockPaidDestination =
  | { type: "href"; href: string }
  | { type: "action"; run: () => void };

export type UseGrowUnlockCtaOptions = {
  businessId: string | null | undefined;
  currentPlan: PlanKey;
  trialEligible: boolean;
  subscriptionStatus?: string | null;
  /** Defaults to `"grow"`. Trial copy only when unlocking Grow. */
  targetPlan?: "grow";
  onTrialStarted?: () => void;
  /** Extra callback after a successful trial start (e.g. refetch page data). */
  onTrialSuccess?: () => void;
  paidDestination: GrowUnlockPaidDestination;
};

export type GrowUnlockCtaResult = {
  label: string;
  onClick: () => void;
  loading: boolean;
  mode: GrowUnlockMode;
  errorMessage: string | null;
  clearError: () => void;
};

export function useGrowUnlockCta(options: UseGrowUnlockCtaOptions): GrowUnlockCtaResult {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetPlan = options.targetPlan ?? "grow";
  const mode = useMemo(
    () =>
      resolveGrowUnlockMode(
        options.currentPlan,
        options.trialEligible,
        options.subscriptionStatus,
        targetPlan,
      ),
    [
      options.currentPlan,
      options.trialEligible,
      options.subscriptionStatus,
      targetPlan,
    ],
  );

  const label = useMemo(
    () =>
      getGrowUnlockLabel(
        options.currentPlan,
        options.trialEligible,
        options.subscriptionStatus,
      ),
    [options.currentPlan, options.trialEligible, options.subscriptionStatus],
  );

  const onClick = useCallback(() => {
    if (mode === "trial") {
      const id = options.businessId?.trim();
      if (!id || loading) return;
      setLoading(true);
      setErrorMessage(null);
      void (async () => {
        const result = await startGrowTrial(id);
        if (result.ok) {
          options.onTrialStarted?.();
          options.onTrialSuccess?.();
        } else {
          setErrorMessage(result.message);
        }
        setLoading(false);
      })();
      return;
    }

    const dest = options.paidDestination;
    if (dest.type === "href") {
      router.push(dest.href);
      return;
    }
    dest.run();
  }, [
    loading,
    mode,
    options.businessId,
    options.onTrialStarted,
    options.onTrialSuccess,
    options.paidDestination,
    router,
  ]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return { label, onClick, loading, mode, errorMessage, clearError };
}
