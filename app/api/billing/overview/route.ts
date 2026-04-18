export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BillingOverviewHistoryRow, BillingOverviewResponse } from "@/lib/billingOverview";
import { pickPlanResolutionSubscriptionRow } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

type SubscriptionSelectRow = {
  plan_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
  provider_sub_id?: string | null;
  current_period_end?: string | null;
  pending_plan_code?: string | null;
  pending_change_at?: string | null;
};

type BillingTransactionRow = {
  amount?: number | string | null;
  currency?: string | null;
  reference?: string | null;
  status?: string | null;
  plan_code?: string | null;
  created_at?: string | null;
};

function parseTransactionAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Math.round(Number(value));
  }
  return null;
}

function isMissingBillingTransactionsTable(error: {
  code?: string | null;
  message?: string | null;
} | null | undefined): boolean {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("billing_transactions") ||
    message.includes("schema cache")
  );
}

/**
 * Read-only billing snapshot for the dashboard (`subscriptions` + `billing_transactions`).
 * Does not alter payment or subscription write paths.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const businessId = (url.searchParams.get("businessId") ?? "").trim();
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subRows, error: subErr } = await supabase
      .from("subscriptions")
      .select(
        "plan_code, status, updated_at, provider_sub_id, current_period_end, pending_plan_code, pending_change_at"
      )
      .eq("business_id", businessId);

    if (subErr) {
      console.error("[billing/overview] subscriptions:", subErr.message);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const rows = (subRows ?? []) as SubscriptionSelectRow[];

    const picked = pickPlanResolutionSubscriptionRow(rows);
    const pickedRow = picked as SubscriptionSelectRow | null;
    const current: BillingOverviewResponse["current"] = pickedRow
      ? {
          plan_code:
            pickedRow.plan_code != null && String(pickedRow.plan_code).trim()
              ? String(pickedRow.plan_code)
              : null,
          status: pickedRow.status != null ? String(pickedRow.status) : null,
          updated_at: pickedRow.updated_at != null ? String(pickedRow.updated_at) : null,
          provider_sub_id:
            pickedRow.provider_sub_id != null ? String(pickedRow.provider_sub_id) : null,
          current_period_end:
            pickedRow.current_period_end != null && String(pickedRow.current_period_end).trim()
              ? String(pickedRow.current_period_end)
              : null,
          pending_plan_code:
            pickedRow.pending_plan_code != null && String(pickedRow.pending_plan_code).trim()
              ? String(pickedRow.pending_plan_code).trim().toLowerCase()
              : null,
          pending_change_at:
            pickedRow.pending_change_at != null && String(pickedRow.pending_change_at).trim()
              ? String(pickedRow.pending_change_at)
              : null,
        }
      : null;

    const { data: txRows, error: txErr } = await supabase
      .from("billing_transactions")
      .select("amount, currency, reference, status, plan_code, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (txErr) {
      if (!isMissingBillingTransactionsTable(txErr)) {
        console.error("[billing/overview] billing_transactions:", txErr.message);
        return NextResponse.json({ error: txErr.message }, { status: 500 });
      }
      console.warn(
        "[billing/overview] billing_transactions table missing; returning empty payment history until migration is applied."
      );
    }

    const transactions = txErr && isMissingBillingTransactionsTable(txErr)
      ? []
      : ((txRows ?? []) as BillingTransactionRow[]);
    const history: BillingOverviewHistoryRow[] = transactions.map((row) => ({
      date:
        row.created_at && String(row.created_at).trim()
          ? String(row.created_at)
          : new Date(0).toISOString(),
      plan:
        row.plan_code != null && String(row.plan_code).trim()
          ? String(row.plan_code)
          : "—",
      reference:
        row.reference != null && String(row.reference).trim()
          ? String(row.reference).trim()
          : null,
      amount: parseTransactionAmount(row.amount),
      currency:
        row.currency != null && String(row.currency).trim()
          ? String(row.currency).trim().toUpperCase()
          : null,
      status:
        row.status != null && String(row.status).trim()
          ? String(row.status).trim()
          : "—",
    }));

    const latest = transactions[0];
    const payload: BillingOverviewResponse = {
      current,
      lastPayment: latest
        ? {
            amount: parseTransactionAmount(latest.amount),
            currency:
              latest.currency != null && String(latest.currency).trim()
                ? String(latest.currency).trim().toUpperCase()
                : null,
            plan_code:
              latest.plan_code != null && String(latest.plan_code).trim()
                ? String(latest.plan_code)
                : null,
            created_at:
              latest.created_at != null && String(latest.created_at).trim()
                ? String(latest.created_at)
                : null,
            status:
              latest.status != null && String(latest.status).trim()
                ? String(latest.status)
                : null,
          }
        : null,
      history,
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[billing/overview] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
