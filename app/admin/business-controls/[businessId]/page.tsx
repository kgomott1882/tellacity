import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  normalizePlanCodeToKey,
  pickPlanResolutionSubscriptionRow,
  PLAN_INVITE_LIMITS,
  PLAN_ARTICLE_LIMITS,
  SUBSCRIPTION_STATUSES_FOR_PLAN,
  type PlanKey,
} from "@/lib/plans";
import BusinessControlsForms from "./BusinessControlsForms";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLAN_OPTIONS: PlanKey[] = ["free", "grow", "premium", "elite"];

type PageProps = {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
};

function asNonNegativeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function parseRpcNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown> | number | string | null;
    if (typeof first === "number" || typeof first === "string") return parseRpcNumber(first);
    if (first && typeof first === "object") {
      if ("bonus_invites" in first) return parseRpcNumber((first as Record<string, unknown>).bonus_invites);
      if ("get_bonus_invites" in first)
        return parseRpcNumber((first as Record<string, unknown>).get_bonus_invites);
    }
  }
  return 0;
}

export default async function AdminBusinessControlsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const businessId = params.businessId?.trim() ?? "";
  const idValid = UUID_RE.test(businessId);

  const { supabase } = await requireAdminSession(
    `/admin/business-controls/${encodeURIComponent(businessId)}`
  );

  async function updatePlanAction(formData: FormData) {
    "use server";
    const businessId = String(formData.get("business_id") ?? "").trim();
    const plan = String(formData.get("plan_code") ?? formData.get("plan") ?? "")
      .trim()
      .toLowerCase();
    if (!UUID_RE.test(businessId) || !PLAN_OPTIONS.includes(plan as PlanKey)) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          businessId
        )}?e=${encodeURIComponent("Invalid plan selection.")}`
      );
    }
    const { supabase } = await requireAdminSession(
      `/admin/business-controls/${businessId}`
    );
    const { error } = await supabase.rpc("admin_update_business_plan", {
      p_business_id: businessId,
      p_plan_code: plan,
    });
    if (error) {
      return redirect(
        `/admin/business-controls/${businessId}?e=${encodeURIComponent(
          error.message
        )}`
      );
    }
    revalidatePath(`/admin/business-controls/${businessId}`);
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath(`/admin/customers`);
    return redirect(`/admin/business-controls/${businessId}?s=plan-updated`);
  }

  async function addBonusInvitesAction(formData: FormData) {
    "use server";
    const actionBusinessId = businessId;
    const amount = asNonNegativeInt(formData.get("amount"));
    const reason = String(formData.get("reason") ?? "").trim();

    if (!UUID_RE.test(actionBusinessId) || amount <= 0) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId || businessId
        )}?e=${encodeURIComponent("Bonus invites must be a positive number.")}`
      );
    }

    const { supabase } = await requireAdminSession(
      `/admin/business-controls/${encodeURIComponent(actionBusinessId)}`
    );

    const { error } = await supabase.rpc("admin_add_bonus_invites", {
      p_business_id: actionBusinessId,
      p_amount: Number(amount),
      p_reason: reason || null,
    });

    if (error) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId
        )}?e=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath(`/admin/business-controls/${actionBusinessId}`);

    return redirect(
      `/admin/business-controls/${encodeURIComponent(
        actionBusinessId
      )}?s=${encodeURIComponent("Bonus invites added.")}`
    );
  }

  async function addBonusArticlesAction(formData: FormData) {
    "use server";
    const actionBusinessId = businessId;
    const amount = asNonNegativeInt(formData.get("amount"));

    if (!UUID_RE.test(actionBusinessId) || amount <= 0) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId || businessId
        )}?e=${encodeURIComponent("Bonus articles must be a positive number.")}`
      );
    }

    const { supabase } = await requireAdminSession(
      `/admin/business-controls/${encodeURIComponent(actionBusinessId)}`
    );

    const { error } = await supabase.rpc("admin_add_bonus_articles", {
      p_business_id: actionBusinessId,
      p_amount: Number(amount),
      p_reason: String(formData.get("reason") ?? "").trim() || null,
    });

    if (error) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId
        )}?e=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath(`/admin/business-controls/${actionBusinessId}`);
    return redirect(
      `/admin/business-controls/${encodeURIComponent(
        actionBusinessId
      )}?s=${encodeURIComponent("Bonus articles added.")}`
    );
  }

  async function resetBonusInvitesAction(formData: FormData) {
    "use server";
    const actionBusinessId = businessId;

    if (!UUID_RE.test(actionBusinessId)) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId || businessId
        )}?e=${encodeURIComponent("Invalid business id.")}`
      );
    }

    const { supabase } = await requireAdminSession(
      `/admin/business-controls/${encodeURIComponent(actionBusinessId)}`
    );

    const { error } = await supabase.rpc("admin_reset_bonus_invites", {
      p_business_id: actionBusinessId,
    });

    if (error) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId
        )}?e=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath(`/admin/business-controls/${actionBusinessId}`);

    return redirect(
      `/admin/business-controls/${encodeURIComponent(
        actionBusinessId
      )}?s=${encodeURIComponent("Bonus invites reset.")}`
    );
  }

  async function removeBonusInvitesAction(formData: FormData) {
    "use server";
    const actionBusinessId = businessId;
    const amount = asNonNegativeInt(formData.get("remove_amount"));
    const reason = String(formData.get("remove_reason") ?? "").trim();

    if (!UUID_RE.test(actionBusinessId) || amount <= 0) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId || businessId
        )}?e=${encodeURIComponent("Remove bonus amount must be a positive number.")}`
      );
    }

    const { supabase } = await requireAdminSession(
      `/admin/business-controls/${encodeURIComponent(actionBusinessId)}`
    );

    const { error } = await supabase.rpc("admin_remove_bonus_invites", {
      p_business_id: actionBusinessId,
      p_amount: Number(amount),
      p_reason: reason || null,
    });

    if (error) {
      return redirect(
        `/admin/business-controls/${encodeURIComponent(
          actionBusinessId
        )}?e=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath(`/admin/business-controls/${actionBusinessId}`);

    return redirect(
      `/admin/business-controls/${encodeURIComponent(
        actionBusinessId
      )}?s=${encodeURIComponent("Bonus invites removed.")}`
    );
  }

  let pageError: string | null = null;
  let businessData:
    | {
        id?: string;
        name?: string | null;
        subscriptions?:
          | {
              plan_code?: string | null;
              bonus_invites?: number | null;
              bonus_expires_at?: string | null;
            }
          | Array<{
              plan_code?: string | null;
              bonus_invites?: number | null;
              bonus_expires_at?: string | null;
            }>
          | null;
      }
    | null = null;
  let currentPlan: PlanKey = "free";
  let subscription: {
    plan_code?: string | null;
    bonus_invites?: number | null;
    bonus_expires_at?: string | null;
  } | null = null;
  let baseLimit = 0;
  let activeBonus = 0;
  let finalLimit = 0;
  let used = 0;
  let remaining = 0;
  let articleBaseLimit = 0;
  let articleBonus = 0;
  let articleFinalLimit = 0;
  let articlesUsed = 0;
  let articlesRemaining = 0;

  if (idValid) {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(`
        id,
        name
      `)
      .eq("id", params.businessId)
      .single();
    const { data: pendingSubscriptionRows, error: pendingSubscriptionError } =
      await supabase
        .from("subscriptions")
        .select("plan_code, bonus_invites, bonus_expires_at, status, updated_at")
        .eq("business_id", params.businessId)
        .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN]);
    const { data: latestSubscriptionRows, error: latestSubscriptionError } = await supabase
      .from("subscriptions")
      .select("plan_code, bonus_invites, bonus_expires_at, status, updated_at")
      .eq("business_id", params.businessId)
      .order("updated_at", { ascending: false })
      .limit(1);
    // Same as POST /api/review-invites/usage → monthlyCount (business dashboard "Invitations sent this month").
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const monthStartIso = startOfMonth.toISOString();
    const { count: monthlyUsedInvites } = await supabase
      .from("review_invites")
      .select("*", { count: "exact", head: true })
      .eq("business_id", params.businessId)
      .gte("created_at", monthStartIso)
      .or("source.is.null,source.neq.email_widget");
    const { data: bonusInvites, error: bonusError } = await supabase.rpc("get_bonus_invites", {
      p_business_id: businessId,
    });
    const billingMonth = `${startOfMonth.getUTCFullYear()}-${String(startOfMonth.getUTCMonth() + 1).padStart(2, "0")}`;
    const { data: bonusArticles, error: bonusArticlesError } = await supabase.rpc(
      "get_bonus_articles",
      { p_business_id: businessId },
    );
    const { data: articleUsageRow } = await supabase
      .from("article_usage")
      .select("articles_used")
      .eq("business_id", businessId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    if (businessError) {
      pageError = businessError.message;
    } else if (pendingSubscriptionError && latestSubscriptionError) {
      pageError =
        pendingSubscriptionError.message || latestSubscriptionError.message;
    } else {
      businessData = business as {
        id?: string;
        name?: string | null;
      };
      type SubRow = {
        plan_code?: string | null;
        bonus_invites?: number | null;
        bonus_expires_at?: string | null;
        status?: string | null;
        updated_at?: string | null;
      };
      const picked = pickPlanResolutionSubscriptionRow(
        (pendingSubscriptionRows ?? []) as SubRow[],
      );
      const selectedSubRow = (picked ??
        latestSubscriptionRows?.[0]) as SubRow | undefined;
      subscription = selectedSubRow ?? null;

      const plan = normalizePlanCodeToKey(subscription?.plan_code ?? null);
      activeBonus = asNonNegativeInt(parseRpcNumber(bonusInvites));
      baseLimit = PLAN_INVITE_LIMITS[plan] ?? 0;
      finalLimit = baseLimit + activeBonus;
      used = monthlyUsedInvites ?? 0;
      remaining = Math.max(finalLimit - used, 0);
      currentPlan = PLAN_OPTIONS.includes(plan) ? plan : "free";
      articleBaseLimit = PLAN_ARTICLE_LIMITS[plan] ?? 0;
      articleBonus = asNonNegativeInt(parseRpcNumber(bonusArticles));
      articleFinalLimit = articleBaseLimit + articleBonus;
      articlesUsed = Number(articleUsageRow?.articles_used ?? 0);
      articlesRemaining = Math.max(articleFinalLimit - articlesUsed, 0);
      if (bonusError?.message) {
        pageError = bonusError.message;
      } else if (bonusArticlesError?.message) {
        pageError = bonusArticlesError.message;
      }
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/businesses/${encodeURIComponent(businessId)}`}
        className="inline-block text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
      >
        ← Back to business details
      </Link>

      {searchParams.s ? <AdminActionMessage type="success" text={searchParams.s} /> : null}
      {searchParams.e ? <AdminActionMessage type="error" text={searchParams.e} /> : null}
      {pageError ? <AdminActionMessage type="error" text={pageError} /> : null}

      {!idValid ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <AdminEmptyState message="Invalid business id" />
        </div>
      ) : (
        <>
          <AdminTableShell title="Business Invite Controls">
            <div className="p-4">
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                These changes affect billing and invite limits.
              </p>
              <div className="grid grid-cols-5 gap-4">
                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Business</div>
                  <div className="font-semibold">{businessData?.name}</div>
                  <div className="text-xs text-gray-400">{businessData?.id}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Plan</div>
                  <div className="font-semibold">{currentPlan}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Base Limit</div>
                  <div className="font-semibold">{baseLimit}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Bonus</div>
                  <div className="font-semibold">{activeBonus}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Total Available</div>
                  <div className="font-bold text-lg">{finalLimit}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Used Invites</div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Month to date (UTC), same query as business Get reviews → Overview.
                  </p>
                  <div className="mt-1 font-semibold">{used}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="font-semibold">{remaining}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-gray-500">Usage %</div>
                  <div className="font-semibold">
                    {finalLimit > 0 ? Math.round((used / finalLimit) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </AdminTableShell>

          <AdminTableShell title="Business Article Controls">
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded border p-4">
                  <div className="text-sm text-gray-500">Base article limit</div>
                  <div className="font-semibold">{articleBaseLimit}</div>
                </div>
                <div className="rounded border p-4">
                  <div className="text-sm text-gray-500">Bonus articles</div>
                  <div className="font-semibold">{articleBonus}</div>
                </div>
                <div className="rounded border p-4">
                  <div className="text-sm text-gray-500">Used this month</div>
                  <div className="font-semibold">{articlesUsed}</div>
                </div>
                <div className="rounded border p-4">
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="font-semibold">{articlesRemaining}</div>
                </div>
              </div>
            </div>
          </AdminTableShell>

          <BusinessControlsForms
            businessId={businessId}
            currentPlan={currentPlan}
            updatePlanAction={updatePlanAction}
            addBonusInvitesAction={addBonusInvitesAction}
            addBonusArticlesAction={addBonusArticlesAction}
          />
        </>
      )}
    </div>
  );
}
