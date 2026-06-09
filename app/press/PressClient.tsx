"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, FileText, Globe, Mail } from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  PRESS_CONTACT_IMAGE,
  PRESS_HERO_UNSPLASH,
  categoryPillClass,
  chunkPressRows,
  formatPressDate,
  formatPressDateShort,
  getArticleHref,
  type PressItem,
} from "./pressData";

const IO = 0.12;

type PressClientProps = {
  featuredArticle: PressItem;
  paginatedGrid: PressItem[];
  currentPage: number;
  totalPages: number;
};

export default function PressClient({
  featuredArticle,
  paginatedGrid,
  currentPage,
  totalPages,
}: PressClientProps) {
  const gridRows = chunkPressRows(paginatedGrid);
  let cardIndex = 0;

  return (
    <main className="press-cinematic">
      <HomeScrollProgress />

      {/* Hero */}
      <section className="press-hero" aria-labelledby="press-hero-title">
        <div
          className="press-hero-bg"
          style={{ backgroundImage: `url(${PRESS_HERO_UNSPLASH})` }}
          aria-hidden
        />
        <div className="press-hero-overlay" aria-hidden />
        <div className="press-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="press-hero-inner">
          <p className="press-hero-crumb">Inside Tellacity</p>
          <span className="press-hero-badge">PRESS &amp; MEDIA</span>
          <h1 id="press-hero-title">
            <span className="press-hero-title-line">Global News and</span>
            <span className="press-hero-title-accent">Announcements</span>
          </h1>
          <p className="press-hero-sub">
            Media resources, platform updates, and announcements from Tellacity.
          </p>
          <div className="press-hero-ctas">
            <Link href="/contact" className="press-btn-primary">
              Email Press Team
            </Link>
            <Link href="/articles" className="press-btn-outline">
              View Articles →
            </Link>
          </div>
          <div className="press-hero-trust">
            <span>✓ Media enquiries welcome</span>
            <span>✓ Press materials available</span>
            <span>✓ Global coverage</span>
          </div>
        </div>
        <div className="press-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* Featured */}
      <section className="press-section press-section--beige">
        <div className="press-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="press-section-title">
              <span className="press-section-accent">Featured</span> Article
            </h2>
          </FadeUp>
          <FadeUp threshold={IO}>
            <Link
              href={getArticleHref(featuredArticle.title)}
              className="press-featured-card"
            >
              <div className="press-featured-media">
                <Image
                  src={featuredArticle.image}
                  alt=""
                  width={900}
                  height={500}
                  className="press-featured-img"
                  priority
                />
                <div className="press-featured-scrim" aria-hidden />
              </div>
              <div className="press-featured-body">
                <span className={categoryPillClass(featuredArticle.category)}>
                  {featuredArticle.category}
                </span>
                <time className="press-card-date" dateTime={featuredArticle.postedAt}>
                  {formatPressDate(featuredArticle.postedAt)}
                </time>
                <h3 className="press-featured-title">{featuredArticle.title}</h3>
                <span className="press-btn-primary press-btn-primary--inline">
                  Read article →
                </span>
              </div>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* Grid */}
      <section id="press-articles" className="press-section press-section--white">
        <div className="press-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="press-section-title">
              <span className="press-section-accent">All</span> Press Articles
            </h2>
            <p className="press-section-sub">
              Platform updates, guides, and announcements.
            </p>
          </FadeUp>

          <div className="press-asymmetric">
            {gridRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`press-asymmetric-row press-asymmetric-row--${row.length}`}
              >
                {row.map((item) => {
                  const idx = cardIndex++;
                  return (
                    <PressGridCard key={item.title} item={item} index={idx} />
                  );
                })}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="press-pagination" aria-label="Pagination">
              {currentPage > 1 ? (
                <Link href={`/press?page=${currentPage - 1}`} className="press-page-btn">
                  ‹ Previous page
                </Link>
              ) : (
                <span className="press-page-btn press-page-btn--disabled">
                  ‹ Previous page
                </span>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/press?page=${n}`}
                  className={`press-page-num${n === currentPage ? " is-active" : ""}`}
                  aria-current={n === currentPage ? "page" : undefined}
                >
                  {n}
                </Link>
              ))}
              {currentPage < totalPages ? (
                <Link href={`/press?page=${currentPage + 1}`} className="press-page-btn">
                  Next page ›
                </Link>
              ) : (
                <span className="press-page-btn press-page-btn--disabled">
                  Next page ›
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="press-section press-section--beige">
        <div className="press-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="press-section-title">
              Get in Touch with{" "}
              <span className="press-section-accent">Our Press Team</span>
            </h2>
          </FadeUp>
          <div className="press-contact-split">
            <FadeUp threshold={IO} className="press-contact-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PRESS_CONTACT_IMAGE}
                alt=""
                className="press-contact-img"
                loading="lazy"
                decoding="async"
              />
            </FadeUp>
            <FadeUp threshold={IO} className="press-contact-copy">
              <p className="press-contact-lead">
                For media enquiries, or to learn more about Tellacity&apos;s global impact,
                contact our dedicated Press team.
              </p>
              <div className="press-contact-rows">
                <div className="press-contact-row">
                  <span className="press-contact-icon press-contact-icon--teal">
                    <Mail className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="press-contact-label">Media Enquiries</p>
                    <p className="press-contact-desc">For press and media requests</p>
                  </div>
                </div>
                <div className="press-contact-row">
                  <span className="press-contact-icon press-contact-icon--forest">
                    <Globe className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="press-contact-label">Global Coverage</p>
                    <p className="press-contact-desc">International press and announcements</p>
                  </div>
                </div>
                <div className="press-contact-row">
                  <span className="press-contact-icon press-contact-icon--teal">
                    <FileText className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="press-contact-label">Press Materials</p>
                    <p className="press-contact-desc">Logos, assets, and brand resources</p>
                  </div>
                </div>
              </div>
              <Link href="/contact" className="press-contact-cta">
                Email Press Team →
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="press-final-cta" aria-labelledby="press-final-title">
        <div className="press-section-inner press-final-inner">
          <FadeUp threshold={IO}>
            <span className="press-final-badge">INSIDE TELLACITY</span>
            <h2 id="press-final-title" className="press-final-title">
              <span>Stay Up to Date</span>
              <span className="press-final-accent">with Tellacity</span>
            </h2>
            <p className="press-final-sub">
              Read the latest platform updates, guides, and global announcements from
              Tellacity.
            </p>
            <div className="press-final-btns">
              <a href="#press-articles" className="press-btn-primary">
                View All Articles →
              </a>
              <Link href="/contact" className="press-btn-outline">
                Email Press Team
              </Link>
            </div>
            <p className="press-final-trust">
              ✓ Free to read &nbsp; ✓ No account needed &nbsp; ✓ Updated regularly
            </p>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}

function PressGridCard({ item, index }: { item: PressItem; index: number }) {
  return (
    <StaggerFadeUp index={index} staggerMs={60} threshold={IO}>
      <Link href={getArticleHref(item.title)} className="press-grid-card">
        <div className="press-grid-media">
          <Image
            src={item.image}
            alt=""
            width={600}
            height={360}
            className="press-grid-img"
            loading="lazy"
          />
          <span className={`${categoryPillClass(item.category)} press-pill--on-image`}>
            {item.category}
          </span>
        </div>
        <div className="press-grid-body">
          <time className="press-card-date press-card-date--caps" dateTime={item.postedAt}>
            {formatPressDateShort(item.postedAt)}
          </time>
          <h3 className="press-grid-title">{item.title}</h3>
          <span className="press-read-link">Read article →</span>
        </div>
      </Link>
    </StaggerFadeUp>
  );
}
