"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/components/admin/RequireAdmin";

async function guard() {
  const { supabase } = await requireAdminSession();
  return supabase;
}

function detailPath(id: string) {
  return `/admin/businesses/${id}`;
}

export async function adminDetailActivateAction(businessId: string) {
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_business_status", {
    target_business_id: businessId,
    new_status: "active",
    new_submission_status: null,
  });
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailSuspendAction(businessId: string) {
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_business_status", {
    target_business_id: businessId,
    new_status: "suspended",
    new_submission_status: null,
  });
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailUnderReviewAction(businessId: string) {
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_business_status", {
    target_business_id: businessId,
    new_status: "under_review",
    new_submission_status: null,
  });
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailApproveAction(businessId: string) {
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_update_business_status", {
    target_business_id: businessId,
    new_status: null,
    new_submission_status: "approved",
  });
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailDeleteAction(businessId: string) {
  const supabase = await guard();
  const { error } = await supabase.rpc("admin_delete_business", {
    target_business_id: businessId,
  });
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}
