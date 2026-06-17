"use client";

import { useEffect, useState } from "react";
import { loadCategoryCatalogFromBrowser } from "@/lib/categoryCatalogBrowser";

export type CategoryGroupOption = { name: string; group_slug: string };
export type CategoryOption = { name: string; slug: string; group_slug: string };

/** Match categories to the selected primary group (same logic as /suggest-business). */
export function filterCategoriesByPrimaryGroup(
  categories: CategoryOption[],
  primaryGroupSlug: string,
): CategoryOption[] {
  const g = primaryGroupSlug.trim().toLowerCase();
  if (!g) return [];
  return categories.filter((c) => (c.group_slug ?? "").trim().toLowerCase() === g);
}

async function fetchCatalogFromApi(): Promise<{
  groups: CategoryGroupOption[];
  categories: CategoryOption[];
} | null> {
  const res = await fetch("/api/business/category-catalog", {
    method: "GET",
    credentials: "same-origin",
  }).catch(() => null);

  if (!res?.ok) {
    return null;
  }

  const json = (await res.json().catch(() => ({}))) as {
    groups?: CategoryGroupOption[];
    categories?: CategoryOption[];
    error?: string;
  };

  return {
    groups: Array.isArray(json.groups) ? json.groups : [],
    categories: Array.isArray(json.categories) ? json.categories : [],
  };
}

/**
 * Loads category_groups + categories via GET /api/business/category-catalog,
 * with a direct Supabase browser fallback when the API route is unavailable.
 */
export function useCategoryGroupCatalog(enabled: boolean) {
  const [groups, setGroups] = useState<CategoryGroupOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setGroups([]);
      setCategories([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const apiPayload = await fetchCatalogFromApi();
        const browserPayload =
          apiPayload &&
          (apiPayload.groups.length > 0 || apiPayload.categories.length > 0)
            ? apiPayload
            : await loadCategoryCatalogFromBrowser();

        if (!mounted) return;

        if (!browserPayload || browserPayload.groups.length === 0) {
          setGroups([]);
          setCategories([]);
          setLoadError("Could not load categories.");
          setLoading(false);
          return;
        }

        setGroups(browserPayload.groups);
        setCategories(browserPayload.categories);
      } catch {
        if (!mounted) return;
        setGroups([]);
        setCategories([]);
        setLoadError("Could not load categories.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { groups, categories, loading, loadError };
}
