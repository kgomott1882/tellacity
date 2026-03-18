import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "../../../data/blogPosts";
import { comparisonLinks } from "@/lib/comparisonLinks";

const SITE_URL = "https://tellacity.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog post not found | Tellacity",
    };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | Tellacity Blog`,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${post.title} | Tellacity Blog`,
      description: post.description,
      url,
      type: "article",
    },
  };
}

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const headings = [
    { id: "why-reviews-matter", label: "Why reviews matter more than ever" },
    { id: "signal-vs-noise", label: "Separating signal from noise" },
    { id: "compare-manual-vs-platform", label: "Manual vs. platform" },
    { id: "operational-playbook", label: "Operational playbook" },
    { id: "principles", label: "Core response principles" },
    { id: "templates", label: "Templates by review type" },
  ];

  return (
    <main className="bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:py-16">
        <article className="max-w-3xl flex-1">
          <p className="text-sm uppercase tracking-wide text-[#2fb2a8]">
            Tellacity Blog
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-base text-gray-600">{post.description}</p>
          <p className="mt-4 text-xs text-gray-500">
            Published{" "}
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <hr className="mt-8 border-gray-200" />

          <div
            className="prose prose-gray mt-8 max-w-none prose-headings:text-[#0E0E0E] prose-a:text-[#0B3B36]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <section className="mt-12 rounded-2xl border border-gray-200 bg-[#0B3B36] px-6 py-8 text-white">
            <h2 className="text-xl font-semibold">
              Turn customer feedback into business intelligence
            </h2>
            <p className="mt-3 text-sm text-gray-100">
              Collect verified reviews, track trust signals, and turn every
              customer interaction into a measurable insight.
            </p>
            <Link
              href="/business/signup"
              className="mt-5 inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#0B3B36]"
            >
              Start collecting reviews
            </Link>
          </section>
        </article>

        <aside className="w-full shrink-0 lg:w-72">
          <div className="lg:sticky lg:top-28">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Table of contents
              </h2>
              <nav className="mt-3 space-y-2 text-sm text-gray-600">
                {headings.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block hover:text-[#0B3B36]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">
                Start collecting reviews
              </h3>
              <p className="mt-2 text-xs text-gray-600">
                Build trust, respond faster, and understand what customers need
                in real time.
              </p>
              <Link
                href="/business/signup"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#0B3B36] px-4 py-2 text-xs font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

