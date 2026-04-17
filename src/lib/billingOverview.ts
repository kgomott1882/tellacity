/** Shared types for GET /api/billing/overview (read-only dashboard billing). */

export type BillingOverviewHistoryRow = {
  date: string;
  plan: string;
  reference?: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
};

export type BillingOverviewResponse = {
  current: {
    plan_code: string | null;
    status: string | null;
    updated_at: string | null;
    provider_sub_id: string | null;
  } | null;
  lastPayment: {
    amount: number | null;
    currency: string | null;
    plan_code: string | null;
    created_at: string | null;
    status: string | null;
  } | null;
  history: BillingOverviewHistoryRow[];
};
