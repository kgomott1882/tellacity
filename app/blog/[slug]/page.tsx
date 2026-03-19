import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "../../../data/blogPosts";

const SITE_URL = "https://tellacity.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
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

/** Single optional internal link (max one per post) */
const InternalLinkBlock = () => (
  <div className="mt-10 pt-8 border-t border-neutral-800">
    <Link href="/compare" className="text-sm text-[#1FAF9E] hover:underline">
      Compare review platforms →
    </Link>
  </div>
);

/** Standard CTA - calm, one per post */
const BlogCTA = () => (
  <section className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/30 px-6 py-8 text-center">
    <p className="text-neutral-300 text-sm mb-4">
      Start managing your customer reviews more effectively.
    </p>
    <Link
      href="/business/signup"
      className="inline-block bg-[#1FAF9E] text-black px-5 py-2 rounded-md text-sm font-medium hover:opacity-90"
    >
      Get started
    </Link>
  </section>
);

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white px-6 py-16">
      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="text-xs text-neutral-400 mb-6">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          {" / "}
          <Link href="/blog" className="hover:text-white">
            Blog
          </Link>
          {" / "}
          <span className="text-white">{post.title}</span>
        </div>

        {/* 1. Title (H1) */}
        <h1 className="text-2xl font-semibold text-white md:text-3xl tracking-tight">
          {post.title}
        </h1>

        {/* 2. Subtitle / description */}
        <p className="mt-4 text-base text-neutral-400 leading-relaxed">
          {post.description}
        </p>

        {/* 3. Published date */}
        <p className="mt-3 text-xs text-neutral-500">
          Published{" "}
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* 4. Thumbnail (top image before content) */}
        {post.thumbnail && (
          <div className="mt-6 overflow-hidden rounded-2xl bg-neutral-800/50">
            <Image
              src={post.thumbnail}
              alt=""
              width={960}
              height={540}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        {/* 5. Main content */}
        <div
          className="blog-content mt-10 prose prose-invert prose-neutral max-w-none
            [&_p]:text-neutral-300 [&_p]:mb-4 [&_p]:leading-relaxed
            [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-6
            [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3
            [&_ul]:text-neutral-300 [&_ul]:space-y-2 [&_ul]:my-4 [&_li]:my-1
            [&_ol]:text-neutral-300 [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:list-inside
            [&_table]:text-neutral-300 [&_th]:text-neutral-400 [&_td]:text-neutral-300 [&_td]:py-2
            [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:bg-neutral-900/60 [&_pre]:border [&_pre]:border-neutral-700 [&_pre]:text-neutral-300 [&_pre]:whitespace-pre-wrap
            [&_blockquote]:border-neutral-600 [&_blockquote]:text-neutral-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 6. Optional internal link (max one) */}
        <InternalLinkBlock />

        {/* 7. CTA (standardized) */}
        <BlogCTA />
      </article>
    </div>
  );
}
