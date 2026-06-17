import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type {
  CategoryCatalogCategory,
  CategoryCatalogGroup,
  CategoryCatalogPayload,
} from "@/lib/categoryCatalogServer";

/** Browser fallback when `/api/business/category-catalog` is unavailable (e.g. Turbopack dev). */
export async function loadCategoryCatalogFromBrowser(): Promise<CategoryCatalogPayload | null> {
  try {
    const supabase = supabaseBrowser();
    const [{ data: groupsData, error: gErr }, { data: categoriesData, error: cErr }] =
      await Promise.all([
        supabase.from("category_groups").select("name, slug").order("name"),
        supabase.from("categories").select("name, slug, group_slug").order("name"),
      ]);

    if (gErr || cErr) {
      console.warn("[category-catalog] browser fallback:", gErr?.message ?? cErr?.message);
      return null;
    }

    const categories: CategoryCatalogCategory[] = (categoriesData ?? []).map((r) => ({
      name: r.name,
      slug: r.slug,
      group_slug: String(r.group_slug ?? "").trim(),
    }));

    const groupSlugsWithCategories = new Set(
      categories.map((c) => c.group_slug.trim().toLowerCase()).filter(Boolean),
    );

    const groups: CategoryCatalogGroup[] = (groupsData ?? [])
      .filter((r) => {
        const s = String(r.slug ?? "").trim().toLowerCase();
        return groupSlugsWithCategories.has(s);
      })
      .map((r) => ({
        name: r.name,
        group_slug: String(r.slug ?? "").trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { groups, categories };
  } catch {
    return null;
  }
}
