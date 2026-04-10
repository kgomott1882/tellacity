"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { COUNTRIES } from "@/lib/adminCountries";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type CategoryGroupOption = { slug: string; name: string };
export type CategoryOption = { slug: string; name: string; group_slug: string | null };

export type AdminCategoryStatRow = {
  group_slug: string;
  group_name: string;
  category_slug: string;
  category_name: string;
  business_count: number;
};

function parseCount(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

export default function AdminCategoriesClient() {
  const [countryFilter, setCountryFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [groups, setGroups] = useState<CategoryGroupOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [rows, setRows] = useState<AdminCategoryStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = supabaseBrowser();
      const [gRes, cRes] = await Promise.all([
        supabase
          .from("category_groups")
          .select("slug,name")
          .order("name", { ascending: true }),
        supabase
          .from("categories")
          .select("slug,name,group_slug")
          .order("name", { ascending: true }),
      ]);
      if (cancelled) return;
      if (!gRes.error && Array.isArray(gRes.data)) {
        setGroups(
          gRes.data.map((r) => ({
            slug: String(r.slug ?? "").trim(),
            name: String(r.name ?? r.slug ?? "").trim() || String(r.slug),
          })).filter((r) => r.slug)
        );
      }
      if (!cRes.error && Array.isArray(cRes.data)) {
        setCategories(
          cRes.data.map((r) => ({
            slug: String(r.slug ?? "").trim(),
            name: String(r.name ?? r.slug ?? "").trim() || String(r.slug),
            group_slug: r.group_slug != null ? String(r.group_slug).trim() : null,
          })).filter((r) => r.slug)
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesForGroup = useMemo(() => {
    if (!groupFilter.trim()) return categories;
    const g = groupFilter.trim().toLowerCase();
    return categories.filter(
      (c) => (c.group_slug ?? "").toLowerCase() === g
    );
  }, [categories, groupFilter]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const p_country_code = countryFilter.trim() || null;
    const p_group_slug = groupFilter.trim() || null;
    const p_category_slug = categoryFilter.trim() || null;

    const { data, error: rpcError } = await supabase.rpc("admin_category_business_stats", {
      p_country_code,
      p_group_slug,
      p_category_slug,
    });

    if (rpcError) {
      setRows([]);
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    const list = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
    setRows(
      list.map((r) => ({
        group_slug: String(r.group_slug ?? ""),
        group_name: String(r.group_name ?? ""),
        category_slug: String(r.category_slug ?? ""),
        category_name: String(r.category_name ?? ""),
        business_count: parseCount(r.business_count),
      }))
    );
    setLoading(false);
  }, [countryFilter, groupFilter, categoryFilter]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { total: 0, zero: 0, min: 0, max: 0 };
    }
    const counts = rows.map((r) => r.business_count);
    const zero = counts.filter((n) => n === 0).length;
    return {
      total: rows.length,
      zero,
      min: Math.min(...counts),
      max: Math.max(...counts),
    };
  }, [rows]);

  const handleGroupChange = (v: string) => {
    setGroupFilter(v);
    setCategoryFilter("");
  };

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error} /> : null}

      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900">Category coverage</p>
        <p className="mt-1 text-xs text-neutral-600">
          Counts include <strong>active</strong> businesses whose primary <code className="rounded bg-neutral-200 px-1">category_slug</code> or{" "}
          <code className="rounded bg-neutral-200 px-1">secondary_category_slugs</code> matches each catalog category (same rules as public category pages).
          Sort is lowest count first—use this to spot categories that need more seeding.
        </p>
        {!loading && rows.length > 0 ? (
          <p className="mt-2 text-xs text-neutral-600">
            Showing <strong>{summary.total}</strong> categories
            {summary.zero > 0 ? (
              <>
                {" "}
                · <strong>{summary.zero}</strong> with zero businesses
              </>
            ) : null}
            {" · "}
            range <strong>{summary.min}</strong>–<strong>{summary.max}</strong> businesses
          </p>
        ) : null}
      </div>

      <AdminTableShell
        title="Categories & business counts"
        controls={
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="min-w-[160px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code === "ALL" ? "" : c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Category group
              </label>
              <select
                value={groupFilter}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="min-w-[200px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              >
                <option value="">All groups</option>
                {groups.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Subcategory
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-w-[220px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              >
                <option value="">All subcategories</option>
                {categoriesForGroup.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        <div className="w-full">
          {loading ? (
            <div className="px-4 py-8 text-sm text-neutral-500">Loading…</div>
          ) : rows.length === 0 && !error ? (
            <div className="p-4">
              <AdminEmptyState message="No category rows returned." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Group</th>
                  <th className="px-4 py-2 font-medium">Subcategory</th>
                  <th className="px-4 py-2 font-medium text-right">Businesses</th>
                  <th className="px-4 py-2 font-medium">Public page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => {
                  const low = row.business_count === 0;
                  return (
                    <tr
                      key={`${row.group_slug}-${row.category_slug}`}
                      className={low ? "bg-amber-50/80" : "bg-white"}
                    >
                      <td className="px-4 py-2 text-neutral-900">{row.group_name}</td>
                      <td className="px-4 py-2 font-medium text-neutral-900">{row.category_name}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-neutral-900">
                        {row.business_count.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/categories/${encodeURIComponent(row.category_slug)}`}
                          className="text-[#1FAF9E] hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View listing
                        </Link>
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
