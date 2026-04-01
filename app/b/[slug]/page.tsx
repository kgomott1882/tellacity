import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import { cleanSlugForRedirect } from "@/lib/businessSlug";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

type BusinessMetaRow = {
  name?: string | null;
  slug?: string | null;
  canonical_slug?: string | null;
};

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createClient();

  const { data: businessBySlug } = await supabase
    .from("businesses")
    .select("name, slug, canonical_slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  let business: BusinessMetaRow | null = businessBySlug;

  if (!business) {
    const { data: businessByCanonical } = await supabase
      .from("businesses")
      .select("name, slug, canonical_slug")
      .eq("canonical_slug", slug.trim())
      .eq("status", "active")
      .maybeSingle();

    if (businessByCanonical) {
      business = businessByCanonical;
    }
  }

  if (!business) {
    const normalized = slug.trim().toLowerCase();
    const cleanSlug = cleanSlugForRedirect(slug);
    if (cleanSlug && cleanSlug !== normalized) {
      const { data: fallbackRow } = await supabase
        .from("businesses")
        .select("name, slug, canonical_slug")
        .eq("slug", cleanSlug)
        .eq("status", "active")
        .maybeSingle();
      business = fallbackRow ?? null;
    }
  }

  if (!business) {
    return {
      title: `${slug} Reviews | Tellacity`,
    };
  }

  const finalSlug = business.canonical_slug || business.slug || slug;
  const name = String(business.name ?? "").trim() || slug;

  return {
    title: `${name} Reviews | Tellacity`,
    alternates: {
      canonical: `https://tellacity.com/b/${finalSlug}`,
    },
  };
}

export default async function BusinessPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?:
      | Promise<Record<string, string | string[] | undefined>>
      | Record<string, string | string[] | undefined>;
  }
) {
  const { slug } = await props.params;
  const normalizedSlug = slug.trim().toLowerCase();
  const request:
    | { nextUrl?: { pathname?: string | null } | null }
    | undefined = undefined;
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const hasSearchParams =
    !!resolvedSearchParams && Object.keys(resolvedSearchParams).length > 0;
  const currentPath = `/b/${normalizedSlug}`;

  const supabase = createClient();

  const { data: businessBySlug, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.warn(
      "[b/slug] Supabase query error:",
      error.message ?? String(error),
      error.code ?? ""
    );
  }

  let business = businessBySlug;
  let foundViaCanonicalLookup = false;

  if (!business) {
    const { data: businessByCanonical } = await supabase
      .from("businesses")
      .select("*")
      .eq("canonical_slug", slug.trim())
      .eq("status", "active")
      .maybeSingle();

    if (businessByCanonical) {
      business = businessByCanonical;
      foundViaCanonicalLookup = true;
    }
  }

  if (business) {
    const canonRaw = String(
      (business as { canonical_slug?: string | null }).canonical_slug ?? ""
    ).trim();
    const canon = canonRaw.toLowerCase();

    // Already on canonical URL — never redirect (prevents infinite loops)
    if (canon && normalizedSlug === canon) {
      console.log("Business found:", business.name);
      return <BusinessClient initialBusiness={business} />;
    }

    console.log("DEBUG_CANONICAL_FLOW", {
      inputSlug: slug,
      normalizedSlug,
      canonical: canon,
      pathname: request?.nextUrl?.pathname || null,
      hasSearchParams,
      foundViaCanonicalLookup,
    });

    if (canon) {
      const target = `/b/${canon}`;
      // Already at target path — never redirect again.
      if (currentPath === target) {
        console.log("Business found:", business.name);
        return <BusinessClient initialBusiness={business} />;
      }

      if (
        normalizedSlug !== canon &&
        currentPath !== target &&
        (hasSearchParams || !foundViaCanonicalLookup)
      ) {
        redirect(target);
      }
    }

    console.log("Business found:", business.name);

    return <BusinessClient initialBusiness={business} />;
  }

  const cleanSlug = cleanSlugForRedirect(slug);
  if (cleanSlug && cleanSlug !== normalizedSlug) {
    const { data: fallbackRow } = await supabase
      .from("businesses")
      .select("slug")
      .eq("slug", cleanSlug)
      .eq("status", "active")
      .maybeSingle();

    const canonical = String(fallbackRow?.slug ?? "").trim();
    const canonicalNorm = canonical.toLowerCase();
    if (canonical) {
      const target = `/b/${canonicalNorm}`;
      if (currentPath === target) {
        return notFound();
      }
      if (canonicalNorm !== normalizedSlug && currentPath !== target) {
        redirect(`/b/${canonical}`);
      }
    }
  }

  console.warn("Business not found for slug:", slug);
  return notFound();
}
