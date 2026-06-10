import Image from "next/image";
import Link from "next/link";
import ArticleShareSection from "@/components/articles/ArticleShareSection";
import ArticleTellacityAttribution from "@/components/articles/ArticleTellacityAttribution";
import type { TellacityArticle } from "@/lib/articles/tellacityArticles";
import { tellacityArticleHasHtmlBody } from "@/lib/articles/tellacityArticles";

const SITE_URL = "https://tellacity.com";

type Props = {
  post: TellacityArticle;
};

const InternalLinkBlock = () => (
  <div className="mt-10 border-t border-gray-200 pt-8">
    <Link href="/compare" className="text-sm font-medium text-[#1FAF9E] hover:underline">
      Compare review platforms →
    </Link>
  </div>
);

const ArticleCTA = () => (
  <section className="mt-12 rounded-2xl border border-gray-100 bg-white px-6 py-8 text-center shadow-sm">
    <p className="mb-4 text-sm text-[#505050]">
      Start managing your customer reviews more effectively.
    </p>
    <Link
      href="/business/signup"
      className="inline-block rounded-lg bg-[#1FAF9E] px-5 py-2 text-sm font-medium text-black hover:opacity-90"
    >
      Get started
    </Link>
  </section>
);

export default function TellacityArticleDetail({ post }: Props) {
  const canonicalUrl = `${SITE_URL}/articles/${encodeURIComponent(post.slug)}`;
  const hasHtmlBody = tellacityArticleHasHtmlBody(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    image: post.thumbnail ? [post.thumbnail] : undefined,
    author: {
      "@type": "Organization",
      name: "Tellacity",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Tellacity",
      url: SITE_URL,
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#F5F3EF]">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <nav className="mb-6 text-xs text-[#707070]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#0E0E0E]">
              Home
            </Link>
            {" / "}
            <Link href="/articles" className="hover:text-[#0E0E0E]">
              Articles
            </Link>
            {" / "}
            <span className="text-[#0E0E0E]">{post.title}</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-wide text-[#1FAF9E]">
            Tellacity Article
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-[#505050]">{post.description}</p>
          <p className="mt-3 text-sm text-[#707070]">
            Published{" "}
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {post.thumbnail ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <Image
                src={post.thumbnail}
                alt=""
                width={960}
                height={540}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          ) : null}

          {hasHtmlBody ? (
            <div
              className="article-html-content mt-10 text-[#404040]
                [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1FAF9E]/30 [&_blockquote]:pl-4 [&_blockquote]:text-[#505050]
                [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#0E0E0E]
                [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#0E0E0E]
                [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-inside [&_ol]:list-decimal [&_ol]:space-y-2
                [&_p]:mb-4 [&_p]:leading-relaxed
                [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-gray-200 [&_pre]:bg-white [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-[#404040]
                [&_table]:text-sm [&_td]:py-2 [&_th]:font-semibold [&_th]:text-[#505050]
                [&_ul]:my-4 [&_ul]:space-y-2 [&_a]:font-medium [&_a]:text-[#1FAF9E] [&_a]:hover:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : null}

          <InternalLinkBlock />
          <ArticleCTA />
          <ArticleTellacityAttribution publishedAt={post.date} />
          <ArticleShareSection title={post.title} url={canonicalUrl} />
        </article>
      </main>
    </>
  );
}
