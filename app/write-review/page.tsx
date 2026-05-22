import { Suspense } from "react";
import type { Metadata } from "next";
import WriteReviewPageInner from "./WriteReviewPageInner";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * SEO contract: this route is INDEXABLE and supports a `?businessSlug=`
 * query param that identifies the business being reviewed. When that
 * param is present, we resolve the business and emit a canonical tag
 * pointing at `/b/<canonical_slug>` so Google consolidates the
 * write-review URL to the matching business profile (instead of
 * flagging it as "Duplicate without user-selected canonical").
 *
 * When no `businessSlug` is passed, the page is a generic write-review
 * landing surface and self-canonicals to `/write-review`.
 */
export async function generateMetadata(
  props: { searchParams: Promise<{ businessSlug?: string }> }
): Promise<Metadata> {
  const { businessSlug } = await props.searchParams;
  const baseRobots = { index: true, follow: true } as const;
  const fallback: Metadata = {
    title: "Write a review | Tellacity",
    robots: baseRobots,
    alternates: {
      canonical: "https://tellacity.com/write-review",
    },
  };

  if (!businessSlug) return fallback;

  const slug = businessSlug.trim().toLowerCase();
  if (!slug) return fallback;

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

  if (!row) return fallback;

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

export default function WriteReviewPage() {
  return (
    <Suspense fallback={null}>
      <WriteReviewPageInner />
    </Suspense>
  );
}
