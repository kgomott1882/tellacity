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

const REVIEWER_SECTIONS = new Set([
  "Getting Started",
  "Reviews",
  "Trust, Verification & Moderation",
  "Platform & Global Reach",
]);

const BUSINESS_SECTIONS = new Set([
  "Getting Started",
  "Businesses on Tellacity",
  "Plans & Billing",
  "Trust, Verification & Moderation",
]);

type AudienceFilter = "all" | "reviewer" | "business";

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

function sectionsForAudience(audience: AudienceFilter): Set<string> | null {
  if (audience === "reviewer") return REVIEWER_SECTIONS;
  if (audience === "business") return BUSINESS_SECTIONS;
  return null;
}

export default function HelpCenterContent() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>("all");

  const filtered = useMemo(() => filterEntries(HELP_ENTRIES, query), [query]);

  const audienceSections = sectionsForAudience(audience);

  const filteredByAudience = useMemo(() => {
    if (!audienceSections) return filtered;
    return filtered.filter((e) => audienceSections.has(e.section));
  }, [filtered, audienceSections]);

  const bySection = useMemo(() => {
    const map = new Map<string, HelpEntry[]>();
    for (const entry of filteredByAudience) {
      const list = map.get(entry.section) ?? [];
      list.push(entry);
      map.set(entry.section, list);
    }
    return map;
  }, [filteredByAudience]);

  const sectionOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const entry of HELP_ENTRIES) {
      if (audienceSections && !audienceSections.has(entry.section)) continue;
      if (!seen.has(entry.section)) {
        seen.add(entry.section);
        order.push(entry.section);
      }
    }
    return order;
  }, [audienceSections]);

  const scrollToArticles = (nextAudience: AudienceFilter) => {
    setAudience(nextAudience);
    window.setTimeout(() => {
      document.getElementById("help-articles")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  return (
    <main className="bg-[#F5F3EF]">
      <section className="relative overflow-hidden bg-[#1FAF9E]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
        >
          <span className="absolute left-[12%] top-[18%] h-3 w-3 rotate-45 bg-[#0E0E0E]/10" />
          <span className="absolute left-[28%] top-[42%] h-2 w-2 rounded-full bg-[#0E0E0E]/15" />
          <span className="absolute right-[38%] top-[24%] h-4 w-4 bg-[#0E0E0E]/8" />
          <span className="absolute right-[22%] bottom-[28%] h-2.5 w-2.5 rotate-12 bg-[#0E0E0E]/12" />
          <span className="absolute left-[45%] bottom-[18%] h-2 w-2 rounded-full bg-[#0E0E0E]/10" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-12 pb-0 sm:pt-14 lg:pt-16">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_minmax(320px,42rem)] lg:gap-4">
            <div className="pb-12 text-left sm:pb-14 lg:pb-16">
              <h1 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Tellacity Help Center
              </h1>
              <p className="mt-3 text-lg font-semibold text-[#0E0E0E] sm:text-xl">
                Let&apos;s find the answers together{" "}
                <span aria-hidden className="text-[#0E0E0E]">
                  ★
                </span>
              </p>

              <form
                className="mt-8 flex max-w-xl items-center rounded-full bg-white p-1.5 shadow-md"
                onSubmit={(e) => e.preventDefault()}
                role="search"
              >
                <label className="flex min-w-0 flex-1 items-center gap-3 pl-4">
                  <span className="sr-only">Search for answers</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search for answers"
                    aria-label="Search for answers"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full border-0 bg-transparent py-2.5 text-sm text-[#0E0E0E] placeholder:text-gray-400 focus:outline-none"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#124541] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B3B36]"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="relative flex w-full items-end justify-center lg:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Customer%20Support.png"
                alt="Customer support"
                className="relative z-10 block h-auto w-full max-w-[400px] object-contain object-bottom sm:max-w-[520px] lg:max-w-[640px] lg:translate-x-2"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-4 pt-10 sm:pt-12 lg:pt-14">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0E0E0E]">For reviewers</h2>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">
                Everything you need to know about using Tellacity as a reviewer
                is here. Learn how to write reviews, find trustworthy businesses,
                and understand how moderation keeps feedback fair.
              </p>
              <button
                type="button"
                onClick={() => scrollToArticles("reviewer")}
                className="mt-6 text-left text-sm font-semibold text-[#124541] hover:text-[#1FAF9E]"
              >
                See reviewer articles →
              </button>
            </article>

            <article className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0E0E0E]">For businesses</h2>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">
                Using Tellacity for your business? Explore guidance on claiming
                your profile, responding to reviews, plans and billing, and
                tools on the reputation platform.
              </p>
              <button
                type="button"
                onClick={() => scrollToArticles("business")}
                className="mt-6 text-left text-sm font-semibold text-[#124541] hover:text-[#1FAF9E]"
              >
                See business articles →
              </button>
            </article>
          </div>
        </div>
      </section>

      <section id="help-articles" className="scroll-mt-24 px-6 pb-16 pt-10">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
            Your one stop for all things self-service
          </h2>

          {audience !== "all" ? (
            <p className="mt-4 text-center text-sm text-gray-600">
              Showing articles for{" "}
              <span className="font-medium text-[#0E0E0E]">
                {audience === "reviewer" ? "reviewers" : "businesses"}
              </span>
              .{" "}
              <button
                type="button"
                onClick={() => setAudience("all")}
                className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Show all topics
              </button>
            </p>
          ) : null}

          <div className="mt-10 space-y-10">
            {filteredByAudience.length === 0 ? (
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
                    <h3 className="text-2xl font-semibold text-[#0E0E0E]">
                      {section}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {first.sectionDesc}
                    </p>
                    <div className="mt-6 space-y-4">
                      {entries.map((entry) => (
                        <article
                          key={entry.title}
                          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <h4 className="text-sm font-semibold text-[#0E0E0E]">
                            {entry.title}
                          </h4>
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

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#0E0E0E]">
                Related help articles
              </h3>
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
                    Reputation Management Platform
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={linkClass}>
                    About Tellacity
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full bg-[#FBBF24]"
        aria-labelledby="help-center-welcome-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(14,14,14,0.12)]">
              <div className="grid min-h-[220px] sm:grid-cols-[minmax(0,42%)_1fr]">
                <div className="relative flex items-center bg-[#1FAF9E] px-6 py-8 sm:py-10">
                  <svg
                    className="pointer-events-none absolute -right-px top-0 h-full w-8 text-[#1FAF9E] sm:w-10"
                    viewBox="0 0 40 200"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M0,0 C18,45 22,95 40,120 L40,200 L0,200 Z"
                    />
                  </svg>
                  <p className="relative z-10 text-xl font-bold leading-snug text-[#0E0E0E] sm:text-2xl">
                    Welcome to your Support Hub
                  </p>
                </div>
                <div className="relative min-h-[180px] bg-[#F5F3EF] sm:min-h-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/Man%20at%20Office.png"
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>
            </div>

            <div className="text-[#0E0E0E]">
              <h2
                id="help-center-welcome-heading"
                className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-tight"
              >
                Your Tellacity Support Hub
              </h2>
              <p className="mt-3 text-lg font-semibold sm:text-xl">
                How can we assist?
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
                Explore helpful guides and resources created to make your
                experience seamless. From managing reviews and verification to
                understanding your account, profile, and business tools.
                Everything you need is right here.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#0E0E0E]/80 sm:text-base">
                Can&apos;t find what you&apos;re looking for? Reach out to{" "}
                <Link href="/contact/support" className={linkClass}>
                  support
                </Link>{" "}
                or visit our{" "}
                <Link href="/faq" className={linkClass}>
                  FAQ page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
