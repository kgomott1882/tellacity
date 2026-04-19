import { createClient } from "@supabase/supabase-js";

import { normalizePlanCodeToKey, SUBSCRIPTION_STATUSES_FOR_PLAN } from "@/lib/plans";

function adminServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

function utcMonthBounds(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  const label = `${y}-${String(m + 1).padStart(2, "0")} (UTC)`;
  return { start, end, label };
}

function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "PGRST205" || code === "42P01" || message.includes("schema cache");
}

export type AdminPaymentTransactionRow = {
  business_id: string;
  business_name: string | null;
  reference: string;
  amount_minor: number;
  currency: string;
  plan_code: string;
  status: string;
  created_at: string;
};

export type AdminPaidWorkspaceNoTx = {
  business_id: string;
  business_name: string | null;
  plan_code: string;
  current_period_end: string | null;
  provider: string | null;
};

export type AdminSubscriptionChangeRow = {
  business_id: string;
  business_name: string | null;
  old_plan: string | null;
  new_plan: string;
  changed_at: string;
};

export type AdminWebhookAttemptRow = {
  event: string;
  reference: string | null;
  created_at: string | null;
};

export type AdminPaymentsDashboard = {
  monthLabel: string;
  monthStartIso: string;
  monthEndIso: string;
  transactionsThisMonth: AdminPaymentTransactionRow[];
  successCountThisMonth: number;
  totalsByCurrencyMinor: Record<string, number>;
  paidBusinessCountThisMonth: number;
  activePaidSubscriptionCount: number;
  renewalsEndingWithin14dCount: number;
  paidActiveNoSuccessTxThisMonth: AdminPaidWorkspaceNoTx[];
  upgradesToPaidThisMonth: AdminSubscriptionChangeRow[];
  downgradesToFreeThisMonth: AdminSubscriptionChangeRow[];
  webhookNonSuccessThisMonth: number | null;
  /** Sample of Paystack webhook rows this month excluding charge.success (when table exists). */
  webhookNonSuccessSample: AdminWebhookAttemptRow[];
  warnings: string[];
};

export function formatMinorAsMajor(currency: string, amountMinor: number): string {
  const c = currency.trim().toUpperCase().slice(0, 3) || "USD";
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${c}`;
  }
}

export async function getAdminPaymentsDashboard(): Promise<AdminPaymentsDashboard> {
  const supabase = adminServiceClient();
  const { start, end, label } = utcMonthBounds();
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const warnings: string[] = [];

  const paidStatuses = [...SUBSCRIPTION_STATUSES_FOR_PLAN];
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const renewHorizon = new Date(Date.now() + fourteenDaysMs).toISOString();

  const { data: txRows, error: txErr } = await supabase
    .from("billing_transactions")
    .select("business_id, reference, amount, currency, status, plan_code, created_at")
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(500);

  let transactionsThisMonth: AdminPaymentTransactionRow[] = [];
  if (txErr) {
    if (!isMissingTable(txErr)) {
      warnings.push(`billing_transactions: ${txErr.message}`);
    } else {
      warnings.push(
        "billing_transactions table not available; payment rows and some revenue metrics are empty until migrations are applied."
      );
    }
  } else {
    const raw = txRows ?? [];
    const bizIds = [...new Set(raw.map((r) => String((r as { business_id?: string }).business_id ?? "")).filter(Boolean))];
    const nameById = new Map<string, string | null>();
    for (const part of chunkIds(bizIds, 120)) {
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("id, name")
        .in("id", part);
      if (bizErr) {
        warnings.push(`business names: ${bizErr.message}`);
        break;
      }
      for (const b of biz ?? []) {
        const row = b as { id: string; name: string | null };
        nameById.set(String(row.id), row.name?.trim() || null);
      }
    }

    transactionsThisMonth = raw.map((row) => {
      const r = row as {
        business_id?: string;
        reference?: string;
        amount?: number | string;
        currency?: string;
        status?: string;
        plan_code?: string;
        created_at?: string;
      };
      const bid = String(r.business_id ?? "");
      const amount =
        typeof r.amount === "number"
          ? r.amount
          : Number.parseInt(String(r.amount ?? "0"), 10) || 0;
      return {
        business_id: bid,
        business_name: nameById.get(bid) ?? null,
        reference: String(r.reference ?? "").trim() || "—",
        amount_minor: amount,
        currency: String(r.currency ?? "USD")
          .trim()
          .toUpperCase()
          .slice(0, 3) || "USD",
        plan_code: String(r.plan_code ?? "").trim() || "—",
        status: String(r.status ?? "").trim() || "—",
        created_at: String(r.created_at ?? ""),
      };
    });
  }

  const successTx = transactionsThisMonth.filter((t) => t.status.toLowerCase() === "success");
  const totalsByCurrencyMinor: Record<string, number> = {};
  for (const t of successTx) {
    totalsByCurrencyMinor[t.currency] = (totalsByCurrencyMinor[t.currency] ?? 0) + t.amount_minor;
  }
  const paidBusinessIds = new Set(successTx.map((t) => t.business_id).filter(Boolean));

  const { data: subRows, error: subErr } = await supabase
    .from("subscriptions")
    .select("business_id, plan_code, status, current_period_end, provider, updated_at");

  if (subErr) {
    warnings.push(`subscriptions: ${subErr.message}`);
  }

  const subs = (subRows ?? []) as {
    business_id?: string;
    plan_code?: string | null;
    status?: string | null;
    current_period_end?: string | null;
    provider?: string | null;
    updated_at?: string | null;
  }[];

  const paidActiveByBusiness = new Map<string, (typeof subs)[0]>();
  for (const s of subs) {
    const bid = String(s.business_id ?? "");
    if (!bid) continue;
    const st = String(s.status ?? "").toLowerCase();
    if (!paidStatuses.includes(st as (typeof paidStatuses)[number])) continue;
    const key = normalizePlanCodeToKey(s.plan_code);
    if (key === "free") continue;
    const prev = paidActiveByBusiness.get(bid);
    if (!prev) {
      paidActiveByBusiness.set(bid, s);
      continue;
    }
    const prevTime = new Date(String(prev.updated_at ?? 0)).getTime();
    const nextTime = new Date(String(s.updated_at ?? 0)).getTime();
    if (nextTime >= prevTime) paidActiveByBusiness.set(bid, s);
  }

  const activePaidSubscriptionCount = paidActiveByBusiness.size;

  let renewalsEndingWithin14dCount = 0;
  for (const s of paidActiveByBusiness.values()) {
    const endAt = s.current_period_end;
    if (!endAt || !String(endAt).trim()) continue;
    const t = new Date(endAt).getTime();
    if (!Number.isFinite(t)) continue;
    if (t <= Date.now()) continue;
    if (t <= new Date(renewHorizon).getTime()) renewalsEndingWithin14dCount += 1;
  }

  const paidActiveNoSuccessTxThisMonth: AdminPaidWorkspaceNoTx[] = [];
  for (const [bid, s] of paidActiveByBusiness) {
    if (paidBusinessIds.has(bid)) continue;
    paidActiveNoSuccessTxThisMonth.push({
      business_id: bid,
      business_name: null,
      plan_code: String(s.plan_code ?? "").trim() || "—",
      current_period_end: s.current_period_end ?? null,
      provider: s.provider ?? null,
    });
  }

  if (paidActiveNoSuccessTxThisMonth.length > 0) {
    const ids = paidActiveNoSuccessTxThisMonth.map((r) => r.business_id);
    for (const part of chunkIds(ids, 120)) {
      const { data: biz, error: bizErr } = await supabase.from("businesses").select("id, name").in("id", part);
      if (bizErr) break;
      const nm = new Map((biz ?? []).map((b) => [String((b as { id: string }).id), (b as { name: string | null }).name]));
      for (const row of paidActiveNoSuccessTxThisMonth) {
        if (nm.has(row.business_id)) row.business_name = nm.get(row.business_id)?.trim() || null;
      }
    }
  }

  paidActiveNoSuccessTxThisMonth.sort((a, b) => String(b.plan_code).localeCompare(String(a.plan_code)));

  const upgradesToPaidThisMonth: AdminSubscriptionChangeRow[] = [];
  const downgradesToFreeThisMonth: AdminSubscriptionChangeRow[] = [];

  const { data: changeRows, error: chErr } = await supabase
    .from("subscription_changes")
    .select("business_id, old_plan, new_plan, changed_at")
    .gte("changed_at", startIso)
    .lt("changed_at", endIso)
    .order("changed_at", { ascending: false })
    .limit(200);

  if (chErr) {
    if (!isMissingTable(chErr)) {
      warnings.push(`subscription_changes: ${chErr.message}`);
    }
  } else {
    const changes = (changeRows ?? []) as {
      business_id?: string;
      old_plan?: string | null;
      new_plan?: string;
      changed_at?: string;
    }[];
    const bizSet = [...new Set(changes.map((c) => String(c.business_id ?? "")).filter(Boolean))];
    const names = new Map<string, string | null>();
    for (const part of chunkIds(bizSet, 120)) {
      const { data: biz } = await supabase.from("businesses").select("id, name").in("id", part);
      for (const b of biz ?? []) {
        names.set(String((b as { id: string }).id), (b as { name: string | null }).name);
      }
    }
    for (const c of changes) {
      const bid = String(c.business_id ?? "");
      const oldK = normalizePlanCodeToKey(c.old_plan);
      const newK = normalizePlanCodeToKey(c.new_plan);
      const row: AdminSubscriptionChangeRow = {
        business_id: bid,
        business_name: names.get(bid)?.trim() || null,
        old_plan: c.old_plan != null ? String(c.old_plan) : null,
        new_plan: String(c.new_plan ?? ""),
        changed_at: String(c.changed_at ?? ""),
      };
      if (oldK === "free" && newK !== "free") upgradesToPaidThisMonth.push(row);
      if (oldK !== "free" && newK === "free") downgradesToFreeThisMonth.push(row);
    }
  }

  let webhookNonSuccessThisMonth: number | null = null;
  let webhookNonSuccessSample: AdminWebhookAttemptRow[] = [];

  const { count, error: whErr } = await supabase
    .from("paystack_webhook_events")
    .select("id", { count: "exact", head: true })
    .neq("event", "charge.success")
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (!whErr && typeof count === "number") {
    webhookNonSuccessThisMonth = count;
  } else if (whErr && !isMissingTable(whErr)) {
    warnings.push(`paystack_webhook_events: ${whErr.message}`);
  }

  const { data: whSample, error: whSampleErr } = await supabase
    .from("paystack_webhook_events")
    .select("event, reference, created_at")
    .neq("event", "charge.success")
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(40);

  if (!whSampleErr && whSample?.length) {
    webhookNonSuccessSample = whSample.map((r) => {
      const row = r as { event?: string; reference?: string | null; created_at?: string | null };
      return {
        event: String(row.event ?? "").trim() || "—",
        reference: row.reference != null ? String(row.reference).trim() : null,
        created_at: row.created_at != null ? String(row.created_at) : null,
      };
    });
  }

  return {
    monthLabel: label,
    monthStartIso: startIso,
    monthEndIso: endIso,
    transactionsThisMonth,
    successCountThisMonth: successTx.length,
    totalsByCurrencyMinor,
    paidBusinessCountThisMonth: paidBusinessIds.size,
    activePaidSubscriptionCount,
    renewalsEndingWithin14dCount,
    paidActiveNoSuccessTxThisMonth: paidActiveNoSuccessTxThisMonth.slice(0, 80),
    upgradesToPaidThisMonth,
    downgradesToFreeThisMonth,
    webhookNonSuccessThisMonth,
    webhookNonSuccessSample,
    warnings,
  };
}

function chunkIds(ids: string[], size: number): string[][] {
  const uniq = [...new Set(ids.filter(Boolean))];
  const out: string[][] = [];
  for (let i = 0; i < uniq.length; i += size) {
    out.push(uniq.slice(i, i + size));
  }
  return out;
}
