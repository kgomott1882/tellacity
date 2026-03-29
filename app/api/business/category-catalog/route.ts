export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type CategoryCatalogGroup = { name: string; group_slug: string };
export type CategoryCatalogCategory = {
  name: string;
  slug: string;
  group_slug: string;
};

/**
 * Public taxonomy for forms (suggest-business, dashboard onboarding, post-signup).
 * Same rules as app/suggest-business/page.tsx: only groups that have ≥1 category.
 */
export async function GET() {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: groupsData, error: gErr }, { data: categoriesData, error: cErr }] =
      await Promise.all([
        admin.from("category_groups").select("name, slug").order("name"),
        admin.from("categories").select("name, slug, group_slug").order("name"),
      ]);

    if (gErr || cErr) {
      console.error("category-catalog:", gErr || cErr);
      return NextResponse.json({ error: "catalog_load_failed" }, { status: 500 });
    }

    const categories: CategoryCatalogCategory[] = (categoriesData ?? []).map(
      (r: { name: string; slug: string; group_slug: string | null }) => ({
        name: r.name,
        slug: r.slug,
        group_slug: String(r.group_slug ?? "").trim(),
      })
    );

    const groupSlugsWithCategories = new Set(
      categories.map((c) => c.group_slug.trim().toLowerCase()).filter(Boolean)
    );

    const groups: CategoryCatalogGroup[] = (groupsData ?? [])
      .filter((r: { slug: string | null }) => {
        const s = String(r.slug ?? "").trim().toLowerCase();
        return groupSlugsWithCategories.has(s);
      })
      .map((r: { name: string; slug: string | null }) => ({
        name: r.name,
        group_slug: String(r.slug ?? "").trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      groups,
      categories,
    });
  } catch (e) {
    console.error("category-catalog:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
