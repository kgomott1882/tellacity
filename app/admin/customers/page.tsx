import Link from "next/link";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";

export const dynamic = "force-dynamic";

type CustomerBusinessRow = {
  name?: string | null;
  website?: string | null;
  status?: string | null;
  created_at?: string | null;
  slug?: string | null;
  business_slug?: string | null;
  id?: string;
  business_id?: string;
} & Record<string, unknown>;

function rowKey(row: CustomerBusinessRow, index: number): string {
  return String(row.business_id ?? row.id ?? `row-${index}`);
}

function slugForRow(row: CustomerBusinessRow): string | null {
  const s = (row.slug ?? row.business_slug)?.trim();
  return s || null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString();
}

function websiteHref(raw: string | null | undefined): string | null {
  const w = raw?.trim();
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w.replace(/^www\./i, "")}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  let cls =
    "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize";
  if (s === "active") {
    cls += " border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (s === "suspended") {
    cls += " border-amber-200 bg-amber-50 text-amber-900";
  } else {
    cls += " border-neutral-200 bg-neutral-100 text-neutral-700";
  }
  return <span className={cls}>{status.trim() || "—"}</span>;
}

export default async function AdminCustomerBusinessesPage() {
  const { supabase } = await requireAdminSession();

  const { data, error } = await supabase.rpc("admin_list_customer_businesses", {
    limit_count: 50,
    offset_count: 0,
  });

  const listError = error?.message ?? null;
  const rows = (Array.isArray(data) ? data : []) as CustomerBusinessRow[];

  return (
    <div className="space-y-4">
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTableShell title="Customer Businesses">
        <div className="w-full">
          <p className="border-b border-neutral-100 bg-white px-4 py-2.5 text-sm text-neutral-600">
            Businesses that have claimed accounts
          </p>
          {rows.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState message="No customer businesses yet" />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row, i) => {
                  const key = rowKey(row, i);
                  const name = row.name?.trim() || "—";
                  const websiteRaw = row.website?.trim() || "";
                  const href = websiteHref(row.website);
                  const statusLabel = row.status?.trim() || "—";
                  const slug = slugForRow(row);

                  return (
                    <tr key={key} className="bg-white align-top">
                      <td className="max-w-[200px] px-3 py-2 font-medium text-neutral-900">
                        {name}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-neutral-700" title={websiteRaw}>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1FAF9E] hover:underline"
                          >
                            {websiteRaw || href}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                        {statusLabel === "—" ? (
                          "—"
                        ) : (
                          <StatusBadge status={statusLabel} />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {slug ? (
                            <Link
                              href={`/b/${slug}`}
                              className="inline-flex rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                            >
                              View
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="cursor-default rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-500 opacity-70"
                            aria-disabled="true"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AdminTableShell>
    </div>
  );
}
