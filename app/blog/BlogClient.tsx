"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart2,
  BookOpen,
  Briefcase,
  ChevronDown,
  FileText,
  HelpCircle,
  Info,
  ScrollText,
  Settings,
  Shield,
  Star,
  Tag,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import type { BlogPost } from "../../data/blogPosts";
import {
  BLOG_BANNER_IMAGES,
  BLOG_HERO_UNSPLASH,
  COMPARE_CARD_SLUGS,
  FEATURED_HERO_SLUG,
  FEATURED_SMALL_SLUGS,
  FILTER_CATEGORIES,
  LEARN_MORE_LINKS,
  POST_META,
  REVIEWS_CARD_SLUGS,
  START_HERE_ITEMS,
  TRUST_CARD_SLUGS,
  type BlogFilterCategory,
  cardHoverClass,
  formatBlogDate,
  postMatchesFilter,
  sectionHasMatches,
  topicPillClass,
} from "./blogData";

const IO = 0.12;

export default function BlogClient({ posts }: { posts: BlogPost[] }) {
  const [filter, setFilter] = useState<BlogFilterCategory>("All");
  const bySlug = useMemo(() => {
    const m = new Map<string, BlogPost>();
    for (const p of posts) m.set(p.slug.trim().toLowerCase(), p);
    return m;
  }, [posts]);
  const get = (slug: string) => bySlug.get(slug.trim().toLowerCase());

  return (
    <main className="blog-cinematic">
      <HomeScrollProgress />

      {/* Hero */}
      <section className="blog-hero" aria-labelledby="blog-hero-title">
        <div
          className="blog-hero-bg"
          style={{ backgroundImage: `url(${BLOG_HERO_UNSPLASH})` }}
          aria-hidden
        />
        <div className="blog-hero-overlay" aria-hidden />
        <div className="blog-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="blog-hero-inner">
          <span className="blog-hero-badge">INSIGHTS · GUIDES · UPDATES</span>
          <h1 id="blog-hero-title">
            <span className="blog-hero-title-line">Tellacity</span>
            <span className="blog-hero-title-accent">Blog</span>
          </h1>
          <p className="blog-hero-sub">
            Practical guides, platform updates, and trust insights to help you grow your
            business.
          </p>
          <div className="blog-hero-filters" role="group" aria-label="Filter by topic">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`blog-filter-pill${filter === cat ? " is-active" : ""}`}
                aria-pressed={filter === cat}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="blog-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* Start here strip */}
      <section className="blog-start-here" aria-label="Start here">
        <div className="blog-start-here-inner">
          {START_HERE_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="blog-start-here-item">
              <StartHereIcon type={item.icon} />
              <div className="blog-start-here-copy">
                <p className="blog-start-here-title">{item.title}</p>
                <p className="blog-start-here-cta">{item.cta}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {sectionHasMatches("featured", filter) && (
        <section id="featured" className="blog-section blog-section--beige">
          <div className="blog-section-inner">
            <FadeUp threshold={IO}>
              <SectionHeading
                accent="Featured"
                rest="Articles"
                sub="Starting points for practical value."
              />
            </FadeUp>
            {get(FEATURED_HERO_SLUG) && (
              <FeaturedHero
                post={get(FEATURED_HERO_SLUG)!}
                hidden={!postMatchesFilter(FEATURED_HERO_SLUG, filter)}
              />
            )}
            <div className="blog-featured-row">
              {FEATURED_SMALL_SLUGS.map((slug, i) => {
                const post = get(slug);
                if (!post) return null;
                return (
                  <ArticleCard
                    key={slug}
                    post={post}
                    section="featured"
                    index={i}
                    hidden={!postMatchesFilter(slug, filter)}
                    imgHeight="featured-sm"
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {sectionHasMatches("reviews-reputation", filter) && (
        <section id="reviews-reputation" className="blog-section blog-section--white">
          <div className="blog-section-inner">
            <FadeUp threshold={IO}>
              <SectionHeading
                label="For Businesses"
                labelVariant="forest"
                accent="Reviews &"
                rest="Reputation"
                sub="Build a reputation program, not just collect stars."
              />
            </FadeUp>
            <FeatureBanner
              src={BLOG_BANNER_IMAGES.reviews}
              quote="Turn feedback into growth."
              quoteSize="lg"
            />
            <div className="blog-asymmetric">
              {REVIEWS_CARD_SLUGS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`blog-asymmetric-row blog-asymmetric-row--${row.length}`}
                >
                  {row.map((slug, i) => {
                    const post = get(slug);
                    if (!post) return null;
                    return (
                      <ArticleCard
                        key={slug}
                        post={post}
                        section="reviews"
                        index={rowIdx * 3 + i}
                        hidden={!postMatchesFilter(slug, filter)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      {sectionHasMatches("trust-safety", filter) && (
        <section id="trust-safety" className="blog-section blog-section--beige">
          <div className="blog-section-inner">
            <FadeUp threshold={IO}>
              <SectionHeading
                label="For Consumers"
                labelVariant="amber"
                accent="Trust &"
                rest="Consumer Safety"
                sub="Safer decisions for shoppers and reviewers."
              />
            </FadeUp>
            <FeatureBanner
              src={BLOG_BANNER_IMAGES.trust}
              quote="Safer decisions start with better information."
            />
            <div className="blog-grid-3">
              {TRUST_CARD_SLUGS.map((slug, i) => {
                const post = get(slug);
                if (!post) return null;
                return (
                  <ArticleCard
                    key={slug}
                    post={post}
                    section="trust"
                    index={i}
                    hidden={!postMatchesFilter(slug, filter)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Platform */}
      {sectionHasMatches("platform-updates", filter) && (
        <section id="platform-updates" className="blog-section blog-section--dark">
          <div
            className="blog-section-dark-bg"
            style={{ backgroundImage: `url(${BLOG_BANNER_IMAGES.platform})` }}
            aria-hidden
          />
          <div className="blog-section-inner blog-section-inner--relative">
            <FadeUp threshold={IO}>
              <SectionHeading
                label="Product"
                labelVariant="light"
                accent="Platform"
                rest="Updates"
                sub="What changed on the platform."
                light
              />
            </FadeUp>
            {get("platform-update-2025") && (
              <PlatformHeroCard
                post={get("platform-update-2025")!}
                hidden={!postMatchesFilter("platform-update-2025", filter)}
              />
            )}
          </div>
        </section>
      )}

      {/* Compare */}
      {sectionHasMatches("compare-platforms", filter) && (
        <section id="compare-platforms" className="blog-section blog-section--white">
          <div className="blog-section-inner">
            <FadeUp threshold={IO}>
              <SectionHeading
                label="Comparisons"
                labelVariant="forest"
                accent="Compare"
                rest="Platforms"
                sub="Choose the right review platform."
              />
            </FadeUp>
            <FeatureBanner
              src={BLOG_BANNER_IMAGES.compare}
              quote="Choose the right platform for your business."
              overlay="forest"
            />
            <div className="blog-grid-3">
              {COMPARE_CARD_SLUGS.map((slug, i) => {
                const post = get(slug);
                if (!post) return null;
                return (
                  <ArticleCard
                    key={slug}
                    post={post}
                    section="compare"
                    index={i}
                    hidden={!postMatchesFilter(slug, filter)}
                    imgHeight="compare"
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Resources */}
      <FadeUp threshold={IO} className="blog-section blog-section--beige">
        <div className="blog-section-inner">
          <SectionHeading accent="Go Deeper" rest="with Tellacity" />
          <div className="blog-resources-grid">
            {LEARN_MORE_LINKS.map((item, i) => (
              <StaggerFadeUp key={item.href} index={i} staggerMs={50} threshold={IO}>
                <Link href={item.href} className="blog-resource-card">
                  <span className={`blog-resource-icon blog-resource-icon--${item.variant}`}>
                    <ResourceIcon type={item.icon} />
                  </span>
                  <span className="blog-resource-title">{item.label}</span>
                  <span className="blog-resource-link">Explore →</span>
                </Link>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Final CTA */}
      <section className="blog-final-cta" aria-labelledby="blog-final-cta-title">
        <div className="blog-section-inner blog-final-cta-inner">
          <FadeUp threshold={IO}>
            <span className="blog-final-badge">TELLACITY BLOG</span>
            <h2 id="blog-final-cta-title" className="blog-final-title">
              <span>Stay Informed on</span>
              <span className="blog-final-title-accent">Trust &amp; Reviews</span>
            </h2>
            <p className="blog-final-sub">
              Practical guides, platform updates, and trust insights — no account required.
            </p>
            <div className="blog-final-btns">
              <a href="#featured" className="blog-btn-primary">
                Browse All Articles
              </a>
              <Link href="/for-business" className="blog-btn-outline">
                Tellacity for Business →
              </Link>
            </div>
            <p className="blog-final-trust">
              ✓ Free to read &nbsp; ✓ No account needed &nbsp; ✓ New guides every month
            </p>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  label,
  labelVariant = "forest",
  accent,
  rest,
  sub,
  light,
}: {
  label?: string;
  labelVariant?: "forest" | "amber" | "light";
  accent: string;
  rest?: string;
  sub?: string;
  light?: boolean;
}) {
  return (
    <header className={`blog-section-head${light ? " blog-section-head--light" : ""}`}>
      {label ? (
        <span className={`blog-section-label blog-section-label--${labelVariant}`}>
          {label}
        </span>
      ) : null}
      <h2 className="blog-section-title">
        <span className="blog-section-accent">{accent}</span>
        {rest ? ` ${rest}` : null}
      </h2>
      {sub ? <p className="blog-section-sub">{sub}</p> : null}
    </header>
  );
}

function FeatureBanner({
  src,
  quote,
  quoteSize,
  overlay = "teal",
}: {
  src: string;
  quote: string;
  quoteSize?: "lg";
  overlay?: "teal" | "forest";
}) {
  return (
    <FadeUp threshold={IO} className="blog-feature-banner-wrap">
      <div className="blog-feature-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="blog-feature-banner-img" loading="lazy" decoding="async" />
        <div className={`blog-feature-banner-overlay blog-feature-banner-overlay--${overlay}`} aria-hidden />
        <p className={`blog-feature-banner-quote${quoteSize === "lg" ? " blog-feature-banner-quote--lg" : ""}`}>
          {quote}
        </p>
      </div>
    </FadeUp>
  );
}

function CardWrap({
  post,
  className,
  hidden,
  children,
}: {
  post: BlogPost;
  className: string;
  hidden?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/blog/${post.slug.trim().toLowerCase()}`}
      className={`${className}${hidden ? " is-filtered-out" : ""}`}
    >
      {children}
    </Link>
  );
}

function PostThumb({
  post,
  className,
  priority,
}: {
  post: BlogPost;
  className: string;
  priority?: boolean;
}) {
  if (!post.thumbnail) {
    return <div className={`${className} blog-thumb-fallback`} aria-hidden />;
  }
  return (
    <Image
      src={post.thumbnail}
      alt=""
      width={800}
      height={480}
      className={className}
      loading={priority ? undefined : "lazy"}
      priority={priority}
    />
  );
}

function ArticleCard({
  post,
  section,
  index,
  hidden,
  imgHeight = "default",
}: {
  post: BlogPost;
  section: "featured" | "reviews" | "trust" | "compare";
  index: number;
  hidden?: boolean;
  imgHeight?: "default" | "featured-sm" | "compare";
}) {
  const meta = POST_META[post.slug.trim().toLowerCase()];
  const mediaClass =
    imgHeight === "featured-sm"
      ? "blog-card-media blog-card-media--190"
      : imgHeight === "compare"
        ? "blog-card-media blog-card-media--200"
        : "blog-card-media blog-card-media--170";

  return (
    <StaggerFadeUp
      index={index}
      staggerMs={70}
      threshold={IO}
      className={hidden ? "is-filtered-out-wrap" : undefined}
    >
      <CardWrap
        post={post}
        className={`blog-card blog-card--standard ${cardHoverClass(section)}`}
        hidden={hidden}
      >
        <div className={mediaClass}>
          <PostThumb post={post} className="blog-card-img" />
          {meta ? (
            <span className={`${topicPillClass(meta.topic)} blog-pill--on-image`}>
              {meta.topic}
            </span>
          ) : null}
        </div>
        <div className="blog-card-body">
          <time className="blog-card-date" dateTime={post.date}>
            {formatBlogDate(post.date)}
          </time>
          <h3 className="blog-card-title">{post.title}</h3>
          {meta ? (
            <>
              <p className="blog-why-label">Why read this:</p>
              <p className="blog-why-desc">{meta.whyRead}</p>
            </>
          ) : null}
          <span className="blog-card-link">Read article →</span>
        </div>
      </CardWrap>
    </StaggerFadeUp>
  );
}

function FeaturedHero({ post, hidden }: { post: BlogPost; hidden?: boolean }) {
  const meta = POST_META[post.slug.trim().toLowerCase()];
  return (
    <FadeUp threshold={IO}>
      <CardWrap
        post={post}
        className={`blog-card blog-featured-hero ${cardHoverClass("featured")}`}
        hidden={hidden}
      >
        <div className="blog-featured-hero-media">
          <PostThumb post={post} className="blog-featured-hero-img" priority />
        </div>
        <div className="blog-featured-hero-body">
          {meta ? <span className={topicPillClass(meta.topic)}>{meta.topic}</span> : null}
          <time className="blog-card-date" dateTime={post.date}>
            {formatBlogDate(post.date)}
          </time>
          <h3 className="blog-featured-hero-title">{post.title}</h3>
          {meta ? (
            <>
              <p className="blog-why-label">Why read this:</p>
              <p className="blog-why-desc blog-why-desc--teal">{meta.whyRead}</p>
            </>
          ) : null}
          <p className="blog-featured-hero-desc">{post.description}</p>
          <span className="blog-btn-primary">Read article →</span>
        </div>
      </CardWrap>
    </FadeUp>
  );
}

function PlatformHeroCard({ post, hidden }: { post: BlogPost; hidden?: boolean }) {
  const meta = POST_META[post.slug.trim().toLowerCase()];
  return (
    <FadeUp threshold={IO}>
      <CardWrap
        post={post}
        className={`blog-card blog-platform-hero ${cardHoverClass("platform")}`}
        hidden={hidden}
      >
        <div className="blog-platform-hero-media">
          <PostThumb post={post} className="blog-platform-hero-img" />
          <div className="blog-platform-hero-scrim" aria-hidden />
        </div>
        <div className="blog-platform-hero-body">
          {meta ? <span className={topicPillClass(meta.topic)}>{meta.topic}</span> : null}
          <time className="blog-card-date" dateTime={post.date}>
            {formatBlogDate(post.date)}
          </time>
          <h3 className="blog-platform-hero-title">{post.title}</h3>
          {meta ? (
            <>
              <p className="blog-why-label">Why read this:</p>
              <p className="blog-why-desc blog-why-desc--teal">{meta.whyRead}</p>
            </>
          ) : null}
          <p className="blog-featured-hero-desc">{post.description}</p>
          <span className="blog-btn-forest">Read article →</span>
        </div>
      </CardWrap>
    </FadeUp>
  );
}

function StartHereIcon({ type }: { type: (typeof START_HERE_ITEMS)[number]["icon"] }) {
  const cls = "h-[22px] w-[22px] shrink-0 text-white";
  if (type === "star") return <Star className={cls} aria-hidden />;
  if (type === "barChart") return <BarChart2 className={cls} aria-hidden />;
  if (type === "shield") return <Shield className={cls} aria-hidden />;
  return <Settings className={cls} aria-hidden />;
}

function ResourceIcon({ type }: { type: (typeof LEARN_MORE_LINKS)[number]["icon"] }) {
  const cls = "h-5 w-5 text-white";
  const map = {
    bookOpen: BookOpen,
    fileText: FileText,
    barChart2: BarChart2,
    briefcase: Briefcase,
    tag: Tag,
    helpCircle: HelpCircle,
    shield: Shield,
    scrollText: ScrollText,
    info: Info,
  } as const;
  const Icon = map[type] ?? FileText;
  return <Icon className={cls} aria-hidden />;
}
