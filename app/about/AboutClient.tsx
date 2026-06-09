"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  Lightbulb,
  Scale,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import { ABOUT_IMAGES } from "./aboutData";

const IO = 0.12;

const WHAT_CARDS = [
  {
    icon: Shield,
    title: "Independent platform",
    copy:
      "Neutral by design — not owned by advertisers. Credibility comes from fairness, not paid placement.",
  },
  {
    icon: BadgeCheck,
    title: "Verified experiences",
    copy:
      "Reviews tied to real customer paths and moderation so genuine voices stand out.",
  },
  {
    icon: BarChart3,
    title: "Transparent insights",
    copy:
      "Public replies, benchmarks, and trust signals give consumers context and businesses action.",
  },
] as const;

type HowStep = {
  title: string;
  copy: string;
  link?: { href: string; label: string };
};

const HOW_STEPS: HowStep[] = [
  {
    title: "Share verified experiences",
    copy:
      "Customers write about businesses they have actually used. Reviews enter verification before going live.",
  },
  {
    title: "Check authenticity",
    copy:
      "Moderation, guidelines, and verification standards keep feedback fair.",
    link: { href: "/safety-trust", label: "Safety & Trust" },
  },
  {
    title: "Respond & improve",
    copy:
      "Teams reply publicly, track sentiment, and improve from real customer language — not guesswork.",
  },
  {
    title: "Trust signals everywhere",
    copy:
      "Verified proof flows into profiles, widgets, and dashboards so reputation stays consistent.",
  },
];

const VALUES = [
  {
    icon: Shield,
    title: "Unwavering Trust",
    copy: "Credibility, fairness, and transparency in how we moderate and present every review.",
  },
  {
    icon: Users,
    title: "Community First",
    copy: "Consumers and businesses both shape how Tellacity improves over time.",
  },
  {
    icon: Scale,
    title: "Radical Integrity",
    copy: "Honesty, accountability, and zero tolerance for review manipulation.",
  },
  {
    icon: Eye,
    title: "Purposeful Transparency",
    copy: "Open replies and explainable trust signals keep the marketplace honest.",
  },
  {
    icon: Lightbulb,
    title: "Bold Innovation",
    copy: "From verification to analytics — we keep improving how trust is built.",
  },
  {
    icon: TrendingUp,
    title: "Enduring Growth",
    copy: "Reputation should compound over years, not reset with every campaign.",
  },
] as const;

export default function AboutClient() {
  return (
    <main className="about-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="about-hero" aria-labelledby="about-hero-title">
        <div
          className="about-hero-bg"
          style={{ backgroundImage: `url(${ABOUT_IMAGES.hero})` }}
          aria-hidden
        />
        <div className="about-hero-bg-overlay" aria-hidden />
        <div className="about-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="about-hero-inner">
          <span className="about-hero-badge">INDEPENDENT REVIEW PLATFORM</span>
          <h1 id="about-hero-title" className="about-hero-title">
            The most trusted source of{" "}
            <span className="about-hero-gradient">business information</span> globally.
          </h1>
          <p className="about-hero-sub">
            Tellacity helps people share verified experiences and helps businesses earn
            trust through transparent reviews.
          </p>
          <div className="about-hero-ctas">
            <Link href="/write-review" className="about-btn-primary">
              Write a Review
            </Link>
            <Link href="/for-business" className="about-btn-outline-dark">
              Tellacity for Business
            </Link>
          </div>
        </div>
        <div className="about-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* 2. Mission */}
      <FadeUp threshold={IO} className="about-mission">
        <div className="about-mission-shimmer" aria-hidden />
        <p className="about-mission-text">
          To empower consumers to share their experiences and help businesses build trust
          through transparency, fairness, and open communication.
        </p>
      </FadeUp>

      {/* 3. Who we are */}
      <FadeUp threshold={IO} className="about-who">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="about-who-grid">
            <div className="about-who-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ABOUT_IMAGES.whoWeAre}
                alt="Tellacity team at work"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h2 className="about-section-title">
                <span className="about-section-accent">Who</span> we are
              </h2>
              <div className="about-who-copy">
                <p>
                  Tellacity is an independent customer reviews platform between consumers
                  and businesses — where verified experiences matter more than marketing
                  claims alone.
                </p>
                <p>
                  We are not owned by businesses or advertisers. That independence keeps
                  moderation fair and helps both sides trust what they see on Tellacity.
                </p>
                <p>
                  Whether you are choosing a service or managing reputation, the same trust
                  infrastructure serves everyone honestly. Learn more about our{" "}
                  <Link href="/for-business" className="about-inline-link">
                    Reputation Management Platform
                  </Link>{" "}
                  and{" "}
                  <Link href="/safety-trust" className="about-inline-link">
                    Safety &amp; Trust
                  </Link>{" "}
                  framework.
                </p>
              </div>
              <div className="about-stat-pills">
                <span className="about-stat-pill">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Independent Platform
                </span>
                <span className="about-stat-pill">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Not owned by advertisers
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. What Tellacity does */}
      <FadeUp threshold={IO} className="about-what">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="about-section-title">
            <span className="about-section-accent">What</span> Tellacity does
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-600">
            A customer reviews and feedback platform where honest, moderated reviews and
            reputation insights live in one place — connecting real feedback to better
            decisions.
          </p>
          <div className="about-feature-grid">
            {WHAT_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <StaggerFadeUp key={card.title} index={index} staggerMs={80} threshold={IO}>
                  <div className="about-feature-card h-full">
                    <span className="about-feature-icon" aria-hidden>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </div>
                </StaggerFadeUp>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* 5. How it works — dark section */}
      <FadeUp threshold={IO} className="about-how">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="about-section-title">
            <span className="about-section-accent">How</span> it works
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/65">
            Verified feedback in, trust signals out — the{" "}
            <Link href="/for-business" className="text-[#1ecfb8] underline underline-offset-2">
              reputation management platform
            </Link>{" "}
            connects collection, moderation, response, and analytics in one system.
          </p>
          <div className="about-steps">
            {HOW_STEPS.map((step, index) => (
              <StaggerFadeUp
                key={step.title}
                index={index}
                staggerMs={150}
                threshold={IO}
              >
                <div className="about-step">
                  <span className="about-step-num">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>
                    {step.copy}
                    {step.link ? (
                      <>
                        {" "}
                        See our{" "}
                        <Link
                          href={step.link.href}
                          className="text-[#1ecfb8] underline underline-offset-2"
                        >
                          {step.link.label}
                        </Link>{" "}
                        framework.
                      </>
                    ) : null}
                  </p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
          <Link href="/how-tellacity-works" className="about-how-link">
            Read how Tellacity works →
          </Link>
        </div>
      </FadeUp>

      {/* 6. Real teams */}
      <FadeUp threshold={IO} className="about-teams">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            className="about-teams-banner"
            style={{ backgroundImage: `url(${ABOUT_IMAGES.teamsBanner})` }}
          >
            <div className="about-teams-overlay" aria-hidden />
            <div className="about-teams-content">
              <p className="about-teams-line">Real teams.</p>
              <p className="about-teams-line about-teams-line--teal">Real feedback.</p>
              <p className="about-teams-sub">
                Turn everyday customer experiences into insight your whole team can act on.
              </p>
              <Link href="/for-business" className="about-btn-white">
                Explore Platform →
              </Link>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 7. Values */}
      <FadeUp threshold={IO} className="about-values">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="about-section-title">
            <span className="about-section-accent">Our</span> values
          </h2>
          <p className="mt-3 max-w-xl text-base text-gray-600">
            The principles behind every decision as an independent reviews platform.
          </p>
          <div className="about-values-grid">
            {VALUES.map((item, index) => {
              const Icon = item.icon;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <div className="about-value-card h-full">
                    <span className="about-value-icon" aria-hidden>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </StaggerFadeUp>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* 8. Split CTA */}
      <section className="about-split" aria-label="For consumers and businesses">
        <div className="about-split-panel about-split-panel--consumer">
          <div
            className="about-split-bg"
            style={{ backgroundImage: `url(${ABOUT_IMAGES.splitConsumer})` }}
            aria-hidden
          />
          <div className="about-split-inner">
            <p className="about-split-label">For consumers</p>
            <h2 className="about-split-title">Share your real experiences.</h2>
            <p className="about-split-sub">
              Help others choose with confidence. Every verified review is checked so
              genuine voices are heard.
            </p>
            <Link href="/write-review" className="about-btn-dark">
              Write a Review →
            </Link>
            <Link href="/reviewer-guidelines" className="about-split-link">
              Reviewer Guidelines →
            </Link>
          </div>
        </div>
        <div className="about-split-panel about-split-panel--business">
          <div
            className="about-split-bg"
            style={{ backgroundImage: `url(${ABOUT_IMAGES.splitBusiness})` }}
            aria-hidden
          />
          <div className="about-split-inner">
            <p className="about-split-label">For businesses</p>
            <h2 className="about-split-title">Build trust that compounds.</h2>
            <p className="about-split-sub">
              Verified reviews, public replies, and analytics powered by the reputation
              platform — act on real-world feedback every day.
            </p>
            <Link href="/for-business" className="about-btn-dark">
              Tellacity for Business →
            </Link>
            <Link href="/pricing" className="about-split-link">
              View Pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Category insights */}
      <FadeUp threshold={IO} className="about-insights">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="about-insights-grid">
            <div>
              <h2 className="about-section-title">
                <span className="about-section-accent">Category</span> insights
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Compare businesses by rating, volume, and recent sentiment — not just a
                static score from years ago. Recency and authenticity matter when trust is
                on the line.
              </p>
              <div className="about-check-row">
                <Check className="h-4 w-4" aria-hidden />
                <span>Side-by-side views weighted by verified, recent reviews</span>
              </div>
              <div className="about-check-row">
                <Check className="h-4 w-4" aria-hidden />
                <span>Spot trends across banking, retail, travel, and more</span>
              </div>
              <Link href="/categories" className="about-btn-pill">
                Browse Categories →
              </Link>
            </div>
            <div className="about-insights-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ABOUT_IMAGES.insights}
                alt="Engaging with customers through verified feedback"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 10. Bottom CTA */}
      <FadeUp threshold={IO} className="about-bottom-cta">
        <h2>Ready to build trust?</h2>
        <p>
          Join consumers and businesses using Tellacity to share verified experiences and
          grow reputation that lasts.
        </p>
        <div className="about-hero-ctas">
          <Link href="/write-review" className="about-btn-primary">
            Write a Review
          </Link>
          <Link href="/for-business" className="about-btn-outline-teal">
            Explore Platform
          </Link>
        </div>
      </FadeUp>

      {/* Condensed SEO + remaining copy */}
      <FadeUp threshold={IO} className="about-seo-links">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>
            Tellacity connects the consumer experience, business tools, and trust policies
            that support our{" "}
            <Link href="/for-business" className="about-inline-link">
              reputation management platform
            </Link>
            . Explore{" "}
            <Link href="/write-review" className="about-inline-link">
              Write a review
            </Link>
            ,{" "}
            <Link href="/for-business" className="about-inline-link">
              Tellacity for Business
            </Link>
            ,{" "}
            <Link href="/pricing" className="about-inline-link">
              pricing
            </Link>
            ,{" "}
            <Link href="/resources" className="about-inline-link">
              resources
            </Link>
            ,{" "}
            <Link href="/articles" className="about-inline-link">
              articles
            </Link>
            ,{" "}
            <Link href="/help-center" className="about-inline-link">
              Help Center
            </Link>
            ,{" "}
            <Link href="/business-guidelines" className="about-inline-link">
              Business Guidelines
            </Link>
            , and{" "}
            <Link href="/contact" className="about-inline-link">
              Contact
            </Link>
            .
          </p>
        </div>
      </FadeUp>

      <div className="about-sr-block">
        <p>
          To be the most trusted source of information about businesses globally.
          In plain terms: verification, moderation, and clear policies are the
          backbone of trust online, so accountability is the default, not the
          exception.
        </p>
        <p>
          Tellacity is not owned by businesses or advertisers. Neutral moderation
          supports both consumers and brands without pay-to-hide dynamics. Read our{" "}
          <Link href="/business-guidelines">Business Guidelines</Link> for how
          brands participate fairly.
        </p>
        <p>
          Verified review collection, reputation management, business responses,
          trust signals, widgets, and profile infrastructure share the same verified
          data. Explore the{" "}
          <Link href="/for-business">Reputation Management Platform</Link>,{" "}
          <Link href="/pricing">pricing</Link>, and{" "}
          <Link href="/resources">resources</Link>.
        </p>
        <p>
          Real teams turn everyday customer experiences into insight for support,
          marketing, product, and leadership — one shared source of truth instead
          of scattered spreadsheets.
        </p>
      </div>
    </main>
  );
}
