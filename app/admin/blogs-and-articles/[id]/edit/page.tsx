import PlatformArticleEditorPage from "@/components/admin/PlatformArticleEditorPage";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditPlatformArticlePage(props: PageProps) {
  const { id } = await props.params;
  return <PlatformArticleEditorPage articleId={id} />;
}
