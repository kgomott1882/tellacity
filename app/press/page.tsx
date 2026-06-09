import PressClient from "./PressClient";
import {
  ITEMS_PER_PAGE,
  getSortedPressItems,
} from "./pressData";

export default async function PressPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const rawPage = sp.page ?? "1";
  const page = Math.max(1, parseInt(rawPage, 10) || 1);

  const sortedItems = getSortedPressItems();
  const featuredArticle = sortedItems[0];
  const gridArticles = sortedItems.slice(1);

  const totalPages = Math.ceil(gridArticles.length / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginatedGrid = gridArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <PressClient
      featuredArticle={featuredArticle}
      paginatedGrid={paginatedGrid}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
