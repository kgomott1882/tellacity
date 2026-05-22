import { Suspense } from "react";
import type { Metadata } from "next";
import WriteReviewSlugClient from "./WriteReviewSlugClient";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

/**
 * SEO contract: this route is INDEXABLE (the user wants every public page
 * crawlable). To avoid Google flagging it as "Duplicate without
 * user-selected canonical" against the matching `/b/<slug>` business
 * profile, we emit a canonical tag pointing at the business profile's
 * canonical slug. Google will then consolidate link equity to the
 * business page while still allowing crawl/follow on this form route.
 */
export async function generateMetadata(
  props: { params: Promise<{ business_slug: string }> }
): Promise<Metadata> {
  const { business_slug } = await props.params;
  const slug = business_slug.trim().toLowerCase();
  const supabase = createClient();

  let { data: row } = await supabase
    .from("businesses")
    .select("name, slug, canonical_slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!row) {
    const { data: byCanonical } = await supabase
      .from("businesses")
      .select("name, slug, canonical_slug")
      .eq("canonical_slug", slug)
      .eq("status", "active")
      .maybeSingle();
    row = byCanonical ?? null;
  }

  const baseRobots = { index: true, follow: true } as const;

  if (!row) {
    return {
      title: "Write a review | Tellacity",
      robots: baseRobots,
    };
  }

  const name = String((row as { name?: string | null }).name ?? "").trim();
  const canonicalSlug =
    String((row as { canonical_slug?: string | null }).canonical_slug ?? "")
      .trim()
      .toLowerCase() ||
    String((row as { slug?: string | null }).slug ?? slug)
      .trim()
      .toLowerCase();

  return {
    title: name
      ? `Write a review for ${name} | Tellacity`
      : "Write a review | Tellacity",
    description: name
      ? `Share your experience with ${name} on Tellacity. Submit a verified review and help other customers.`
      : "Submit a verified customer review on Tellacity.",
    robots: baseRobots,
    alternates: {
      canonical: `https://tellacity.com/b/${canonicalSlug}`,
    },
  };
}

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug: slug } = await params;

  return (
    <Suspense fallback={null}>
      <WriteReviewSlugClient businessSlug={slug} />
    </Suspense>
  );
}
