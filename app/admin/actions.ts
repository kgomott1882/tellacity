"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  deleteAdminBusiness,
  deleteAdminReview,
  setAdminUserSuspension,
  updateAdminBusinessStatus,
  updateAdminUserRole,
} from "@/lib/admin";

export type AdminReviewModerationResult =
  | { ok: true; reviewId: string; nextVisibility?: "visible" | "hidden"; nextFlagged?: boolean }
  | { ok: false; error: string };

export async function adminUpdateReviewVisibilityAction(
  reviewId: string,
  newStatus: "visible" | "hidden"
): Promise<AdminReviewModerationResult> {
  console.log("[admin] adminUpdateReviewVisibilityAction", reviewId, newStatus);
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_review_status", {
    new_flagged: null,
    new_status: newStatus,
    target_review_id: reviewId,
  });
  if (error) return { ok: false, error: error.message ?? "Failed to update review" };
  revalidatePath("/admin/reviews");
  return { ok: true, reviewId, nextVisibility: newStatus };
}

export async function adminUpdateReviewFlagAction(
  reviewId: string,
  newFlagged: boolean
): Promise<AdminReviewModerationResult> {
  console.log("[admin] adminUpdateReviewFlagAction", reviewId, newFlagged);
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_review_status", {
    new_flagged: newFlagged,
    new_status: null,
    target_review_id: reviewId,
  });
  if (error) return { ok: false, error: error.message ?? "Failed to update review" };
  revalidatePath("/admin/reviews");
  return { ok: true, reviewId, nextFlagged: newFlagged };
}

async function guard() {
  const { supabase } = await requireAdminSession();
  return supabase;
}

export async function adminSetUserConsumerAction(userId: string) {
  const supabase = await guard();
  const { error } = await updateAdminUserRole(supabase, userId, "consumer", false);
  if (error) redirect(`/admin/users?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function adminSetUserBusinessAction(userId: string) {
  const supabase = await guard();
  const { error } = await updateAdminUserRole(supabase, userId, "business", false);
  if (error) redirect(`/admin/users?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function adminSetUserAdminAction(userId: string, currentRole: string) {
  const supabase = await guard();
  const role = currentRole?.trim() || "consumer";
  const { error } = await updateAdminUserRole(supabase, userId, role, true);
  if (error) redirect(`/admin/users?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function adminSuspendUserAction(userId: string) {
  const supabase = await guard();
  const { error } = await setAdminUserSuspension(supabase, userId, true);
  if (error) redirect(`/admin/users?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function adminUnsuspendUserAction(userId: string) {
  const supabase = await guard();
  const { error } = await setAdminUserSuspension(supabase, userId, false);
  if (error) redirect(`/admin/users?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function adminMarkBusinessActiveAction(
  businessId: string,
  submissionStatus: string
) {
  const supabase = await guard();
  const { error } = await updateAdminBusinessStatus(
    supabase,
    businessId,
    "active",
    submissionStatus || ""
  );
  if (error) redirect(`/admin/businesses?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function adminMarkBusinessSuspendedAction(
  businessId: string,
  submissionStatus: string
) {
  const supabase = await guard();
  const { error } = await updateAdminBusinessStatus(
    supabase,
    businessId,
    "suspended",
    submissionStatus || ""
  );
  if (error) redirect(`/admin/businesses?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function adminSetBusinessUnderReviewAction(
  businessId: string,
  currentStatus: string
) {
  const supabase = await guard();
  const { error } = await updateAdminBusinessStatus(
    supabase,
    businessId,
    currentStatus || "active",
    "under_review"
  );
  if (error) redirect(`/admin/businesses?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function adminSetBusinessApprovedAction(
  businessId: string,
  currentStatus: string
) {
  const supabase = await guard();
  const { error } = await updateAdminBusinessStatus(
    supabase,
    businessId,
    currentStatus || "active",
    "approved"
  );
  if (error) redirect(`/admin/businesses?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function adminDeleteBusinessAction(businessId: string) {
  const supabase = await guard();
  const { error } = await deleteAdminBusiness(supabase, businessId);
  if (error) redirect(`/admin/businesses?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function adminDeleteReviewAction(reviewId: string) {
  const supabase = await guard();
  const { error } = await deleteAdminReview(supabase, reviewId);
  if (error) redirect(`/admin/reviews?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews");
}

