"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type BusinessSearchResult = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
};

type BusinessSearchInputProps = {
  onSelect: (business: BusinessSearchResult) => void;
  placeholder: string;
  className?: string;
  label?: string;
  externalError?: string | null;
  /**
   * Optional callback when the user submits the current query
   * (hero button click, Enter key, or "Show all results" CTA).
   */
  onSubmitQuery?: (query: string) => void;
  /**
   * When true, renders the Trustpilot-style hero layout:
   * - search icon on the left inside the field
   * - primary CTA button on the right ("Find a business")
   * - dropdown panel with "Show all results" at the bottom.
   */
  heroLayout?: boolean;
  /** Label for the primary hero button (defaults to "Find a business"). */
  heroButtonLabel?: string;
};

export default function BusinessSearchInput({
  onSelect,
  placeholder,
  className,
  label,
  externalError,
  onSubmitQuery,
  heroLayout = false,
  heroButtonLabel = "Find a business",
}: BusinessSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let isMounted = true;
    setSearchLoading(true);

    const timeout = setTimeout(async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, website, website_display, status")
        .eq("status", "active")
        .ilike("name", `%${searchTerm.trim()}%`)
        .limit(6);

      if (!isMounted) return;
      if (error || !data) {
        setSearchResults([]);
      } else {
        const results: BusinessSearchResult[] = (data as any[]).map((row) => ({
          id: row.id,
          name: row.name ?? "Business",
          slug: row.slug,
          website: row.website_display ?? row.website ?? null,
        }));
        setSearchResults(results);
      }
      setSearchLoading(false);
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const handleSubmit = () => {
    const q = searchTerm.trim();
    if (!q || !onSubmitQuery) return;
    onSubmitQuery(q);
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor="business-search"
          className="text-xs font-medium text-[#111827]"
        >
          {label}
        </label>
      )}

      {heroLayout ? (
        <div className="mt-2 flex w-full items-stretch rounded-full bg-white border border-[#124541] shadow-[0_0_16px_rgba(18,69,65,0.55)]">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#124541] shadow">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              id="business-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={placeholder}
              className="h-11 w-full rounded-l-full rounded-r-none border border-transparent pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/30"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!searchTerm.trim()}
            className="h-11 rounded-r-full bg-[#124541] px-5 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_0_16px_rgba(18,69,65,0.55)] disabled:opacity-60"
          >
            {heroButtonLabel}
          </button>
        </div>
      ) : (
        <input
          id="business-search"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
        />
      )}

      {externalError && (
        <p className="mt-2 text-xs text-red-600">{externalError}</p>
      )}
      {searchLoading && (
        <p className="mt-2 text-xs text-gray-500">Searching businesses…</p>
      )}
      {!searchLoading && searchTerm.trim() && searchResults.length === 0 && (
        <div className="mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm shadow-lg">
          <p className="px-4 py-3 text-gray-500">
            No businesses found for &ldquo;{searchTerm.trim()}&rdquo;.
          </p>
          <Link
            href={`/suggest-business?name=${encodeURIComponent(searchTerm.trim())}`}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#1FAF9E] hover:bg-gray-50"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E]/10 text-[#1FAF9E]" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Suggest a missing business
          </Link>
        </div>
      )}
      {!searchLoading && searchResults.length > 0 && (
        <div
          className={`mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm shadow-lg ${
            heroLayout ? "" : ""
          }`}
        >
          <ul className="max-h-80 overflow-y-auto">
            {searchResults.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    onSelect(item);
                    setSearchResults([]);
                    setSearchTerm("");
                  }}
                >
                  <span className="text-sm font-semibold text-[#124541]">
                    {item.name}
                  </span>
                  {item.website ? (
                    <span className="mt-1 text-xs text-gray-500">
                      {item.website}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {heroLayout && onSubmitQuery && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!searchTerm.trim()}
              className="mt-2 flex w-full items-center justify-center rounded-none bg-[#124541] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
            >
              Show all results&nbsp;→
            </button>
          )}
        </div>
      )}
    </div>
  );
}

