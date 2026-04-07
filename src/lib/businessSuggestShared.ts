import type { SupabaseClient } from "@supabase/supabase-js";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";

export function normalizeSuggestWebsite(website: string): string {
  let domain = website.trim();
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/\/+$/, "");
  return domain.toLowerCase();
}

export type NormalizedSuggestPayload = {
  name: string;
  website_normalized: string;
  country_code: string;
  category_slug: string;
  primary_group_slug: string;
  city: string | null;
  street_address: string | null;
  phone: string | null;
  public_email: string | null;
  notes: string | null;
};

export async function validateSuggestCategory(
  supabase: SupabaseClient,
  categorySlug: string,
  groupSlug: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: pickedCat, error: catLookupErr } = await supabase
    .from("categories")
    .select("slug, group_slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (catLookupErr || !pickedCat?.slug) {
    return { ok: false, message: "Choose a valid category." };
  }

  if (String(pickedCat.group_slug ?? "").trim() !== groupSlug) {
    return { ok: false, message: "Category does not match the selected primary group." };
  }

  return { ok: true };
}

export async function insertSuggestedBusiness(
  supabase: SupabaseClient,
  payload: NormalizedSuggestPayload
): Promise<{ ok: true; slug: string } | { ok: false; message: string; code?: string }> {
  const slug = await allocateUniqueBusinessSlug(supabase, payload.name);

  const { data: newBusiness, error: insertError } = await supabase
    .from("businesses")
    .insert({
      name: payload.name,
      slug,
      website: payload.website_normalized,
      country_code: payload.country_code,
      category_slug: payload.category_slug,
      primary_group_slug: payload.primary_group_slug,
      address: payload.street_address,
      city: payload.city,
      phone: payload.phone,
      email: payload.public_email,
      description: payload.notes,
      source: "user_suggested",
      submission_status: "approved",
      status: "active",
    })
    .select("slug")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: false,
        message: "A business with this website or slug already exists.",
        code: insertError.code,
      };
    }
    return { ok: false, message: insertError.message || "Failed to create suggestion.", code: insertError.code };
  }

  return { ok: true, slug: (newBusiness as { slug: string }).slug };
}
