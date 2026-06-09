import ArticlesModerationQueue from "./ArticlesModerationQueue";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Articles · Tellacity Admin",
};

export default function AdminArticlesPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 border-b border-neutral-100 pb-4">
          <h1 className="text-lg font-semibold text-neutral-900">Articles</h1>
          <p className="text-sm text-neutral-600">
            Review business-submitted articles and case studies before they appear on{" "}
            <code className="text-xs">/articles</code>. Rejecting returns the business&apos;s
            monthly credit and emails the owner.
          </p>
        </div>
        <ArticlesModerationQueue />
      </div>
    </div>
  );
}
