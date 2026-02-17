"use client";

import { useMemo, useState } from "react";

type HelpEntry = {
  section: string;
  sectionDesc: string;
  title: string;
  body: string;
};

const HELP_ENTRIES: HelpEntry[] = [
  {
    section: "Getting Started",
    sectionDesc: "New to Tellacity? Start here.",
    title: "What is Tellacity?",
    body:
      "Tellacity is a customer review and feedback platform designed to help people make informed decisions and help businesses build trust through transparency. Reviews on Tellacity are tied to real users and are moderated to protect fairness for both customers and businesses.",
  },
  {
    section: "Getting Started",
    sectionDesc: "New to Tellacity? Start here.",
    title: "Who can use Tellacity?",
    body:
      "Tellacity is open to: Consumers, who can write and read reviews about businesses. Businesses, who can claim their profiles, respond to reviews, and manage their reputation. Both groups follow the same trust and content rules.",
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "How do I write a review?",
    body:
      "You can write a review by searching for a business on Tellacity and selecting Write a Review. You'll be asked to rate your experience, describe what happened, and verify your identity before the review is published.",
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "What is a Verified Review?",
    body:
      "A Verified Review means Tellacity has taken steps to confirm the reviewer's identity or experience. Verification helps prevent fake reviews and ensures feedback reflects real customer experiences.",
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "Can I edit or delete my review?",
    body:
      "You may be able to edit your review within a limited time after publishing. Reviews can only be removed if they violate Tellacity's content guidelines or moderation rules.",
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "When are reviews removed?",
    body:
      "Reviews are removed only if they breach our policies — such as containing abuse, false information, spam, or conflicts of interest. Negative reviews are not removed simply because a business disagrees with them.",
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "How does the verification process work?",
    body:
      "Tellacity uses verification checks to ensure reviews are linked to real people and genuine experiences. This may include identity checks, email confirmation, or experience validation depending on the situation.",
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "How does moderation work?",
    body:
      "Moderation focuses on content quality and fairness, not opinions. Tellacity does not remove reviews for being critical. Moderation only applies when content breaks our rules.",
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "What happens during a dispute?",
    body:
      "If a review is disputed, Tellacity reviews the content against its guidelines. Both the reviewer and the business may be asked for clarification. Decisions are based on evidence and policy, not payment or influence.",
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "Can businesses pay to remove reviews?",
    body:
      "No. Businesses cannot pay to remove, hide, or alter reviews. Trust on Tellacity is built through transparency and response — not suppression.",
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "How do I claim my business?",
    body:
      "Businesses can claim their profile by verifying ownership or association with the business. Once claimed, businesses can respond to reviews, update information, and access business tools.",
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "How should I respond to reviews?",
    body:
      "Businesses are encouraged to respond professionally and constructively — especially to negative feedback. Public responses show accountability and help build trust with future customers.",
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "Does Tellacity help with SEO?",
    body:
      "Public business profiles and reviews can improve visibility and credibility online. While Tellacity does not guarantee rankings, transparent feedback can positively support discoverability.",
  },
  {
    section: "Plans & Billing",
    sectionDesc: "Pricing, subscriptions, and payments.",
    title: "Is Tellacity free?",
    body:
      "Yes. Tellacity offers free access for consumers and basic business profiles. Optional paid plans may include additional tools or features for businesses.",
  },
  {
    section: "Plans & Billing",
    sectionDesc: "Pricing, subscriptions, and payments.",
    title: "Does paying affect my ratings?",
    body:
      "No. Ratings, review visibility, and trust indicators are never influenced by payment or subscription level.",
  },
  {
    section: "Platform & Global Reach",
    sectionDesc: "Availability and localization.",
    title: "Is Tellacity available in my country?",
    body:
      "Tellacity is available in multiple regions and continues to expand. Availability may vary depending on local regulations and rollout phases.",
  },
  {
    section: "Platform & Global Reach",
    sectionDesc: "Availability and localization.",
    title: "What languages are supported?",
    body:
      "Tellacity supports multiple languages, with additional languages added over time to improve accessibility.",
  },
];

function filterEntries(entries: HelpEntry[], query: string): HelpEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q)
  );
}

export default function HelpCenterContent() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterEntries(HELP_ENTRIES, query),
    [query]
  );

  const bySection = useMemo(() => {
    const map = new Map<string, HelpEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.section) ?? [];
      list.push(e);
      map.set(e.section, list);
    }
    return map;
  }, [filtered]);

  const sectionOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const e of HELP_ENTRIES) {
      if (!seen.has(e.section)) {
        seen.add(e.section);
        order.push(e.section);
      }
    }
    return order;
  }, []);

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Help Center – Tellacity
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
            Welcome to the Tellacity Help Center. Here you&apos;ll find clear
            answers about how reviews work, how trust is maintained, and how
            both consumers and businesses can use Tellacity fairly and
            effectively.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            Use the search below or browse by topic to find what you need.
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
                        <p className="mt-2 text-sm text-gray-600">
                          {entry.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
