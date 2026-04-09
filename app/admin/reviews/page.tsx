import AdminReviewsClient from "@/components/admin/AdminReviewsClient";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  applyAdminReviewsListFilter,
  type AdminReviewListFilter,
  type AdminReviewRow,
} from "@/lib/admin";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ e?: string; filter?: string; page?: string }>;
};

function normalizePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function moderationFilterParam(raw: string | undefined): AdminReviewListFilter {
  const v = raw?.trim().toLowerCase();
  if (v === "flagged" || v === "hidden") return v;
  return "all";
}

function trimStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function businessNameFromRow(r: Record<string, unknown>): string | null {
  const b = r.businesses;
  if (Array.isArray(b)) return b[0]?.name ?? null;
  if (b && typeof b === "object" && b !== null && "name" in b) {
    return (b as { name?: string | null }).name ?? null;
  }
  return null;
}

function profileEmailFromEmbed(r: Record<string, unknown>): string | null {
  const p = r["profiles:consumer_id"] as
    | { email?: string | null }
    | { email?: string | null }[]
    | null
    | undefined;
  if (!p) return null;
  if (Array.isArray(p)) return trimStr(p[0]?.email);
  return trimStr(p.email);
}

export default async function AdminReviewsPage(props: PageProps) {
  noStore();
  const searchParams = await props.searchParams;
  const err = searchParams.e;
  const listFilter = moderationFilterParam(searchParams.filter);
  const requestedPage = normalizePage(searchParams.page);

  await requireAdminSession();

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: reviewRows, error: listError } = await adminSupabase
    .from("reviews")
    .select(
      `
      id,
      business_id,
      rating,
      title,
      body,
      created_at,
      email,
      author_email,
      guest_email,
      consumer_id,
      user_id,
      visibility,
      is_flagged,
      status,
      verified_at,
      businesses (
        name
      ),
      profiles:consumer_id (
        email
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (reviewRows ?? []) as Record<string, unknown>[];

  const profileIds = new Set<string>();
  for (const r of rows) {
    const uid = trimStr(r.user_id);
    if (uid) profileIds.add(uid);
  }

  let emailByUserId = new Map<string, string>();
  if (profileIds.size > 0) {
    const { data: profs } = await adminSupabase
      .from("profiles")
      .select("id,email")
      .in("id", [...profileIds]);

    if (profs && profs.length > 0) {
      emailByUserId = new Map(
        profs
          .map((p) => {
            const e = trimStr(p.email);
            if (!e || p.id == null) return null;
            return [String(p.id), e] as [string, string];
          })
          .filter((x): x is [string, string] => x != null)
      );
    }
  }

  const rawReviews: AdminReviewRow[] = rows.map((r) => {
    const id = String(r.id ?? "");
    const body = (r.body as string | null) ?? null;
    const bodyText = body ?? "";
    const body_preview = bodyText.length > 200 ? bodyText.slice(0, 200) : bodyText;

    const uid = trimStr(r.user_id);
    const profileEmail = uid ? emailByUserId.get(uid) : undefined;
    const embedEmail = profileEmailFromEmbed(r);

    const reviewer_email =
      trimStr(r.email) ||
      trimStr(r.author_email) ||
      trimStr(r.guest_email) ||
      embedEmail ||
      trimStr(profileEmail) ||
      "-";

    const verified_at = r.verified_at as string | null | undefined;

    return {
      review_id: id,
      id,
      business_name: businessNameFromRow(r),
      reviewer_email,
      rating: (r.rating as number | null) ?? null,
      title: (r.title as string | null) ?? null,
      body,
      body_preview,
      verification_status: verified_at ? "verified" : "unverified",
      status: (r.status as string | null) ?? null,
      visibility: (r.visibility as string | null) ?? null,
      is_flagged: (r.is_flagged as boolean | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
    };
  });

  const filtered = applyAdminReviewsListFilter(rawReviews, listFilter);
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ADMIN_REVIEWS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * ADMIN_REVIEWS_PAGE_SIZE;
  const reviews = filtered.slice(pageStart, pageStart + ADMIN_REVIEWS_PAGE_SIZE);

  return (
    <AdminReviewsClient
      listFilter={listFilter}
      initialReviews={reviews}
      initialListError={listError?.message ?? null}
      urlError={err}
      pagination={{
        currentPage,
        totalPages,
        totalRows,
        pageSize: ADMIN_REVIEWS_PAGE_SIZE,
      }}
    />
  );
}
