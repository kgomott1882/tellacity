"use client";

import { useEffect, useState } from "react";
import type { AdminBusinessSearchRow } from "@/lib/admin/adminBusinessSearch";

export type AdminBusinessSearchResult = AdminBusinessSearchRow & {
  isClaimed: boolean;
};

type Props = {
  onSelect: (business: AdminBusinessSearchResult) => void;
  disabled?: boolean;
};

function normaliseDomain(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function rankBusinessMatch(
  row: Pick<AdminBusinessSearchRow, "name" | "website" | "website_display">,
  qLower: string,
): number {
  const name = (row.name ?? "").toLowerCase().trim();
  const domain = normaliseDomain(row.website_display ?? row.website ?? "");
  const qNoTld = qLower.replace(/\.[a-z]{2,}$/i, "");

  if (name === qLower) return 1000;
  if (domain && (domain === qLower || domain === `${qNoTld}.com`)) return 950;
  if (domain && domain.startsWith(`${qNoTld}.`)) return 800;
  if (name.startsWith(qLower)) return 700;
  if (domain && domain.startsWith(qLower)) return 600;
  if (name.includes(qLower)) return 200;
  if (domain && domain.includes(qLower)) return 100;
  return 0;
}

function claimLabel(row: AdminBusinessSearchRow): { text: string; claimed: boolean } {
  const claimed = Boolean(row.owner_id || row.is_claimed);
  return { text: claimed ? "Claimed" : "Unclaimed", claimed };
}

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400";

export default function AdminBusinessSearchInput({ onSelect, disabled = false }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<AdminBusinessSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm.trim() || disabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(async () => {
      const q = searchTerm.trim();
      try {
        const res = await fetch(
          `/api/admin/businesses/search?q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          results?: AdminBusinessSearchRow[];
        };
        if (!mounted) return;
        if (!res.ok) {
          setResults([]);
          setError(data.error ?? "Search failed.");
          return;
        }

        const qLower = q.toLowerCase();
        const ranked = (data.results ?? [])
          .map((row) => ({
            row,
            score: rankBusinessMatch(row, qLower),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map(({ row }) => ({
            ...row,
            isClaimed: Boolean(row.owner_id || row.is_claimed),
          }));

        setResults(ranked);
      } catch {
        if (!mounted) return;
        setResults([]);
        setError("Network error. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [searchTerm, disabled]);

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-700">
          Search existing business
        </span>
        <input
          type="search"
          className={inputClass}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name or website (e.g. acme.com)"
          disabled={disabled}
          autoComplete="off"
        />
      </label>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {loading ? <p className="mt-2 text-xs text-neutral-500">Searching…</p> : null}

      {!loading && searchTerm.trim() && results.length === 0 && !error ? (
        <p className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          No businesses found for &ldquo;{searchTerm.trim()}&rdquo;.
        </p>
      ) : null}

      {!loading && results.length > 0 ? (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-md border border-neutral-200 bg-white text-sm shadow-sm">
          {results.map((item) => {
            const claim = claimLabel(item);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 border-b border-neutral-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-neutral-50 disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(item);
                    setSearchTerm("");
                    setResults([]);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-neutral-900">
                      {item.name?.trim() || "Business"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">
                      {item.website_display ?? item.website ?? "No website"}
                      {item.status ? ` · ${item.status}` : ""}
                    </span>
                  </span>
                  <span
                    className={
                      claim.claimed
                        ? "shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                        : "shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800"
                    }
                  >
                    {claim.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
