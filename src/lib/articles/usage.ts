import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthlyArticleLimitForBusiness } from "@/lib/plans";
import type { ArticleUsageSummary } from "./types";

export function utcBillingMonth(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getArticleUsageForBusiness(
  businessId: string,
  db: SupabaseClient,
): Promise<ArticleUsageSummary> {
  const billingMonth = utcBillingMonth();
  const limit = await getMonthlyArticleLimitForBusiness(businessId, db);

  const { data, error } = await db
    .from("article_usage")
    .select("articles_used")
    .eq("business_id", businessId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.warn("[articles/usage] lookup:", error.message);
  }

  const used = Math.max(0, Number(data?.articles_used ?? 0));
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    billingMonth,
  };
}
