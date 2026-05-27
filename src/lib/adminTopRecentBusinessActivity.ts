import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminTopRecentActivityKind =
  | "signup"
  | "review"
  | "dashboard_login"
  | "dashboard";

export type AdminTopRecentBusinessActivity = {
  business_id: string;
  business_name: string;
  business_slug: string;
  business_website: string;
  business_logo_url: string;
  business_status: string;
  business_country_code: string;
  business_created_at: string | null;
  owner_id: string;
  owner_email: string;
  owner_display_name: string;
  last_activity_at: string | null;
  last_activity_kind: AdminTopRecentActivityKind;
  last_review_at: string | null;
  last_review_rating: number | null;
  last_login_at: string | null;
  last_dashboard_at: string | null;
  last_dashboard_action: string;
};

type RawRow = Record<string, unknown>;

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function asNullableString(v: unknown): string | null {
  if (v == null) return null;
  const s = typeof v === "string" ? v : String(v);
  return s.trim() === "" ? null : s;
}

function asNullableNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeKind(v: unknown): AdminTopRecentActivityKind {
  const s = asString(v).trim().toLowerCase();
  if (s === "review") return "review";
  if (s === "dashboard_login") return "dashboard_login";
  if (s === "dashboard") return "dashboard";
  return "signup";
}

export async function loadAdminTopRecentBusinessActivity(
  supabase: SupabaseClient,
  limit = 15,
): Promise<{
  rows: AdminTopRecentBusinessActivity[];
  error: string | null;
}> {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 15, 100));

  const { data, error } = await supabase.rpc(
    "admin_top_recent_business_activity",
    { p_limit: safeLimit },
  );

  if (error) {
    return { rows: [], error: error.message };
  }

  const list = Array.isArray(data) ? (data as RawRow[]) : [];
  const rows: AdminTopRecentBusinessActivity[] = list.map((r) => ({
    business_id: asString(r.business_id),
    business_name: asString(r.business_name) || "-",
    business_slug: asString(r.business_slug),
    business_website: asString(r.business_website),
    business_logo_url: asString(r.business_logo_url),
    business_status: asString(r.business_status) || "active",
    business_country_code: asString(r.business_country_code).toUpperCase(),
    business_created_at: asNullableString(r.business_created_at),
    owner_id: asString(r.owner_id),
    owner_email: asString(r.owner_email),
    owner_display_name:
      asString(r.owner_display_name) ||
      asString(r.owner_email) ||
      "-",
    last_activity_at: asNullableString(r.last_activity_at),
    last_activity_kind: normalizeKind(r.last_activity_kind),
    last_review_at: asNullableString(r.last_review_at),
    last_review_rating: asNullableNumber(r.last_review_rating),
    last_login_at: asNullableString(r.last_login_at),
    last_dashboard_at: asNullableString(r.last_dashboard_at),
    last_dashboard_action: asString(r.last_dashboard_action),
  }));

  return { rows, error: null };
}
