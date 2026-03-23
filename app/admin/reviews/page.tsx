import AdminReviewsClient from "@/components/admin/AdminReviewsClient";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  applyAdminReviewsListFilter,
  getAdminReviews,
  type AdminReviewListFilter,
} from "@/lib/admin";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ e?: string; filter?: string }>;
};

function moderationFilterParam(raw: string | undefined): AdminReviewListFilter {
  const v = raw?.trim().toLowerCase();
  if (v === "flagged" || v === "hidden") return v;
  return "all";
}

export default async function AdminReviewsPage(props: PageProps) {
  noStore();
  const searchParams = await props.searchParams;
  const err = searchParams.e;
  const listFilter = moderationFilterParam(searchParams.filter);

  const { supabase } = await requireAdminSession();
  const wideFetch = listFilter !== "all";
  const { data: rawReviews, error: listError } = await getAdminReviews(supabase, {
    searchTerm: null,
    verificationFilter: null,
    moderationFilter: "all",
    limitCount: wideFetch ? 500 : 50,
    offsetCount: 0,
  });

  const reviews = applyAdminReviewsListFilter(rawReviews, listFilter).slice(0, 50);

  return (
    <AdminReviewsClient
      listFilter={listFilter}
      initialReviews={reviews}
      initialListError={listError}
      urlError={err}
    />
  );
}
