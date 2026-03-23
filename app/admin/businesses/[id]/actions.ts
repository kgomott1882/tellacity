"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  deleteAdminBusiness,
  updateAdminBusinessStatus,
} from "@/lib/admin";

async function guard() {
  const { supabase } = await requireAdminSession();
  return supabase;
}

function detailPath(id: string) {
  return `/admin/businesses/${id}`;
}

export async function adminDetailApproveAction(
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
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailUnderReviewAction(
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
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailSuspendAction(
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
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  revalidatePath(detailPath(businessId));
  redirect(detailPath(businessId));
}

export async function adminDetailDeleteAction(businessId: string) {
  const supabase = await guard();
  const { error } = await deleteAdminBusiness(supabase, businessId);
  if (error) redirect(`${detailPath(businessId)}?e=${encodeURIComponent(error)}`);
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}
