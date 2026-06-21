export type StartGrowTrialResult =
  | { ok: true; plan: "grow" }
  | { ok: false; message: string };

/**
 * Starts a user-triggered 14-day Grow trial for the workspace owner.
 */
export async function startGrowTrial(businessId: string): Promise<StartGrowTrialResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: false, message: "Select a business and try again." };
  }

  try {
    const res = await fetch("/api/billing/start-trial", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: trimmedId }),
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

    return {
      ok: false,
      message: "We couldn't start your trial. Please try again or contact support.",
    };
  } catch {
    return {
      ok: false,
      message: "We couldn't start your trial. Check your connection and try again.",
    };
  }
}
