import { Suspense } from "react";
import type { Metadata } from "next";
import WriteReviewSlugClient from "./WriteReviewSlugClient";
import { WRITE_REVIEW_ROBOTS } from "@/lib/businessIndexability";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

/**
 * SEO contract: review forms canonicalise to `/b/[slug]` and must not be indexed.
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

  const baseRobots = WRITE_REVIEW_ROBOTS;

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
