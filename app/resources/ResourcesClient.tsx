"use client";

import Link from "next/link";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  APPLY_RESOURCES,
  GROW_RESOURCES,
  LEARN_RESOURCES,
  RESOURCE_START_PATH,
} from "./resourcesData";

const IO = 0.12;

function ResourceCardGrid({
  items,
  columns = 4,
}: {
  items: typeof LEARN_RESOURCES;
  columns?: 2 | 4;
}) {
  return (
    <div
      className={`res-cards-grid ${columns === 4 ? "res-cards-grid--4" : ""}`}
    >
      {items.map((item, index) => (
        <StaggerFadeUp key={item.href} index={index} staggerMs={60} threshold={IO}>
          <Link href={item.href} className="res-card h-full">
            <div className="res-card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
            </div>
            <div className="res-card-body">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className="res-card-link">Explore →</span>
            </div>
          </Link>
        </StaggerFadeUp>
      ))}
    </div>
  );
}

export default function ResourcesClient() {
  return (
    <main className="res-cinematic">
      <HomeScrollProgress />

      <section className="res-hero" aria-labelledby="res-hero-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Resources/Guides.jpg"
          alt=""
          className="res-hero-bg"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="res-hero-overlay" aria-hidden />
        <div className="res-hero-glow" aria-hidden />
        <HeroStarField />
        <div className="res-hero-inner">
          <span className="res-hero-badge">KNOWLEDGE · GUIDES · SUPPORT</span>
          <h1 id="res-hero-title">
            <span className="res-hero-title-line">Tellacity</span>
            <span className="res-hero-title-accent">Resources</span>
          </h1>
          <p className="res-hero-sub">
            Everything you need to learn Tellacity, set up your business, publish content,
            and grow with verified customer trust.
          </p>
          <div className="res-hero-actions">
            <Link href="/for-business" className="res-btn-primary">
              Tellacity for Business
            </Link>
            <Link href="/help-center" className="res-btn-outline">
              Help Center
            </Link>
          </div>
        </div>
      </section>

      <FadeUp threshold={IO} className="res-path">
        <div className="res-section-inner">
          <h2 className="res-section-title">
            <span className="res-section-dark">Recommended </span>
            <span className="res-section-accent">starting path</span>
          </h2>
          <p className="res-section-sub">
            New to Tellacity? Follow these three steps before diving into specific guides
            or tools.
          </p>
          <div className="res-path-grid">
            {RESOURCE_START_PATH.map((step, index) => (
              <StaggerFadeUp key={step.step} index={index} staggerMs={80} threshold={IO}>
                <article className="res-path-card h-full">
                  <span className="res-path-step">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                  <Link href={step.href} className="res-path-link">
                    {step.cta}
                  </Link>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      <FadeUp threshold={IO} className="res-featured">
        <div className="res-section-inner">
          <h2 className="res-section-title">
            <span className="res-section-dark">Featured: </span>
            <span className="res-section-accent">Tellacity for Business</span>
          </h2>
          <p className="res-section-sub">
            Review invitations, widgets, analytics, reputation management, photo uploads,
            and blogs or case studies — one platform, one dashboard.
          </p>
          <div className="res-featured-banner">
            <div className="res-featured-grid">
              <div className="res-featured-copy">
                <h3>One verified pipeline for trust</h3>
                <p>
                  Understand how modules connect before you open integrations, badges, or
                  customer stories. Start with the platform overview, then compare{" "}
                  <Link href="/pricing" className="res-inline-link" style={{ color: "#1ecfb8" }}>
                    pricing
                  </Link>{" "}
                  and the{" "}
                  <Link href="/faq" className="res-inline-link" style={{ color: "#1ecfb8" }}>
                    FAQ
                  </Link>
                  .
                </p>
                <Link
                  href="/for-business#platform-modules"
                  className="res-btn-primary mt-6 inline-flex"
                >
                  Explore platform modules
                </Link>
              </div>
              <div className="res-featured-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Real%20capabilities.jpeg"
                  alt="Tellacity platform capabilities"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp threshold={IO} className="res-section--beige">
        <div className="res-section-inner">
          <h2 className="res-section-title">
            <span className="res-section-dark">Learn </span>
            <span className="res-section-accent">&amp; understand</span>
          </h2>
          <p className="res-section-sub">
            Build clarity around reviews, trust, articles, and transparency at your own pace.
          </p>
          <ResourceCardGrid items={LEARN_RESOURCES} columns={4} />
        </div>
      </FadeUp>

      <FadeUp threshold={IO}>
        <div className="res-section-inner">
          <h2 className="res-section-title">
            <span className="res-section-dark">Apply </span>
            <span className="res-section-accent">&amp; use</span>
          </h2>
          <p className="res-section-sub">
            Documentation, integrations, guidelines, and quick answers for day-to-day use.
          </p>
          <ResourceCardGrid items={APPLY_RESOURCES} columns={4} />
        </div>
      </FadeUp>

      <FadeUp threshold={IO} className="res-section--beige">
        <div className="res-section-inner">
          <h2 className="res-section-title">
            <span className="res-section-dark">Grow </span>
            <span className="res-section-accent">&amp; partner</span>
          </h2>
          <p className="res-section-sub">
            Proof from peers, solution deep dives, trust policies, and partnership options.
          </p>
          <ResourceCardGrid items={GROW_RESOURCES} columns={4} />
        </div>
      </FadeUp>

      <FadeUp threshold={IO} className="res-final-cta">
        <div className="res-final-cta-bg" aria-hidden />
        <div className="res-section-inner res-final-cta-inner">
          <div>
            <h2>Ready to put resources into action?</h2>
            <p>
              Claim your free profile, explore{" "}
              <Link href="/how-tellacity-works" className="res-inline-link" style={{ color: "#1ecfb8" }}>
                how Tellacity works
              </Link>
              , or browse{" "}
              <Link href="/articles" className="res-inline-link" style={{ color: "#1ecfb8" }}>
                published articles
              </Link>
              .
            </p>
          </div>
          <div className="res-final-actions">
            <Link href="/business/signup" className="res-btn-primary">
              Get started free
            </Link>
            <Link href="/pricing" className="res-btn-outline">
              View pricing
            </Link>
          </div>
        </div>
      </FadeUp>
    </main>
  );
}
