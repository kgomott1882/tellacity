"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlatformArticleRow } from "@/lib/platformArticles/types";
import { createPlatformArticleDraft } from "@/lib/admin/createPlatformArticleDraft";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusClass(status: string): string {
  if (status === "published") return "bg-emerald-100 text-emerald-800";
  if (status === "archived") return "bg-neutral-200 text-neutral-700";
  return "bg-amber-100 text-amber-800";
}

export default function PlatformArticlesAdminList() {
  const [articles, setArticles] = useState<PlatformArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-articles", { cache: "no-store" });
      const json = (await res.json()) as {
        articles?: PlatformArticleRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load articles");
      setArticles(json.articles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const syncCatalog = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-articles/sync-catalog", {
        method: "POST",
      });
      const json = (await res.json()) as {
        inserted?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      const inserted = json.inserted ?? 0;
      const skipped = json.skipped ?? 0;
      setSyncMessage(
        inserted > 0
          ? `Imported ${inserted} existing Tellacity article${inserted === 1 ? "" : "s"} into the CMS.`
          : skipped > 0
            ? "All existing Tellacity catalog articles are already in the CMS."
            : "Catalog sync completed.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleNewArticle = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const id = await createPlatformArticleDraft();
      router.push(`/admin/blogs-and-articles/${encodeURIComponent(id)}/edit?guide=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create article");
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/platform-articles/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json")
        ? ((await res.json()) as { error?: string; ok?: boolean })
        : null;
      if (!res.ok) {
        throw new Error(json?.error ?? `Delete failed (${res.status})`);
      }
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Blogs and Articles</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Create and manage Tellacity editorial articles published on the public Articles hub.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void syncCatalog()}
            className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            {syncing ? "Syncing catalog…" : "Sync Tellacity catalog"}
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleNewArticle()}
            className="rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating…" : "New article"}
          </button>
        </div>
      </div>

      {syncMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {syncMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-neutral-500">
                  Loading…
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-neutral-500">
                  No Tellacity articles in the CMS yet. Use &quot;Sync Tellacity catalog&quot; to
                  import existing published articles, or create a new one.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{article.title}</div>
                    <div className="font-mono text-xs text-neutral-500">/articles/{article.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(article.status)}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatWhen(article.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/blogs-and-articles/${article.id}/edit`}
                        className="text-[#1FAF9E] font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      {article.status === "published" ? (
                        <Link
                          href={`/articles/${encodeURIComponent(article.slug)}`}
                          target="_blank"
                          className="text-neutral-600 hover:underline"
                        >
                          View
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={deletingId === article.id}
                        onClick={() => void handleDelete(article.id, article.title)}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
