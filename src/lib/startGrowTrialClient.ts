import { isPaystackCardOnTrialEnabledPublic } from "@/lib/paystackCardOnTrial";

export type StartGrowTrialResult =
  | { ok: true; plan: "grow" }
  | { ok: false; message: string };

function trialReturnToFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const search = window.location.search;
  if (!path.startsWith("/business/dashboard/")) return null;
  return `${path}${search}`;
}

/**
 * Paystack card-on-trial (flagged): initialize minimal verify charge → Paystack → complete.
 */
async function startGrowTrialWithPaystackCard(
  businessId: string,
): Promise<StartGrowTrialResult> {
  const returnTo = trialReturnToFromWindow();

  const initRes = await fetch("/api/billing/start-trial/card/initialize", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId,
      ...(returnTo ? { returnTo } : {}),
    }),
  });

  const initJson = (await initRes.json().catch(() => ({}))) as {
    error?: string;
    reason?: string;
    authorization_url?: string;
  };

  if (initRes.status === 404 && initJson.error === "feature_disabled") {
    return startGrowTrialNoCard(businessId);
  }

  if (initRes.status === 403 && initJson.error === "owner_only") {
    return {
      ok: false,
      message: "Only the business owner can start a free Grow trial.",
    };
  }

  if (initRes.status === 409 && initJson.error === "not_eligible") {
    return {
      ok: false,
      message:
        "This workspace isn't eligible for a free trial right now. You can upgrade to Grow anytime.",
    };
  }

  if (!initRes.ok) {
    return {
      ok: false,
      message:
        typeof initJson.error === "string" && initJson.error.trim()
          ? initJson.error
          : "We couldn't start card verification. Please try again.",
    };
  }

  const url = initJson.authorization_url?.trim();
  if (!url) {
    return {
      ok: false,
      message: "Paystack did not return a checkout URL. Try again.",
    };
  }

  window.location.assign(url);
  return { ok: true, plan: "grow" };
}

async function startGrowTrialNoCard(businessId: string): Promise<StartGrowTrialResult> {
  const res = await fetch("/api/billing/start-trial", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    reason?: string;
  };

  if (res.ok && data.ok === true) {
    return { ok: true, plan: "grow" };
  }

  if (res.status === 403 && data.error === "owner_only") {
    return {
      ok: false,
      message: "Only the business owner can start a free Grow trial.",
    };
  }

  if (res.status === 409 && data.error === "not_eligible") {
    return {
      ok: false,
      message:
        "This workspace isn't eligible for a free trial right now. You can upgrade to Grow anytime.",
    };
  }

  if (res.status === 409 && data.error === "card_capture_required") {
    return {
      ok: false,
      message: "Card verification is required to start your trial. Please try again.",
    };
  }

  return {
    ok: false,
    message: "We couldn't start your trial. Please try again or contact support.",
  };
}

/**
 * Starts a user-triggered 14-day Grow trial for the workspace owner.
 * When NEXT_PUBLIC_FEATURE_PAYSTACK_CARD_ON_TRIAL=true, redirects to Paystack card capture first.
 */
export async function startGrowTrial(businessId: string): Promise<StartGrowTrialResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: false, message: "Select a business and try again." };
  }

  try {
    if (isPaystackCardOnTrialEnabledPublic()) {
      return await startGrowTrialWithPaystackCard(trimmedId);
    }
    return await startGrowTrialNoCard(trimmedId);
  } catch {
    return {
      ok: false,
      message: "We couldn't start your trial. Check your connection and try again.",
    };
  }
}
