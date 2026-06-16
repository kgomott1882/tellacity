import type { ReactNode } from "react";
import Link from "next/link";

import AdminClaimBusinessPanel from "@/components/admin/AdminClaimBusinessPanel";
import AdminDangerButton from "@/components/admin/AdminDangerButton";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { adminCountryDisplay } from "@/lib/adminCountries";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import BusinessDetailTabs from "./BusinessDetailTabs";
import BusinessDetailPhotos, {
  type AdminPhotoRow,
} from "./BusinessDetailPhotos";
import BusinessDetailArticles, {
  type AdminArticleRow,
} from "./BusinessDetailArticles";
import {
  adminDetailActivateAction,
  adminDetailApproveAction,
  adminDetailDeleteAction,
  adminDetailSuspendAction,
  adminDetailUnderReviewAction,
} from "./actions";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AdminBusinessDetailRow = {
  id: string;
  slug?: string | null;
  name: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  category_slug: string | null;
  category_name?: string | null;
  source: string | null;
  status: string | null;
  submission_status: string | null;
  owner_id: string | null;
  review_count?: number | null;
  subscriptions?:
    | {
        plan_code?: string | null;
      }
    | Array<{
        plan_code?: string | null;
      }>
    | null;
  profiles?: {
    email?: string | null;
    display_name?: string | null;
  } | null;
  created_at: string | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function websiteHref(raw: string | null | undefined): string | null {
  const w = raw?.trim();
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w.replace(/^www\./i, "")}`;
}

function formatSource(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim().toLowerCase();
  if (t === "user_suggested") return "User suggested";
  if (t === "seeded") return "Seeded";
  if (t === "admin_manual") return "Admin manual";
  if (!t) return "-";
  return String(raw).trim();
}

function formatCategory(name: string, slug: string): string {
  const n = name?.trim();
  const s = slug?.trim();
  if (n && s && n !== s) return `${n} (${s})`;
  if (n) return n;
  if (s) return s;
  return "-";
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const v = value.trim().toLowerCase();
  let cls =
    "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize";
  if (label === "Status") {
    if (v === "active") cls += " border-emerald-200 bg-emerald-50 text-emerald-800";
    else if (v === "suspended") cls += " border-amber-200 bg-amber-50 text-amber-900";
    else if (v === "under_review") cls += " border-sky-200 bg-sky-50 text-sky-900";
    else cls += " border-neutral-200 bg-neutral-100 text-neutral-700";
  } else {
    if (v === "approved") cls += " border-emerald-200 bg-emerald-50 text-emerald-800";
    else if (v === "under_review") cls += " border-sky-200 bg-sky-50 text-sky-900";
    else cls += " border-neutral-200 bg-neutral-100 text-neutral-700";
  }
  return <span className={cls}>{value.trim() || "-"}</span>;
}

function DetailActionBtn({
  label,
  formAction,
}: {
  label: string;
  formAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
      >
        {label}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
};

export default async function AdminBusinessDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const err = searchParams.e;

  const rawId = params.id?.trim() ?? "";
  const idValid = UUID_RE.test(rawId);

  const { supabase } = await requireAdminSession();

  let rpcError: string | null = null;
  let businessOwnerLinkId: string | null = null;
  let business: AdminBusinessDetailRow | null = null;
  const businessId = params.id;

  if (idValid) {
    const { data, error } = await supabase
      .from("businesses")
      .select(`
        id,
        name,
        website,
        status,
        submission_status,
        created_at,
        owner_id,
        review_count,
        subscriptions (
          plan_code
        ),
        email,
        phone,
        country_code,
        category_slug,
        source,
        slug,
        profiles!businesses_owner_id_fkey (
          email,
          display_name
        )
      `)
      .eq("id", businessId)
      .single();

    if (error) {
      rpcError = error.message;
    } else if (data?.id) {
      business = data as AdminBusinessDetailRow;
    }
  }

  const notFound = !idValid || (!rpcError && !business);
  const subscription = Array.isArray(business?.subscriptions)
    ? business?.subscriptions[0]
    : business?.subscriptions;
  const subscriptionPlanCode = subscription?.plan_code?.trim() || "free";
  const normalizedStatus = business?.status?.trim().toLowerCase() ?? "";
  const activateLabel = normalizedStatus === "suspended" ? "Unsuspend" : "Activate";
  const ownerName =
    business?.profiles?.display_name?.trim() ||
    business?.profiles?.email ||
    null;

  // Preload photos + owner for the Photos tab using the service role so RLS
  // on business_photos (scoped to owners) doesn't hide anything from admins.
  let initialPhotos: AdminPhotoRow[] = [];
  let pendingPhotoCount = 0;
  let initialArticles: AdminArticleRow[] = [];
  let pendingArticleCount = 0;
  if (business?.id) {
    try {
      const { supabaseUrl, serviceRoleKey } = getServerEnv();
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
      const [{ data: photoRows }, { data: articleRows }, { data: ownerLink }] =
        await Promise.all([
        admin
          .from("business_photos")
          .select(
            "id, business_id, url, section, status, published_at, created_at, moderation_status, moderation_reason, is_suspected_collage, collage_score, moderated_at, moderated_by",
          )
          .eq("business_id", business.id)
          .order("moderation_status", { ascending: true })
          .order("created_at", { ascending: false }),
        admin
          .from("articles")
          .select(
            "id, business_id, title, slug, content_type, status, excerpt, featured_image_url, submitted_at, published_at, archived_at, status_before_archive, rejection_reason, created_at, updated_at, content, client_industry, challenge, solution, results",
          )
          .eq("business_id", business.id)
          .order("updated_at", { ascending: false }),
        admin
          .from("business_owners")
          .select("owner_user_id")
          .eq("business_id", business.id)
          .maybeSingle(),
      ]);
      businessOwnerLinkId =
        ownerLink?.owner_user_id != null ? String(ownerLink.owner_user_id) : null;
      initialPhotos = (photoRows ?? []) as AdminPhotoRow[];
      pendingPhotoCount = initialPhotos.filter(
        (p) =>
          p.moderation_status === "pending" || p.moderation_status === "flagged",
      ).length;
      initialArticles = (articleRows ?? []) as AdminArticleRow[];
      pendingArticleCount = initialArticles.filter(
        (a) => a.status === "pending_review",
      ).length;
    } catch (e) {
      console.error("[admin business detail] preload photos/articles", e);
    }
  }

  const isClaimed = Boolean(business?.owner_id || businessOwnerLinkId);

  return (
    <div className="space-y-4">
      <Link
        href="/admin/businesses"
        className="inline-block text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
      >
        ← Back to businesses
      </Link>

      {err ? <AdminActionMessage type="error" text={err} /> : null}
      {rpcError ? <AdminActionMessage type="error" text={rpcError} /> : null}

      {notFound ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <AdminEmptyState message="Business not found" />
        </div>
      ) : (
        <AdminTableShell title="Business Details">
          <BusinessDetailTabs
            pendingPhotoCount={pendingPhotoCount}
            pendingArticleCount={pendingArticleCount}
            photos={
              business?.id ? (
                <BusinessDetailPhotos
                  initial={{
                    businessId: String(business.id),
                    businessName: business?.name ?? null,
                    ownerEmail: business?.profiles?.email ?? null,
                    ownerName,
                    photos: initialPhotos,
                  }}
                />
              ) : (
                <div className="text-sm text-neutral-500">
                  Photos unavailable for this record.
                </div>
              )
            }
            articles={
              business?.id ? (
                <BusinessDetailArticles
                  initial={{
                    businessId: String(business.id),
                    businessName: business?.name ?? null,
                    businessSlug: business?.slug ?? null,
                    ownerEmail: business?.profiles?.email ?? null,
                    ownerName,
                    articles: initialArticles,
                  }}
                />
              ) : (
                <div className="text-sm text-neutral-500">
                  Articles unavailable for this record.
                </div>
              )
            }
            details={
              <div className="w-full space-y-8">
            <p className="border-b border-neutral-100 pb-3 text-sm text-neutral-600">
              Full business record and metadata
            </p>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Core Info
              </h3>
              <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Business ID">
                  <span className="font-mono text-xs">{business?.id ?? ""}</span>
                </Field>
                <Field label="Name">{business?.name?.trim() || "-"}</Field>
                <Field label="Website">
                  {(() => {
                    const href = websiteHref(business?.website);
                    const w = business?.website?.trim();
                    return href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1FAF9E] hover:underline"
                      >
                        {w || href}
                      </a>
                    ) : (
                      "-"
                    );
                  })()}
                </Field>
                <Field label="Email">
                  {business?.email?.trim() ? (
                    <a
                      href={`mailto:${business?.email?.trim() ?? ""}`}
                      className="text-[#1FAF9E] hover:underline"
                    >
                      {business?.email?.trim() ?? ""}
                    </a>
                  ) : (
                    "-"
                  )}
                </Field>
                <Field label="Phone">
                  {business?.phone?.trim() ? (
                    <a
                      href={`tel:${business?.phone?.trim() ?? ""}`}
                      className="text-neutral-900 hover:underline"
                    >
                      {business?.phone?.trim() ?? ""}
                    </a>
                  ) : (
                    "-"
                  )}
                </Field>
              </dl>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Classification
              </h3>
              <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Country">
                  {adminCountryDisplay(business?.country_code ?? "")}
                </Field>
                <Field label="Category">
                  {formatCategory(
                    business?.category_name ?? "",
                    business?.category_slug ?? ""
                  )}
                </Field>
                <Field label="Source">{formatSource(business?.source)}</Field>
              </dl>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Status
              </h3>
              <dl className="grid gap-6 sm:grid-cols-2">
                <Field label="Status">
                  <StatusPill label="Status" value={business?.status ?? "-"} />
                </Field>
                <Field label="Submission Status">
                  <StatusPill
                    label="Submission"
                    value={business?.submission_status ?? "-"}
                  />
                </Field>
              </dl>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ownership
              </h3>
              <div>
                <div className="text-sm text-gray-500">Owner</div>

                {isClaimed ? (
                  <>
                    <div className="font-medium">{ownerName || "-"}</div>
                    <div className="text-sm text-gray-500">
                      {business?.profiles?.email ?? "-"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">Unclaimed</div>
                    {business?.id ? (
                      <AdminClaimBusinessPanel
                        businessId={business.id}
                        businessName={business.name?.trim() || "Business"}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Metadata
              </h3>
              <dl className="grid gap-6 sm:grid-cols-2">
                <Field label="Created">{formatDate(business?.created_at)}</Field>
                <Field label="Plan">
                  <span className="capitalize">{subscriptionPlanCode}</span>
                </Field>
              </dl>
            </section>
              </div>
            }
            controls={
              <div className="space-y-3">
                {business?.slug?.trim() ? (
                  <Link
                    href={`/b/${business?.slug?.trim() ?? ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-md border border-[#1FAF9E] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B3B36] hover:bg-[#E6F6F1]"
                  >
                    Open Public Page
                  </Link>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <DetailActionBtn
                    label={activateLabel}
                    formAction={adminDetailActivateAction.bind(null, business?.id ?? "")}
                  />
                  <DetailActionBtn
                    label="Suspended"
                    formAction={adminDetailSuspendAction.bind(null, business?.id ?? "")}
                  />
                  <DetailActionBtn
                    label="Under review"
                    formAction={adminDetailUnderReviewAction.bind(null, business?.id ?? "")}
                  />
                  <DetailActionBtn
                    label="Approved"
                    formAction={adminDetailApproveAction.bind(null, business?.id ?? "")}
                  />
                  <AdminDangerButton
                    label="Delete"
                    confirmMessage="Permanently delete this business? This cannot be undone."
                    action={adminDetailDeleteAction.bind(null, business?.id ?? "")}
                  />
                  <Link
                    href={`/admin/business-controls/${business?.id ?? ""}`}
                    className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    Open Invite Controls
                  </Link>
                </div>
              </div>
            }
          />
        </AdminTableShell>
      )}
    </div>
  );
}
