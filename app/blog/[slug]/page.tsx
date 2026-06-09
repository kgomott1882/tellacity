import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function BlogSlugRedirect(props: PageProps) {
  const { slug } = await props.params;
  redirect(`/articles/${encodeURIComponent(slug.trim().toLowerCase())}`);
}
