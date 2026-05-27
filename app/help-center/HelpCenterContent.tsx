"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  HELP_ENTRIES,
  helpEntryPlainText,
  type HelpEntry,
} from "@/lib/helpCenterEntries";
import type { FaqSegment } from "@/lib/faqItems";

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

function HelpAnswer({ segments }: { segments: FaqSegment[] }) {
  const nodes: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (segment.type === "text") {
      nodes.push(segment.value);
      return;
    }

    nodes.push(
      <Link key={`${segment.href}-${index}`} href={segment.href} className={linkClass}>
        {segment.label}
      </Link>,
    );
  });

  return <>{nodes}</>;
}

function filterEntries(entries: HelpEntry[], query: string): HelpEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      helpEntryPlainText(entry).toLowerCase().includes(q) ||
      entry.section.toLowerCase().includes(q),
  );
}

export default function HelpCenterContent() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterEntries(HELP_ENTRIES, query), [query]);

  const bySection = useMemo(() => {
    const map = new Map<string, HelpEntry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.section) ?? [];
      list.push(entry);
      map.set(entry.section, list);
    }
    return map;
  }, [filtered]);

  const sectionOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const entry of HELP_ENTRIES) {
      if (!seen.has(entry.section)) {
        seen.add(entry.section);
        order.push(entry.section);
      }
    }
    return order;
  }, []);

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Welcome to the Tellacity Help Center. Here you&apos;ll find clear
            answers about how reviews work, how trust is maintained, and how
            both consumers and businesses can use Tellacity fairly and
            effectively. Use the search box or browse by topic to find quick
            answers, platform policies, and guidance for common actions like
            writing reviews, claiming a business, and managing disputes.
          </p>
          <form
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
            role="search"
          >
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="text-lg" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                placeholder="Search for answers"
                aria-label="Search for answers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 bg-transparent text-sm text-[#0E0E0E] placeholder:text-gray-400 focus:outline-none"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0B3B36] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a302c]"
            >
              Search
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Examples: &quot;verification&quot;, &quot;billing&quot;,
            &quot;reviews&quot;, &quot;claim business&quot;
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-10 px-6 pb-16">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-600">
              No results for &quot;{query}&quot;. Try different keywords (e.g.
              verification, billing, reviews, claim business).
            </p>
          ) : (
            sectionOrder.map((section) => {
              const entries = bySection.get(section);
              if (!entries?.length) return null;
              const first = entries[0];
              return (
                <div key={section}>
                  <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                    {section}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {first.sectionDesc}
                  </p>
                  <div className="mt-6 space-y-4">
                    {entries.map((entry) => (
                      <article
                        key={entry.title}
                        className="rounded-xl border border-gray-200 bg-white p-5"
                      >
                        <h3 className="text-sm font-semibold text-[#0E0E0E]">
                          {entry.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          <HelpAnswer segments={entry.segments} />
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Related help articles
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Use these pages for deeper guidance on verification, moderation,
              trust, and the reputation platform.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/reviewer-guidelines" className={linkClass}>
                  Reviewer Guidelines
                </Link>
              </li>
              <li>
                <Link href="/how-tellacity-works" className={linkClass}>
                  How Tellacity Works
                </Link>
              </li>
              <li>
                <Link href="/safety-trust" className={linkClass}>
                  Safety &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/reputation-platform" className={linkClass}>
                  Reputation Platform
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About Tellacity
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-gray-600">
              The Tellacity Help Center works alongside our{" "}
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>{" "}
              and{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>{" "}
              to explain how the platform stays fair.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
