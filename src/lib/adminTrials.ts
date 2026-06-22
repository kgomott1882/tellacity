import { createClient } from "@supabase/supabase-js";
import { trialDaysRemaining } from "@/lib/trialDaysRemaining";

const TRIAL_MARKER_PREFIX = "trial:";
const PAGE_SIZE = 20;
const FETCH_CAP = 500;

export type AdminTrialOutcome = "active" | "expired" | "converted";

export type AdminTrialRow = {
  business_id: string;
  business_name: string | null;
  business_slug: string | null;
  outcome: AdminTrialOutcome;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  days_remaining: number | null;
  current_plan: string | null;
  subscription_status: string | null;
  provider: string | null;
  converted_at: string | null;
  converted_plan: string | null;
  converted_amount_minor: number | null;
  converted_currency: string | null;
  payment_reference: string | null;
};

export type AdminTrialsDashboard = {
  activeCount: number;
  endingWithin3Days: number;
  endingWithin7Days: number;
  expiredCount: number;
  convertedCount: number;
  startedThisMonth: number;
  rows: AdminTrialRow[];
  totalRows: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  tab: AdminTrialOutcome;
  warnings: string[];
};

function adminServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

function isTrialMarker(providerSubId: string | null | undefined): boolean {
  return String(providerSubId ?? "")
    .trim()
    .toLowerCase()
    .startsWith(TRIAL_MARKER_PREFIX);
}

function utcMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0)),
  };
}

type BusinessLite = { id: string; name: string | null; slug: string | null };

type SubscriptionLite = {
  business_id: string;
  plan_code: string | null;
  status: string | null;
  provider: string | null;
  provider_sub_id: string | null;
  current_period_end: string | null;
  updated_at: string | null;
};

type ChangeLite = {
  business_id: string;
  old_plan: string | null;
  new_plan: string;
  changed_at: string;
};

type BillingLite = {
  business_id: string;
  reference: string;
  amount: number;
  currency: string;
  plan_code: string;
  status: string;
  created_at: string;
};

function trialStartFromChanges(
  businessId: string,
  changesByBiz: Map<string, ChangeLite[]>,
): string | null {
  const rows = changesByBiz.get(businessId) ?? [];
  const starts = rows
    .filter(
      (c) =>
        String(c.old_plan ?? "").trim().toLowerCase() === "free" &&
        String(c.new_plan ?? "").trim().toLowerCase() === "grow",
    )
    .map((c) => c.changed_at)
    .filter(Boolean)
    .sort();
  return starts[0] ?? null;
}

function buildActiveRow(
  sub: SubscriptionLite,
  biz: BusinessLite | undefined,
  changesByBiz: Map<string, ChangeLite[]>,
  now: Date,
): AdminTrialRow {
  const trialEndsAt = sub.current_period_end;
  return {
    business_id: sub.business_id,
    business_name: biz?.name ?? null,
    business_slug: biz?.slug ?? null,
    outcome: "active",
    trial_started_at: trialStartFromChanges(sub.business_id, changesByBiz),
    trial_ends_at: trialEndsAt,
    days_remaining: trialDaysRemaining(trialEndsAt, now),
    current_plan: sub.plan_code,
    subscription_status: sub.status,
    provider: sub.provider,
    converted_at: null,
    converted_plan: null,
    converted_amount_minor: null,
    converted_currency: null,
    payment_reference: null,
  };
}

function buildExpiredRow(
  sub: SubscriptionLite,
  biz: BusinessLite | undefined,
  changesByBiz: Map<string, ChangeLite[]>,
): AdminTrialRow {
  const endedChange = (changesByBiz.get(sub.business_id) ?? [])
    .filter(
      (c) =>
        String(c.old_plan ?? "").trim().toLowerCase() === "grow" &&
        String(c.new_plan ?? "").trim().toLowerCase() === "free",
    )
    .map((c) => c.changed_at)
    .sort()
    .pop();

  return {
    business_id: sub.business_id,
    business_name: biz?.name ?? null,
    business_slug: biz?.slug ?? null,
    outcome: "expired",
    trial_started_at: trialStartFromChanges(sub.business_id, changesByBiz),
    trial_ends_at: sub.current_period_end ?? endedChange ?? sub.updated_at,
    days_remaining: null,
    current_plan: sub.plan_code,
    subscription_status: sub.status,
    provider: sub.provider,
    converted_at: null,
    converted_plan: null,
    converted_amount_minor: null,
    converted_currency: null,
    payment_reference: null,
  };
}

function buildConvertedRow(
  biz: BusinessLite | undefined,
  payment: BillingLite,
  sub: SubscriptionLite | undefined,
  changesByBiz: Map<string, ChangeLite[]>,
): AdminTrialRow {
  const businessId = payment.business_id;
  return {
    business_id: businessId,
    business_name: biz?.name ?? null,
    business_slug: biz?.slug ?? null,
    outcome: "converted",
    trial_started_at: trialStartFromChanges(businessId, changesByBiz),
    trial_ends_at: null,
    days_remaining: null,
    current_plan: sub?.plan_code ?? payment.plan_code,
    subscription_status: sub?.status ?? "active",
    provider: sub?.provider ?? "paystack",
    converted_at: payment.created_at,
    converted_plan: payment.plan_code,
    converted_amount_minor: payment.amount,
    converted_currency: payment.currency,
    payment_reference: payment.reference,
  };
}

export async function getAdminTrialsDashboard(options?: {
  tab?: AdminTrialOutcome;
  page?: number;
}): Promise<AdminTrialsDashboard> {
  const supabase = adminServiceClient();
  const warnings: string[] = [];
  const tab = options?.tab ?? "active";
  const requestedPage = Math.max(1, Math.floor(options?.page ?? 1));
  const now = new Date();

  const [
    subsRes,
    changesRes,
    billingRes,
    paidSubsRes,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "business_id, plan_code, status, provider, provider_sub_id, current_period_end, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP),
    supabase
      .from("subscription_changes")
      .select("business_id, old_plan, new_plan, changed_at")
      .order("changed_at", { ascending: true })
      .limit(2000),
    supabase
      .from("billing_transactions")
      .select(
        "business_id, reference, amount, currency, plan_code, status, created_at",
      )
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP),
    supabase
      .from("subscriptions")
      .select("business_id, plan_code, status, provider, provider_sub_id")
      .in("status", ["active", "trialing"])
      .neq("plan_code", "free")
      .limit(FETCH_CAP),
  ]);

  if (subsRes.error) warnings.push(`subscriptions: ${subsRes.error.message}`);
  if (changesRes.error) {
    warnings.push(`subscription_changes: ${changesRes.error.message}`);
  }
  if (billingRes.error) {
    warnings.push(`billing_transactions: ${billingRes.error.message}`);
  }

  const subscriptions = (subsRes.data ?? []) as SubscriptionLite[];
  const changes = (changesRes.data ?? []) as ChangeLite[];
  const billing = (billingRes.data ?? []) as BillingLite[];
  const paidSubs = (paidSubsRes.data ?? []) as SubscriptionLite[];

  const changesByBiz = new Map<string, ChangeLite[]>();
  for (const row of changes) {
    const list = changesByBiz.get(row.business_id) ?? [];
    list.push(row);
    changesByBiz.set(row.business_id, list);
  }

  const subsByBiz = new Map<string, SubscriptionLite>();
  for (const row of subscriptions) {
    if (!subsByBiz.has(row.business_id)) {
      subsByBiz.set(row.business_id, row);
    }
  }
  for (const row of paidSubs) {
    subsByBiz.set(row.business_id, row);
  }

  const trialMarkerSubs = subscriptions.filter((s) =>
    isTrialMarker(s.provider_sub_id),
  );

  const activeSubs = trialMarkerSubs
    .filter((s) => String(s.status ?? "").toLowerCase() === "trialing")
    .sort((a, b) => {
      const ta = new Date(a.current_period_end ?? 0).getTime();
      const tb = new Date(b.current_period_end ?? 0).getTime();
      return ta - tb;
    });

  const expiredSubs = trialMarkerSubs
    .filter((s) => {
      const st = String(s.status ?? "").toLowerCase();
      const plan = String(s.plan_code ?? "").toLowerCase();
      return st === "active" && plan === "free";
    })
    .sort((a, b) => {
      const ta = new Date(a.updated_at ?? 0).getTime();
      const tb = new Date(b.updated_at ?? 0).getTime();
      return tb - ta;
    });

  const trialStartedBizIds = new Set(
    changes
      .filter(
        (c) =>
          String(c.old_plan ?? "").trim().toLowerCase() === "free" &&
          String(c.new_plan ?? "").trim().toLowerCase() === "grow",
      )
      .map((c) => c.business_id),
  );

  const activeBizIds = new Set(activeSubs.map((s) => s.business_id));

  const firstPaymentByBiz = new Map<string, BillingLite>();
  for (const row of billing) {
    if (!trialStartedBizIds.has(row.business_id)) continue;
    if (!firstPaymentByBiz.has(row.business_id)) {
      firstPaymentByBiz.set(row.business_id, row);
    }
  }

  const convertedRows: AdminTrialRow[] = [];
  for (const [businessId, payment] of firstPaymentByBiz) {
    if (activeBizIds.has(businessId)) continue;
    convertedRows.push(
      buildConvertedRow(
        undefined,
        payment,
        subsByBiz.get(businessId),
        changesByBiz,
      ),
    );
  }
  convertedRows.sort((a, b) => {
    const ta = new Date(a.converted_at ?? 0).getTime();
    const tb = new Date(b.converted_at ?? 0).getTime();
    return tb - ta;
  });

  const businessIds = [
    ...new Set([
      ...activeSubs.map((s) => s.business_id),
      ...expiredSubs.map((s) => s.business_id),
      ...convertedRows.map((r) => r.business_id),
    ]),
  ];

  const businessesById = new Map<string, BusinessLite>();
  if (businessIds.length > 0) {
    const { data: bizRows, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .in("id", businessIds);
    if (bizErr) {
      warnings.push(`businesses: ${bizErr.message}`);
    } else {
      for (const row of bizRows ?? []) {
        const id = String((row as { id: string }).id);
        businessesById.set(id, {
          id,
          name: (row as { name?: string | null }).name ?? null,
          slug: (row as { slug?: string | null }).slug ?? null,
        });
      }
    }
  }

  const activeRows = activeSubs.map((s) =>
    buildActiveRow(s, businessesById.get(s.business_id), changesByBiz, now),
  );
  const expiredRows = expiredSubs.map((s) =>
    buildExpiredRow(s, businessesById.get(s.business_id), changesByBiz),
  );
  for (const row of convertedRows) {
    const biz = businessesById.get(row.business_id);
    if (biz) {
      row.business_name = biz.name;
      row.business_slug = biz.slug;
    }
  }

  const { start: monthStart, end: monthEnd } = utcMonthBounds();
  const startedThisMonth = changes.filter((c) => {
    if (
      String(c.old_plan ?? "").trim().toLowerCase() !== "free" ||
      String(c.new_plan ?? "").trim().toLowerCase() !== "grow"
    ) {
      return false;
    }
    const t = new Date(c.changed_at).getTime();
    return t >= monthStart.getTime() && t < monthEnd.getTime();
  }).length;

  let endingWithin3Days = 0;
  let endingWithin7Days = 0;
  for (const row of activeRows) {
    const days = row.days_remaining;
    if (days == null) continue;
    if (days <= 3) endingWithin3Days += 1;
    if (days <= 7) endingWithin7Days += 1;
  }

  const tabRows =
    tab === "active"
      ? activeRows
      : tab === "expired"
        ? expiredRows
        : convertedRows;

  const totalRows = tabRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const rows = tabRows.slice(pageStart, pageStart + PAGE_SIZE);

  return {
    activeCount: activeRows.length,
    endingWithin3Days,
    endingWithin7Days,
    expiredCount: expiredRows.length,
    convertedCount: convertedRows.length,
    startedThisMonth,
    rows,
    totalRows,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    tab,
    warnings,
  };
}

export { PAGE_SIZE as ADMIN_TRIALS_PAGE_SIZE };
