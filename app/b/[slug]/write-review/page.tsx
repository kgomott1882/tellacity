import { redirect } from "next/navigation";

/**
 * Legacy path from older emails/widgets. Canonical URL is /write-review/[slug].
 */
export default async function LegacyBusinessWriteReviewRedirect(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const v of val) q.append(key, v);
    } else {
      q.set(key, val);
    }
  }
  const qs = q.toString();
  redirect(
    `/write-review/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`,
  );
}
