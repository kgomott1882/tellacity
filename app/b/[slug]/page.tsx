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

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isRedirected =
    resolvedSearchParams.redirected === "1" ||
    (Array.isArray(resolvedSearchParams.redirected) &&
      resolvedSearchParams.redirected.includes("1"));
  const hasSearchParams = Object.keys(resolvedSearchParams).length > 0;

  if (hasSearchParams && !resolvedSearchParams.redirected) {
    console.log("STRIPPING_QUERY_PARAMS_SAFE");

    redirect(`/b/${normalizedSlug}?redirected=1`);
  }

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

  if (!business) {
    const { data: businessByCanonical } = await supabase
      .from("businesses")
      .select("*")
      .eq("canonical_slug", slug.trim())
      .eq("status", "active")
      .maybeSingle();

    if (businessByCanonical) {
      business = businessByCanonical;
    }
  }

  const cleanSlug = cleanSlugForRedirect(slug);
  if (!business && cleanSlug && cleanSlug !== normalizedSlug) {
    const { data: fallbackRow } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", cleanSlug)
      .eq("status", "active")
      .maybeSingle();
    business = fallbackRow ?? null;
  }

  if (!business || !business.slug) {
    console.log("NO_BUSINESS_RENDER", { inputSlug: normalizedSlug });
    return notFound();
  }

  const finalSlug = business.slug.toLowerCase();
  const currentSlug = normalizedSlug;

  // 🚫 HARD LOOP PREVENTION
  if (finalSlug === currentSlug) {
    return <BusinessClient initialBusiness={business} />;
  }

  // 🚫 DO NOT REDIRECT IF THIS SLUG ALREADY LOOKS CANONICAL
  if (normalizedSlug === business.slug.toLowerCase()) {
    return <BusinessClient initialBusiness={business} />;
  }

  // 🚫 ONLY redirect if we are SURE this is a different valid slug
  if (!isRedirected && finalSlug !== currentSlug) {
    console.log("REDIRECT_DISABLED", {
      currentSlug,
      finalSlug,
    });
  }

  console.log("Business found:", (business as { name?: string | null }).name);
  return <BusinessClient initialBusiness={business} />;
}
