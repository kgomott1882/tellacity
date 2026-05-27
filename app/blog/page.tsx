import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getAllBlogPosts,
  type BlogPost,
} from "../../data/blogPosts";

const PAGE_URL = "https://tellacity.com/blog";

export const metadata: Metadata = {
  title: "Tellacity Blog | Reviews, Trust & Business Growth",
  description:
    "Read Tellacity's blog for practical guides on reviews, trust, consumer safety, platform comparisons, and business growth.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Tellacity Blog | Reviews, Trust & Business Growth",
    description:
      "Read Tellacity's blog for practical guides on reviews, trust, consumer safety, platform comparisons, and business growth.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tellacity Blog | Reviews, Trust & Business Growth",
    description:
      "Read Tellacity's blog for practical guides on reviews, trust, consumer safety, platform comparisons, and business growth.",
  },
  robots: { index: true, follow: true },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Tellacity Blog",
  description:
    "Read Tellacity's blog for practical guides on reviews, trust, consumer safety, platform comparisons, and business growth.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const TOPIC_CHIPS = [
  "Reviews",
  "Trust",
  "Consumer Safety",
  "Platform Updates",
  "Comparisons",
  "Business Growth",
] as const;

type PostMeta = {
  topic: (typeof TOPIC_CHIPS)[number];
  whyRead: string;
};

const POST_META: Record<string, PostMeta> = {
  "how-to-get-more-customer-reviews": {
    topic: "Reviews",
    whyRead: "Proven ways to collect more customer feedback.",
  },
  "why-customers-dont-leave-reviews-how-to-fix": {
    topic: "Reviews",
    whyRead: "Fix the blockers that stop customers from reviewing.",
  },
  "turn-reviews-into-growth-2026": {
    topic: "Business Growth",
    whyRead: "Turn feedback into product and revenue insights.",
  },
  "review-response-playbook-2026": {
    topic: "Reviews",
    whyRead: "Respond publicly with a repeatable playbook.",
  },
  "import-reviews": {
    topic: "Platform Updates",
    whyRead: "Bring existing reviews into Tellacity step by step.",
  },
  "claim-tellacity-profile": {
    topic: "Business Growth",
    whyRead: "Why claiming your profile matters for trust.",
  },
  "trust-score-2025": {
    topic: "Trust",
    whyRead: "Understand how Tellacity calculates trust.",
  },
  "check-business-legit-2026": {
    topic: "Consumer Safety",
    whyRead: "Check a business before you spend money.",
  },
  "check-business-legit-2025": {
    topic: "Consumer Safety",
    whyRead: "Spot red flags before you buy online.",
  },
  "what-makes-a-review-useful-2025": {
    topic: "Trust",
    whyRead: "Learn what separates useful reviews from noise.",
  },
  "verified-review-2025": {
    topic: "Trust",
    whyRead: "See what verified reviews mean in practice.",
  },
  "online-shopping-scams-2025": {
    topic: "Consumer Safety",
    whyRead: "Avoid the most common shopping scams.",
  },
  "shopping-online-safely-2025": {
    topic: "Consumer Safety",
    whyRead: "Shop online with a practical safety checklist.",
  },
  "platform-update-2025": {
    topic: "Platform Updates",
    whyRead: "See what changed in Tellacity for 2025.",
  },
  "best-trustpilot-alternatives-2026": {
    topic: "Comparisons",
    whyRead: "Compare Trustpilot alternatives side by side.",
  },
  "google-reviews-vs-trustpilot-2026": {
    topic: "Comparisons",
    whyRead: "Decide between Google Reviews and Trustpilot.",
  },
  "best-review-platforms-small-business-2026": {
    topic: "Comparisons",
    whyRead: "Find review platforms that fit small teams.",
  },
};

const SECTIONS: {
  id: string;
  title: string;
  intro: string[];
  slugs: string[];
}[] = [
  {
    id: "featured",
    title: "Featured articles",
    intro: [
      "This section highlights some of the most useful guides on the blog—starting points if you want quick, practical value.",
      "These posts cover review collection, platform comparisons, consumer safety, and Tellacity profile ownership.",
    ],
    slugs: [
      "how-to-get-more-customer-reviews",
      "best-trustpilot-alternatives-2026",
      "google-reviews-vs-trustpilot-2026",
      "check-business-legit-2026",
      "claim-tellacity-profile",
    ],
  },
  {
    id: "reviews-reputation",
    title: "Reviews & reputation",
    intro: [
      "These posts help businesses collect more reviews, respond better, and turn feedback into growth.",
      "Topics include automation, review response, imports, trust scores, and owning your Tellacity profile.",
      "If you are building a reputation program—not just collecting stars—start here.",
    ],
    slugs: [
      "how-to-get-more-customer-reviews",
      "why-customers-dont-leave-reviews-how-to-fix",
      "turn-reviews-into-growth-2026",
      "review-response-playbook-2026",
      "import-reviews",
      "claim-tellacity-profile",
      "trust-score-2025",
    ],
  },
  {
    id: "trust-safety",
    title: "Trust & consumer safety",
    intro: [
      "These articles help consumers and businesses make safer decisions online.",
      "They cover legitimacy checks, scam avoidance, verified reviews, and what makes feedback useful.",
      "Useful for shoppers, reviewers, and teams that want trust content they can share with customers.",
    ],
    slugs: [
      "check-business-legit-2026",
      "check-business-legit-2025",
      "what-makes-a-review-useful-2025",
      "verified-review-2025",
      "online-shopping-scams-2025",
      "shopping-online-safely-2025",
    ],
  },
  {
    id: "platform-updates",
    title: "Platform updates",
    intro: [
      "Tellacity posts product updates, new features, and improvements for existing users here.",
      "This section is for current customers and people evaluating whether Tellacity fits their workflow.",
      "Check here when you want to see what changed on the platform—not generic review advice.",
    ],
    slugs: ["platform-update-2025"],
  },
  {
    id: "compare-platforms",
    title: "Compare platforms",
    intro: [
      "These comparison articles help businesses choose the right review platform.",
      "They look at pricing, control, automation, visibility, and fit—not just brand names.",
      "Read them when you are weighing Tellacity against Trustpilot, Google Reviews, or other options.",
    ],
    slugs: [
      "best-trustpilot-alternatives-2026",
      "google-reviews-vs-trustpilot-2026",
      "best-review-platforms-small-business-2026",
    ],
  },
];

const LEARN_MORE_LINKS = [
  { href: "/resources", label: "Resources" },
  { href: "/guides", label: "Guides" },
  { href: "/reputation-platform", label: "Reputation Management Platform" },
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help-center", label: "Help Center" },
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/business-guidelines", label: "Business Guidelines" },
  { href: "/about", label: "About Tellacity" },
];

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

function postsForSlugs(posts: BlogPost[], slugs: string[]) {
  const bySlug = new Map(
    posts
      .filter((post) => isValidSlug(post.slug))
      .map((post) => [post.slug.trim().toLowerCase(), post])
  );

  return slugs
    .map((slug) => bySlug.get(slug.trim().toLowerCase()))
    .filter((post): post is BlogPost => Boolean(post))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const safeSlug = post.slug.trim().toLowerCase();
  const meta = POST_META[safeSlug];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
        {post.thumbnail ? (
          <Link
            href={`/blog/${safeSlug}`}
            className="block aspect-[16/9] w-full overflow-hidden"
          >
            <Image
              src={post.thumbnail}
              alt=""
              width={400}
              height={225}
              className="h-full w-full rounded-xl object-cover transition-transform duration-200 hover:scale-[1.02]"
            />
          </Link>
        ) : (
          <div
            className="h-full w-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200"
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          {meta ? (
            <span className="rounded-full bg-[#E5F4F2] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0F766E]">
              {meta.topic}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-base font-semibold text-[#0E0E0E]">
          <Link href={`/blog/${safeSlug}`} className="hover:text-[#0F766E]">
            {post.title}
          </Link>
        </h3>
        {meta ? (
          <p className="mt-2 text-xs font-medium text-[#0F766E]">
            Why read this: {meta.whyRead}
          </p>
        ) : null}
        <p className="mt-3 line-clamp-2 flex-1 text-sm text-gray-600">
          {post.description}
        </p>
        <Link
          href={`/blog/${safeSlug}`}
          className="mt-4 inline-flex items-center text-sm font-semibold text-[#0B3B36] hover:underline"
        >
          Read article
        </Link>
      </div>
    </article>
  );
}

export default async function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Tellacity Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
            Insightful updates, practical guides, and articles to help you grow
            your business, understand trust, and make better decisions online.
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {TOPIC_CHIPS.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-[#1FAF9E]/30 bg-white px-3 py-1 text-xs font-medium text-[#0F766E]"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">Start here</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              Not sure where to begin? Use these entry points based on what you
              need right now.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Want more reviews? Start with the{" "}
                <Link href="/blog/how-to-get-more-customer-reviews" className={linkClass}>
                  customer reviews guide
                </Link>
                .
              </li>
              <li>
                Comparing platforms? Read the{" "}
                <Link href="/blog/google-reviews-vs-trustpilot-2026" className={linkClass}>
                  Google Reviews vs Trustpilot
                </Link>{" "}
                and{" "}
                <Link href="/blog/best-trustpilot-alternatives-2026" className={linkClass}>
                  Trustpilot alternatives
                </Link>{" "}
                articles.
              </li>
              <li>
                Building trust? Explore the{" "}
                <Link href="/blog/verified-review-2025" className={linkClass}>
                  verified review
                </Link>{" "}
                and{" "}
                <Link href="/blog/trust-score-2025" className={linkClass}>
                  trust score
                </Link>{" "}
                guides.
              </li>
              <li>
                Using Tellacity already? Check the{" "}
                <Link href="/blog/platform-update-2025" className={linkClass}>
                  platform update
                </Link>{" "}
                and{" "}
                <Link href="/blog/import-reviews" className={linkClass}>
                  import guide
                </Link>
                .
              </li>
            </ul>
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => {
        const sectionPosts = postsForSlugs(posts, section.slugs);
        if (sectionPosts.length === 0) return null;

        return (
          <section
            key={section.id}
            id={section.id}
            className="border-t border-gray-100 bg-white"
          >
            <div className="mx-auto w-full max-w-5xl px-6 py-12">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                {section.title}
              </h2>
              <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-gray-600">
                {section.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                {sectionPosts.map((post) => (
                  <BlogPostCard
                    key={`${section.id}-${post.slug}`}
                    post={post}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">Learn more</h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              Go deeper into Tellacity&apos;s product, business tools, trust
              policies, and support resources from here.
            </p>
            <p>
              The blog covers specific topics in depth; these pages connect you
              to guides, pricing, policies, and the broader reputation platform.
            </p>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {LEARN_MORE_LINKS.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={linkClass}>
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-gray-600">
            Tellacity&apos;s blog works alongside our{" "}
            <Link href="/resources" className={linkClass}>
              resources
            </Link>
            ,{" "}
            <Link href="/safety-trust" className={linkClass}>
              trust policies
            </Link>
            , and{" "}
            <Link href="/reputation-platform" className={linkClass}>
              reputation platform
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
