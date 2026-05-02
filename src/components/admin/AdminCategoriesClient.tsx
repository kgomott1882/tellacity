"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Clapperboard,
  Dumbbell,
  Factory,
  Flower2,
  GraduationCap,
  Home,
  Landmark,
  Laptop,
  LayoutGrid,
  Lightbulb,
  Palette,
  PawPrint,
  Plane,
  Scale,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

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
  review_count: number;
};

type CardTheme = {
  border: string;
  iconBg: string;
  iconText: string;
  footerClass: string;
};

const CARD_THEMES: CardTheme[] = [
  {
    border: "border-teal-300",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    footerClass: "text-teal-600 hover:text-teal-800",
  },
  {
    border: "border-pink-300",
    iconBg: "bg-pink-100",
    iconText: "text-pink-700",
    footerClass: "text-pink-600 hover:text-pink-800",
  },
  {
    border: "border-sky-400",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
    footerClass: "text-sky-600 hover:text-sky-800",
  },
  {
    border: "border-orange-400",
    iconBg: "bg-orange-100",
    iconText: "text-orange-800",
    footerClass: "text-orange-600 hover:text-orange-800",
  },
  {
    border: "border-violet-400",
    iconBg: "bg-violet-100",
    iconText: "text-violet-800",
    footerClass: "text-violet-600 hover:text-violet-800",
  },
  {
    border: "border-cyan-400",
    iconBg: "bg-cyan-100",
    iconText: "text-cyan-800",
    footerClass: "text-cyan-600 hover:text-cyan-800",
  },
  {
    border: "border-rose-400",
    iconBg: "bg-rose-100",
    iconText: "text-rose-800",
    footerClass: "text-rose-600 hover:text-rose-800",
  },
  {
    border: "border-emerald-400",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-800",
    footerClass: "text-emerald-600 hover:text-emerald-800",
  },
  {
    border: "border-amber-400",
    iconBg: "bg-amber-100",
    iconText: "text-amber-900",
    footerClass: "text-amber-700 hover:text-amber-900",
  },
  {
    border: "border-indigo-400",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-800",
    footerClass: "text-indigo-600 hover:text-indigo-800",
  },
  {
    border: "border-slate-400",
    iconBg: "bg-slate-100",
    iconText: "text-slate-800",
    footerClass: "text-slate-600 hover:text-slate-800",
  },
  {
    border: "border-fuchsia-400",
    iconBg: "bg-fuchsia-100",
    iconText: "text-fuchsia-800",
    footerClass: "text-fuchsia-600 hover:text-fuchsia-800",
  },
];

function cardThemeForSlug(slug: string): CardTheme {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h + slug.charCodeAt(i) * (i + 3)) % CARD_THEMES.length;
  }
  return CARD_THEMES[h] ?? CARD_THEMES[0]!;
}

function iconForGroup(slug: string, name: string): LucideIcon {
  const s = `${slug} ${name}`.toLowerCase();
  if (/animal|pet|dog|cat|horse|zoo/.test(s)) return PawPrint;
  if (/beauty|well|spa|cosmetic|hair|tattoo|yoga|wellness/.test(s)) return Sparkles;
  if (/business|office|market|shipping|logistics|hr |recruit|print|research/.test(s))
    return Briefcase;
  if (/construction|manufactur|engineer|contract|factory|garden|landscape|tool/.test(s))
    return Factory;
  if (/education|school|univers|course|language|music class|vocational/.test(s))
    return GraduationCap;
  if (/electron|computer|phone|software|appliance|audio|visual/.test(s)) return Laptop;
  if (/event|entertain|night|gambl|museum|music|movie|theater|wedding|party/.test(s))
    return Clapperboard;
  if (/food|beverage|tobacco|restaurant|grocery|bakery|coffee|wine|meat|catering/.test(s))
    return UtensilsCrossed;
  if (/health|medical|dental|clinic|pharmacy|therapy|mental|vision|hospital/.test(s))
    return Stethoscope;
  if (/hobb|craft|art |paint|fish|hunt|needle|knit|outdoor/.test(s)) return Palette;
  if (/home ?& ?garden|furniture|bathroom|kitchen|decoration|energy|heating|fabric/.test(s))
    return Flower2;
  if (/home service|cleaning|plumb|moving|repair|security|storage/.test(s)) return Home;
  if (/legal|government|law |court|municipal|police|library|custom|registration/.test(s))
    return Scale;
  if (/media|publish|book|magazine|photo|video|sound/.test(s)) return BookOpen;
  if (/money|insurance|bank|invest|credit|real estate|account/.test(s)) return Landmark;
  if (/public|local service|employment|funeral|housing|military|religion|waste|environment/.test(s))
    return Building2;
  if (/restaurant|bar|cuisine|café|cafe|takeaway|vegetarian/.test(s)) return UtensilsCrossed;
  if (/shopping|fashion|jewelry|mall|cloth|accessories|wedding dress/.test(s))
    return ShoppingBag;
  if (/sport|fitness|golf|tennis|martial|swim|hockey|bowl/.test(s)) return Dumbbell;
  if (/travel|vacation|hotel|lodging|airline|accommodation|tour/.test(s)) return Plane;
  if (/utilities|energy|power|water|\bfuel\b|\boil\b/.test(s)) return Lightbulb;
  if (/vehicle|transport|taxi|car |truck|motor|bicycle|airport|rental/.test(s)) return Car;
  return LayoutGrid;
}

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
        review_count: parseCount(r.review_count),
      }))
    );
    setLoading(false);
  }, [countryFilter, groupFilter, categoryFilter]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { total: 0, zero: 0, min: 0, max: 0, reviews: 0 };
    }
    const counts = rows.map((r) => r.business_count);
    const zero = counts.filter((n) => n === 0).length;
    const reviews = rows.reduce((a, r) => a + (r.review_count ?? 0), 0);
    return {
      total: rows.length,
      zero,
      min: Math.min(...counts),
      max: Math.max(...counts),
      reviews,
    };
  }, [rows]);

  const cardsByGroup = useMemo(() => {
    const map = new Map<
      string,
      { group_slug: string; group_name: string; rows: AdminCategoryStatRow[] }
    >();
    for (const row of rows) {
      const key = row.group_slug;
      if (!map.has(key)) {
        map.set(key, {
          group_slug: row.group_slug,
          group_name: row.group_name,
          rows: [],
        });
      }
      map.get(key)!.rows.push(row);
    }
    for (const g of map.values()) {
      g.rows.sort((a, b) =>
        a.category_name.localeCompare(b.category_name, undefined, { sensitivity: "base" })
      );
    }
    return Array.from(map.values()).sort((a, b) =>
      a.group_name.localeCompare(b.group_name, undefined, { sensitivity: "base" })
    );
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
          Each card is a <strong>category group</strong>. Subcategories show{" "}
          <strong>active businesses</strong> (primary <code className="rounded bg-neutral-200 px-1">category_slug</code> or{" "}
          <code className="rounded bg-neutral-200 px-1">secondary_category_slugs</code>) and{" "}
          <strong>published / live reviews</strong> on those businesses. Same matching rules as public category pages.
          Table sort below cards remains lowest business count first for gap-spotting.
        </p>
        {!loading && rows.length > 0 ? (
          <p className="mt-2 text-xs text-neutral-600">
            Showing <strong>{summary.total}</strong> subcategories across <strong>{cardsByGroup.length}</strong> groups
            {summary.zero > 0 ? (
              <>
                {" "}
                · <strong>{summary.zero}</strong> with zero businesses
              </>
            ) : null}
            {" · "}
            business range <strong>{summary.min}</strong>–<strong>{summary.max}</strong>
            {" · "}
            <strong>{summary.reviews.toLocaleString("en-US")}</strong> reviews (filtered set)
          </p>
        ) : null}
      </div>

      <AdminTableShell
        title="Category directory"
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
        <div className="w-full space-y-6 px-4 pb-4">
          {loading ? (
            <div className="py-8 text-sm text-neutral-500">Loading…</div>
          ) : rows.length === 0 && !error ? (
            <AdminEmptyState message="No category rows returned." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cardsByGroup.map((card) => {
                  const theme = cardThemeForSlug(card.group_slug);
                  const Icon = iconForGroup(card.group_slug, card.group_name);
                  const footerSlug =
                    [...card.rows].sort((a, b) => b.business_count - a.business_count)[0]
                      ?.category_slug ?? card.rows[0]?.category_slug;
                  const subCount = card.rows.length;
                  const groupBusinessTotal = card.rows.reduce((sum, r) => sum + r.business_count, 0);

                  return (
                    <div
                      key={card.group_slug}
                      className={`flex flex-col rounded-xl border-2 bg-white p-4 shadow-sm ${theme.border}`}
                    >
                      <div className="flex gap-3 border-b border-neutral-100 pb-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}
                        >
                          <Icon className={`h-5 w-5 ${theme.iconText}`} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="flex flex-wrap items-baseline gap-x-1 text-sm font-semibold leading-tight text-neutral-900">
                            <span className="min-w-0 truncate">{card.group_name}</span>
                            <span className="shrink-0 tabular-nums text-neutral-900">
                              - {groupBusinessTotal.toLocaleString("en-US")}
                            </span>
                          </h3>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {subCount} categor{subCount === 1 ? "y" : "ies"}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-2 max-h-[min(320px,55vh)] flex-1 space-y-0 overflow-y-auto text-sm">
                        {card.rows.map((row) => {
                          const low = row.business_count === 0;
                          return (
                            <li
                              key={row.category_slug}
                              className={`flex items-center justify-between gap-2 border-b border-neutral-50 py-2 last:border-b-0 ${
                                low ? "bg-amber-50/60" : ""
                              }`}
                            >
                              <Link
                                href={`/categories/${encodeURIComponent(row.category_slug)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-w-0 flex-1 items-baseline gap-1 text-left hover:underline"
                              >
                                <span className="truncate text-neutral-900">{row.category_name}</span>
                                <span className="shrink-0 tabular-nums font-semibold text-neutral-800">
                                  ({row.business_count.toLocaleString("en-US")})
                                </span>
                                <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                                  · {row.review_count.toLocaleString("en-US")} reviews
                                </span>
                              </Link>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 text-neutral-300"
                                aria-hidden
                              />
                            </li>
                          );
                        })}
                      </ul>
                      {footerSlug ? (
                        <div className="mt-3 flex justify-end border-t border-neutral-100 pt-2">
                          <Link
                            href={`/categories/${encodeURIComponent(footerSlug)}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${theme.footerClass}`}
                          >
                            View businesses
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50/90">
                <p className="border-b border-neutral-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Full list (sort: lowest businesses first)
                </p>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-neutral-100 bg-white text-xs font-medium uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Group</th>
                      <th className="px-4 py-2 font-medium">Subcategory</th>
                      <th className="px-4 py-2 font-medium text-right">Businesses</th>
                      <th className="px-4 py-2 font-medium text-right">Reviews</th>
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
                          <td className="px-4 py-2 text-right tabular-nums text-neutral-700">
                            {row.review_count.toLocaleString("en-US")}
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
              </div>
            </>
          )}
        </div>
      </AdminTableShell>
    </div>
  );
}
