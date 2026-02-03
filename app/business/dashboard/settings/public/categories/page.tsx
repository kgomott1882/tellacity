"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, Plus, X, ExternalLink } from "lucide-react";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type SubItem = { label: string; slug: string };
type CategoryOption = { label: string; slug: string; mainSlug: string; categoryId?: string | null; groupSlug?: string | null };
type CategoryItem = { label: string; slug: string };

function splitIntoColumns<T>(items: T[], numCols: number): T[][] {
  const cols: T[][] = Array.from({ length: numCols }, () => []);
  items.forEach((item, i) => cols[i % numCols].push(item));
  return cols;
}

export default function CategoriesPage() {
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [primaryCategory, setPrimaryCategory] = useState<CategoryItem | null>(null);
  const [secondaryCategories, setSecondaryCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCategoriesView, setShowAllCategoriesView] = useState(false);
  const [seeAllStep, setSeeAllStep] = useState<"main" | "sub">("main");
  const [seeAllSelectedMain, setSeeAllSelectedMain] = useState<CategoryItem | null>(null);
  const [seeAllSelectedSub, setSeeAllSelectedSub] = useState<CategoryItem | null>(null);

  const [categoryGroups, setCategoryGroups] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [categoriesByGroupSlug, setCategoriesByGroupSlug] = useState<Record<string, SubItem[]>>({});
  const [allCategoriesForSearch, setAllCategoriesForSearch] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [businessPrimarySlug, setBusinessPrimarySlug] = useState<string | null>(null);
  const [businessSecondarySlugs, setBusinessSecondarySlugs] = useState<string[]>([]);
  const hasResolvedLabelsRef = useRef(false);

  const businessId = selectedBusiness?.id ?? null;
  const maxSecondary = 5;

  const mainCategoriesColumns = useMemo(
    () => splitIntoColumns(categoryGroups.map((g) => ({ label: g.name, slug: g.slug })), 4),
    [categoryGroups]
  );

  const getSubcategoriesForMain = (mainSlug: string): SubItem[] => {
    const subs = categoriesByGroupSlug[mainSlug];
    if (subs && subs.length > 0) return subs;
    const group = categoryGroups.find((g) => g.slug === mainSlug);
    return group ? [{ label: group.name, slug: group.slug }] : [];
  };

  const subcategoriesForSelectedMain = seeAllSelectedMain ? getSubcategoriesForMain(seeAllSelectedMain.slug) : [];
  const subcategoryColumns = splitIntoColumns(subcategoriesForSelectedMain, 3);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const { data: groupsData, error: groupsError } = await supabaseBrowser
        .from("category_groups")
        .select("id, name, slug")
        .order("name", { ascending: true });
      if (!mounted) return;
      if (groupsError) {
        setCategoriesError("Could not load category groups.");
        setCategoryGroups([]);
        setCategoriesByGroupSlug({});
        setAllCategoriesForSearch([]);
        setCategoriesLoading(false);
        return;
      }
      const groups = (groupsData ?? []) as { id: string; name: string; slug: string }[];
      setCategoryGroups(groups);

      const { data: categoriesData, error: categoriesError } = await supabaseBrowser
        .from("categories")
        .select("id, name, slug, group")
        .order("name", { ascending: true });
      if (!mounted) return;
      if (categoriesError) {
        setCategoriesByGroupSlug({});
        const flat: CategoryOption[] = groups.map((g) => ({ label: g.name, slug: g.slug, mainSlug: g.slug, categoryId: null, groupSlug: g.slug }));
        setAllCategoriesForSearch(flat);
        setCategoriesLoading(false);
        return;
      }
      const categories = (categoriesData ?? []) as { id: string; name: string; slug: string; group: string | null }[];
      const byGroup: Record<string, SubItem[]> = {};
      const flat: CategoryOption[] = [];
      groups.forEach((g) => {
        const subs = categories.filter((c) => c.group === g.slug).map((c) => ({ label: c.name, slug: c.slug }));
        byGroup[g.slug] = subs.length > 0 ? subs : [{ label: g.name, slug: g.slug }];
        flat.push({ label: g.name, slug: g.slug, mainSlug: g.slug, categoryId: null, groupSlug: g.slug });
      });
      categories.forEach((c) => {
        if (c.group) flat.push({ label: c.name, slug: c.slug, mainSlug: c.group, categoryId: c.id, groupSlug: c.group ?? null });
      });
      setCategoriesByGroupSlug(byGroup);
      setAllCategoriesForSearch(flat);
      setCategoriesLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    hasResolvedLabelsRef.current = false;
  }, [businessId]);

  useEffect(() => {
    let mounted = true;
    if (!businessId) {
      setLoading(false);
      setBusinessPrimarySlug(null);
      setBusinessSecondarySlugs([]);
      return;
    }
    (async () => {
      let selectCols = "category_slug, secondary_category_slugs, primary_group_slug, primary_category_id";
      let { data, error } = await supabaseBrowser
        .from("businesses")
        .select(selectCols)
        .eq("id", businessId)
        .single();
      if (error && (String((error as { code?: string }).code) === "PGRST204" || String((error as { code?: string }).code) === "42703")) {
        selectCols = "category_slug, secondary_category_slugs";
        const fallback = await supabaseBrowser.from("businesses").select(selectCols).eq("id", businessId).single();
        data = fallback.data;
        error = fallback.error;
      }
      if (!mounted) return;
      if (!error && data) {
        const row = data as { category_slug?: string; secondary_category_slugs?: string[]; primary_group_slug?: string | null; primary_category_id?: string | null };
        const primarySlug = row.category_slug ?? "";
        const secondarySlugs = (row.secondary_category_slugs ?? []) as string[];
        setBusinessPrimarySlug(primarySlug || null);
        setBusinessSecondarySlugs(secondarySlugs ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  useEffect(() => {
    if (hasResolvedLabelsRef.current || allCategoriesForSearch.length === 0) return;
    const primarySlug = businessPrimarySlug ?? "";
    const secondarySlugs = businessSecondarySlugs ?? [];
    const primaryLookup = primarySlug ? allCategoriesForSearch.find((c) => c.slug === primarySlug) : null;
    const primary = primaryLookup ? { label: primaryLookup.label, slug: primaryLookup.slug } : (primarySlug ? { label: primarySlug, slug: primarySlug } : null);
    const secondary = secondarySlugs
      .map((slug) => {
        const s = allCategoriesForSearch.find((c) => c.slug === slug);
        return s ? { label: s.label, slug: s.slug } : { label: slug, slug };
      })
      .filter(Boolean) as CategoryItem[];
    setPrimaryCategory(primary ?? null);
    setSecondaryCategories(secondary);
    hasResolvedLabelsRef.current = true;
  }, [businessPrimarySlug, businessSecondarySlugs, allCategoriesForSearch]);

  const filteredCategories = useMemo(
    () =>
      searchQuery.trim()
        ? allCategoriesForSearch.filter(
            (c) =>
              c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.slug.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((c) => ({ label: c.label, slug: c.slug }))
        : [],
    [searchQuery, allCategoriesForSearch]
  );

  const handleAddPrimary = (cat: CategoryItem) => {
    setPrimaryCategory(cat);
    setSearchQuery("");
    setShowAllCategoriesView(false);
    setSeeAllSelectedMain(null);
  };

  const handleAddSecondary = (cat: CategoryItem) => {
    if (secondaryCategories.length >= maxSecondary) return;
    if (secondaryCategories.some((c) => c.slug === cat.slug)) return;
    if (primaryCategory?.slug === cat.slug) return;
    setSecondaryCategories((prev) => [...prev, cat]);
    setSearchQuery("");
    setShowAllCategoriesView(false);
    setSeeAllSelectedMain(null);
  };

  const handleRemovePrimary = () => setPrimaryCategory(null);
  const handleRemoveSecondary = (slug: string) => setSecondaryCategories((prev) => prev.filter((c) => c.slug !== slug));

  const handleSeeAllBack = () => {
    if (seeAllStep === "sub") {
      setSeeAllStep("main");
      setSeeAllSelectedSub(null);
    } else {
      setShowAllCategoriesView(false);
      setSeeAllSelectedMain(null);
    }
  };

  const handleSeeAllContinue = () => {
    if (seeAllStep === "main" && seeAllSelectedMain) {
      setSeeAllStep("sub");
      setSeeAllSelectedSub(null);
    } else if (seeAllStep === "sub" && seeAllSelectedSub) {
      setPrimaryCategory(seeAllSelectedSub);
      setShowAllCategoriesView(false);
      setSeeAllStep("main");
      setSeeAllSelectedMain(null);
      setSeeAllSelectedSub(null);
    }
  };

  const handleSubBack = () => {
    setSeeAllStep("main");
    setSeeAllSelectedSub(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setMessage(null);
    setSaving(true);
    const primarySlug = primaryCategory?.slug ?? null;
    const secondarySlugs = secondaryCategories.map((c) => c.slug);
    const primaryOption = primarySlug ? allCategoriesForSearch.find((c) => c.slug === primarySlug) : null;
    const primaryGroupSlug = primaryOption?.groupSlug ?? primaryOption?.mainSlug ?? null;
    const primaryCategoryId = primaryOption?.categoryId ?? null;
    const payload: Record<string, unknown> = {
      category_slug: primarySlug,
      secondary_category_slugs: secondarySlugs,
    };
    if (primaryGroupSlug != null) payload.primary_group_slug = primaryGroupSlug;
    if (primaryCategoryId != null) payload.primary_category_id = primaryCategoryId;
    const { error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", businessId);
    setSaving(false);
    if (error) {
      const code = String((error as { code?: string }).code ?? "");
      const text =
        error.message?.includes("secondary_category_slugs") || code === "PGRST204"
          ? "Your database is missing category columns. Run migration 20260133_businesses_primary_category_columns.sql and add secondary_category_slugs if needed."
          : error.message;
      setMessage({ type: "error", text });
      return;
    }
    setMessage({ type: "success", text: "Saved." });
  };

  const showSelectPrompt = !selectedBusiness;
  const showSkeleton = selectedBusiness && loading;
  const showSeeAllSub = showAllCategoriesView && seeAllStep === "sub" && seeAllSelectedMain;
  const showSeeAllMain = showAllCategoriesView && seeAllStep === "main";
  const showMainForm = selectedBusiness && !loading && !showSeeAllSub && !showSeeAllMain;

  return (
    <>
      {showSelectPrompt && (
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Categories</h1>
        <p className="mt-2 text-sm text-gray-600">Select a business from the sidebar to manage categories.</p>
        <Link href="/business/dashboard" className="mt-4 inline-block text-sm font-medium text-[#124541] hover:underline">
          Back to dashboard
        </Link>
      </div>
      )}
      {showSkeleton && (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Categories</h1>
        <div className="mt-6 h-8 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="mt-4 h-32 rounded bg-gray-100 animate-pulse" />
      </div>
      )}
      {showSeeAllSub && (() => {
    const subCount = subcategoriesForSelectedMain.length;
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Categories</h1>

        <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
          To allow consumers to find you on Tellacity, please select a main and sub-category for your business (Don&apos;t worry, you can always change this later).
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0E0E0E]">
              Categories in{" "}
              <button
                type="button"
                onClick={handleSubBack}
                className="font-bold text-[#124541] underline hover:no-underline"
              >
                {seeAllSelectedMain.label}
              </button>{" "}
              ({subCount} {subCount === 1 ? "result" : "results"})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 px-6 py-5 sm:grid-cols-3">
            {subcategoryColumns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {column.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => setSeeAllSelectedSub(sub)}
                    className={`text-left text-sm font-medium transition-colors ${
                      seeAllSelectedSub?.slug === sub.slug
                        ? "text-[#2fb2a8] underline"
                        : "text-[#0E0E0E] hover:text-[#124541]"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleSeeAllBack}
              className="rounded-lg bg-[#2fb2a8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSeeAllContinue}
              disabled={!seeAllSelectedSub}
              className="rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 enabled:bg-[#2fb2a8] enabled:hover:bg-[#269a91]"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
      })()}
      {showSeeAllMain && (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Categories</h1>

        <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
          To allow consumers to find you on Tellacity, please select a main and sub-category for your business (Don&apos;t worry, you can always change this later).
        </p>

        {categoriesError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {categoriesError}
          </div>
        )}

        {categoriesLoading && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading categories…
          </div>
        )}

        {!categoriesLoading && mainCategoriesColumns.length === 0 && !categoriesError && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No categories found. Make sure category_groups and categories are set up in your database.
          </div>
        )}

        {!categoriesLoading && mainCategoriesColumns.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0E0E0E]">Main categories</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-6 py-5 sm:grid-cols-4">
            {mainCategoriesColumns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {column.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSeeAllSelectedMain(cat)}
                    className={`text-left text-sm font-medium transition-colors ${
                      seeAllSelectedMain?.slug === cat.slug
                        ? "text-[#2fb2a8] underline"
                        : "text-[#0E0E0E] hover:text-[#124541]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleSeeAllBack}
              className="rounded-lg bg-[#2fb2a8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSeeAllContinue}
              disabled={!seeAllSelectedMain}
              className="rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 enabled:bg-[#2fb2a8] enabled:hover:bg-[#269a91]"
            >
              Continue
            </button>
          </div>
        </div>
        )}
      </div>
      )}
      {showMainForm && (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Categories</h1>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {categoriesError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {categoriesError}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-[#0E0E0E]">Choose a category</h2>
          <p className="mt-2 text-sm text-gray-600">
            {categoriesLoading
              ? "Loading categories from your database…"
              : "Stand out on Tellacity and in search results by placing your company in the appropriate category. You can add your company in up to 6 categories (1 primary, 5 secondary)."}{" "}
            <a
              href="/help-center"
              className="inline-flex items-center gap-1 font-medium text-[#124541] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
              <ExternalLink size={14} className="shrink-0" />
            </a>
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAllCategoriesView(true)}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add
              </button>
            </div>
            <p className="text-sm text-gray-600">
              or{" "}
              <button
                type="button"
                onClick={() => setShowAllCategoriesView(true)}
                className="font-medium text-[#124541] hover:underline"
              >
                see all categories
              </button>
            </p>

            {searchQuery.trim() && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 py-2">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      if (!primaryCategory) handleAddPrimary(cat);
                      else handleAddSecondary(cat);
                    }}
                    disabled={
                      primaryCategory?.slug === cat.slug ||
                      (!!primaryCategory && secondaryCategories.some((c) => c.slug === cat.slug)) ||
                      (!!primaryCategory && secondaryCategories.length >= maxSecondary)
                    }
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-800 hover:bg-white disabled:opacity-50"
                  >
                    {cat.label}
                  </button>
                ))}
                {filteredCategories.length === 0 && <p className="px-4 py-2 text-sm text-gray-500">No categories match your search.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {primaryCategory && (() => {
          const primaryOpt = allCategoriesForSearch.find((c) => c.slug === primaryCategory.slug);
          const groupLabel = primaryOpt?.groupSlug ? (categoryGroups.find((g) => g.slug === primaryOpt.groupSlug)?.name ?? primaryOpt.groupSlug) : null;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Primary:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#2fb2a8]/15 px-3 py-1.5 text-sm font-medium text-[#0E0E0E]">
                {primaryCategory.label}
                <button type="button" onClick={handleRemovePrimary} className="rounded p-0.5 hover:bg-[#2fb2a8]/20" aria-label="Remove primary category">
                  <X size={14} />
                </button>
              </span>
              {groupLabel && <span className="text-xs text-gray-500">Group: {groupLabel}</span>}
            </div>
          );
        })()}

        {secondaryCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Secondary:</span>
            {secondaryCategories.map((cat) => (
              <span key={cat.slug} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-800">
                {cat.label}
                <button type="button" onClick={() => handleRemoveSecondary(cat.slug)} className="rounded p-0.5 hover:bg-gray-200" aria-label={`Remove ${cat.label}`}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50"
          >
            Save changes
          </button>
        </form>
      </div>
    </div>
      )}
    </>
  );
}
