import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminOverviewStats = {
  total_users?: number | null;
  total_businesses?: number | null;
  total_reviews?: number | null;
  new_users_today?: number | null;
  reviews_today?: number | null;
  pending_businesses?: number | null;
  unverified_reviews?: number | null;
  business_users?: number | null;
  consumer_users?: number | null;
} & Record<string, unknown>;

/** Row from RPC `admin_get_recent_activity` (includes `email` for all activity types). */
export type AdminRecentActivityItem = {
  item_type: string;
  /** UUID from Postgres */
  item_id: string;
  title: string;
  subtitle: string;
  email: string | null;
  created_at: string;
};

export type AdminActivityItem = AdminRecentActivityItem;

export type AdminUserRow = {
  user_id?: string;
  id?: string;
  email?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  role?: string | null;
  is_admin?: boolean | null;
  suspended?: boolean | null;
  is_suspended?: boolean | null;
  created_at?: string | null;
} & Record<string, unknown>;

export type AdminBusinessRow = {
  business_id?: string;
  id?: string;
  name?: string | null;
  website?: string | null;
  country?: string | null;
  country_code?: string | null;
  status?: string | null;
  submission_status?: string | null;
  category?: string | null;
  category_slug?: string | null;
  created_at?: string | null;
} & Record<string, unknown>;

export type AdminReviewRow = {
  review_id?: string;
  id?: string;
  business_name?: string | null;
  reviewer_email?: string | null;
  rating?: number | null;
  title?: string | null;
  body?: string | null;
  body_preview?: string | null;
  /** verified / unverified (from verified_at) */
  verification_status?: string | null;
  /** Publication workflow: published, draft, null, etc. */
  status?: string | null;
  /** Moderation: visible | hidden */
  visibility?: string | null;
  is_flagged?: boolean | null;
  created_at?: string | null;
} & Record<string, unknown>;

/** Moderation visibility from reviews.visibility */
export function adminReviewVisibility(row: AdminReviewRow): "visible" | "hidden" {
  const v = row.visibility?.trim();
  return v === "hidden" ? "hidden" : "visible";
}

export function adminReviewIsFlagged(row: AdminReviewRow): boolean {
  return row.is_flagged === true;
}

export type AdminReviewListFilter = "all" | "flagged" | "hidden";

export function applyAdminReviewsListFilter(
  rows: AdminReviewRow[],
  filter: AdminReviewListFilter
): AdminReviewRow[] {
  if (filter === "all") return rows;
  if (filter === "flagged") return rows.filter(adminReviewIsFlagged);
  return rows.filter((r) => adminReviewVisibility(r) === "hidden");
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data) && data.length > 0) return data[0] as T;
  if (data && typeof data === "object" && !Array.isArray(data)) return data as T;
  return null;
}

export async function getAdminOverviewStats(
  supabase: SupabaseClient
): Promise<{ data: AdminOverviewStats | null; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_get_overview_stats");
  if (error) return { data: null, error: error.message };
  return { data: firstRow<AdminOverviewStats>(data), error: null };
}

export async function getAdminRecentActivity(
  supabase: SupabaseClient,
  limitCount: number
): Promise<{ data: AdminRecentActivityItem[]; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_get_recent_activity", {
    limit_count: limitCount,
  });
  if (error) return { data: [], error: error.message };
  return {
    data: (Array.isArray(data) ? data : []) as AdminRecentActivityItem[],
    error: null,
  };
}

export async function getAdminUsers(
  supabase: SupabaseClient,
  params: {
    searchTerm: string | null;
    roleFilter: string | null;
    limitCount: number;
    offsetCount: number;
  }
): Promise<{ data: AdminUserRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_list_users", {
    search_term: params.searchTerm,
    role_filter: params.roleFilter,
    limit_count: params.limitCount,
    offset_count: params.offsetCount,
  });
  if (error) return { data: [], error: error.message };
  return { data: (Array.isArray(data) ? data : []) as AdminUserRow[], error: null };
}

export async function getAdminBusinesses(
  supabase: SupabaseClient,
  params: {
    searchTerm: string | null;
    statusFilter: string | null;
    submissionFilter: string | null;
    countryFilter?: string | null;
    categoryFilter?: string | null;
    limitCount: number;
    offsetCount: number;
  }
): Promise<{ data: AdminBusinessRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_list_businesses_v2", {
    search_term: params.searchTerm,
    status_filter: params.statusFilter,
    submission_filter: params.submissionFilter,
    country_filter: params.countryFilter ?? null,
    category_filter: params.categoryFilter ?? null,
    limit_count: params.limitCount,
    offset_count: params.offsetCount,
  });
  if (error) return { data: [], error: error.message };
  return { data: (Array.isArray(data) ? data : []) as AdminBusinessRow[], error: null };
}

export async function getAdminReviews(
  supabase: SupabaseClient,
  params: {
    searchTerm: string | null;
    verificationFilter: string | null;
    limitCount: number;
    offsetCount: number;
    /** all | flagged | hidden (passed to RPC when supported; else fetch-all + client filter) */
    moderationFilter?: string | null;
  }
): Promise<{ data: AdminReviewRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_list_reviews", {
    search_term: params.searchTerm,
    verification_filter: params.verificationFilter,
    limit_count: params.limitCount,
    offset_count: params.offsetCount,
    moderation_filter: params.moderationFilter ?? "all",
  });
  if (error) return { data: [], error: error.message };
  return { data: (Array.isArray(data) ? data : []) as AdminReviewRow[], error: null };
}

export async function updateAdminUserRole(
  supabase: SupabaseClient,
  targetUserId: string,
  newRole: string,
  newIsAdmin: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_update_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
    new_is_admin: newIsAdmin,
  });
  return { error: error?.message ?? null };
}

export async function setAdminUserSuspension(
  supabase: SupabaseClient,
  targetUserId: string,
  suspended: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_set_user_suspension", {
    target_user_id: targetUserId,
    suspended,
  });
  return { error: error?.message ?? null };
}

export async function updateAdminBusinessStatus(
  supabase: SupabaseClient,
  targetBusinessId: string,
  newStatus: string,
  newSubmissionStatus: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_update_business_status", {
    new_status: newStatus || null,
    new_submission_status: newSubmissionStatus || null,
    target_business_id: targetBusinessId,
  });
  return { error: error?.message ?? null };
}

export async function deleteAdminBusiness(
  supabase: SupabaseClient,
  targetBusinessId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_delete_business", {
    target_business_id: targetBusinessId,
  });
  return { error: error?.message ?? null };
}

export async function deleteAdminReview(
  supabase: SupabaseClient,
  targetReviewId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_delete_review", {
    target_review_id: targetReviewId,
  });
  return { error: error?.message ?? null };
}

export async function updateAdminReviewStatus(
  supabase: SupabaseClient,
  targetReviewId: string,
  newVisibility: "visible" | "hidden",
  newFlagged: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_update_review_status", {
    target_review_id: targetReviewId,
    new_status: newVisibility,
    new_flagged: newFlagged,
  });
  return { error: error?.message ?? null };
}
