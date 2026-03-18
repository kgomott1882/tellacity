import Link from "next/link";
import Image from "next/image";
import { getAllBlogPosts } from "../../data/blogPosts";

export default async function BlogPage() {
  const posts = getAllBlogPosts();
  return (
    <main className="bg-white">
      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Tellacity Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Insightful updates, practical guides, and articles to help you grow
            your business.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-14">
          <div className="mt-10 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.slug}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
                  {post.thumbnail ? (
                    <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] w-full overflow-hidden">
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
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="mt-3 text-base font-semibold text-[#0E0E0E]">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {post.description}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-[#0B3B36] hover:underline"
                  >
                    Read article
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
