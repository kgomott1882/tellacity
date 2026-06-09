"use client";

import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BarChart2,
  Camera,
  Database,
  GitBranch,
  Mail,
  Search,
  Shield,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  KEY_BENEFITS,
  PLATFORM_CARDS,
  PLATFORM_FAQS,
  PLATFORM_FEATURES,
  PROBLEM_POINTS,
  RELATED_PAGES,
  TEAM_USE_CASES,
  WORKFLOW_STEPS,
} from "./reputationPlatformData";

const IO = 0.12;

function BenefitIcon({ type }: { type: (typeof KEY_BENEFITS)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "badgeCheck":
      return <BadgeCheck className={cls} aria-hidden />;
    case "workflow":
      return <GitBranch className={cls} aria-hidden />;
    case "search":
      return <Search className={cls} aria-hidden />;
    case "trendingUp":
      return <TrendingUp className={cls} aria-hidden />;
    default:
      return <Database className={cls} aria-hidden />;
  }
}

function ModuleIcon({ type }: { type: (typeof PLATFORM_CARDS)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "star":
      return <Star className={cls} aria-hidden />;
    case "barChart2":
      return <BarChart2 className={cls} aria-hidden />;
    case "shield":
      return <Shield className={cls} aria-hidden />;
    case "camera":
      return <Camera className={cls} aria-hidden />;
    case "award":
      return <Award className={cls} aria-hidden />;
    default:
      return <Mail className={cls} aria-hidden />;
  }
}

export default function ReputationPlatformClient() {
  return (
    <main className="rp-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="rp-hero" aria-labelledby="rp-hero-title">
        <div className="rp-hero-bg" aria-hidden />
        <HeroStarField />
        <div className="rp-hero-inner">
          <div className="rp-hero-grid">
            <div>
              <div className="rp-hero-enter">
                <span className="rp-hero-badge">
                  ONE VERIFIED REVIEW PIPELINE · ONE DASHBOARD
                </span>
              </div>
              <h1 id="rp-hero-title" className="rp-hero-enter rp-hero-enter--2">
                <span className="rp-hero-title-line">Build Verified</span>
                <span className="rp-hero-title-accent">Customer Trust</span>
              </h1>
              <p className="rp-hero-sub rp-hero-enter rp-hero-enter--3">
                Review invitations, widgets, analytics, reputation management, and
                photo uploads — all connected in one verified system.
              </p>
              <div className="rp-hero-ctas rp-hero-enter rp-hero-enter--4">
                <Link href="/business/signup" className="rp-btn-primary">
                  Start Free
                </Link>
                <Link href="/suggest-business" className="rp-btn-outline-white">
                  Claim Your Business
                </Link>
                <Link href="/business/dashboard" className="rp-text-link">
                  Open Dashboard →
                </Link>
              </div>
              <div className="rp-hero-trust rp-hero-enter rp-hero-enter--4">
                <span>✓ No credit card required</span>
                <span>·</span>
                <span>✓ Setup in minutes</span>
                <span>·</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>
            <div className="rp-hero-visual rp-hero-enter rp-hero-enter--3">
              <div className="rp-hero-glow" aria-hidden />
              <div className="rp-hero-dash">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Tellacity%20Dash.png"
                  alt="Tellacity reputation dashboard"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem */}
      <FadeUp threshold={IO} className="rp-problem">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            The <span className="rp-section-accent">Problem</span>
          </h2>
          <div className="rp-problem-grid">
            <div>
              <p className="rp-problem-lead">
                Most businesses collect customer feedback in five or six different places.
                When verified customer trust is split across tools, teams stop trusting their
                own numbers — and search engines see the same fragmentation.
              </p>
              {PROBLEM_POINTS.map((point) => (
                <div key={point.label} className="rp-pain-row">
                  <XCircle className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>{point.label}</strong>
                    <span>{point.detail}</span>
                  </div>
                </div>
              ))}
              <div className="rp-problem-divider" />
              <Link href="/solutions/review-invitations" className="rp-text-link">
                Start collecting verified reviews →
              </Link>
            </div>
            <div className="rp-problem-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1568952433726-3896e3881c65?auto=format&fit=crop&w=1200&q=80"
                alt="Scattered feedback across disconnected tools"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/reputation_system.jpeg"
                alt="Unified Tellacity reputation system"
                className="rp-problem-unified"
                loading="lazy"
                decoding="async"
              />
              <span className="rp-unified-label">Unified System</span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 3. Why choose */}
      <FadeUp threshold={IO} className="rp-why">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            Why Businesses <span className="rp-section-accent">Choose Tellacity</span>
          </h2>
          <p className="rp-intro-note">
            Businesses choose Tellacity when they want one reputation system, not a patchwork
            of widgets, spreadsheets, and disconnected review sites.
          </p>
          <div className="rp-why-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/Real%20capabilities.jpeg"
              alt="Tellacity real platform capabilities"
              loading="lazy"
              decoding="async"
            />
            <div className="rp-why-banner-text">
              <h3>One source of truth for trust.</h3>
              <p>Not a patchwork of widgets.</p>
            </div>
          </div>
          <div className="rp-benefit-grid">
            {KEY_BENEFITS.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={70} threshold={IO}>
                <article className="rp-benefit-card h-full">
                  <span className={`rp-benefit-icon rp-benefit-icon--${item.accent}`}>
                    <BenefitIcon type={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 4. How platform works */}
      <FadeUp threshold={IO} className="rp-how">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            How the <span className="rp-section-accent">Platform Works</span>
          </h2>
          <div className="rp-how-grid">
            <div className="rp-how-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Inside%20Tellacity.png"
                alt="Inside Tellacity platform"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80"
                alt="Team reviewing reputation data on screens"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <div className="rp-feature-rows">
                {PLATFORM_FEATURES.map((row) => (
                  <div key={row.title} className="rp-feature-row">
                    <span className="rp-feature-dot" aria-hidden />
                    <h3>{row.title}</h3>
                    <p>{row.detail}</p>
                  </div>
                ))}
              </div>
              <Link href="/how-tellacity-works" className="rp-text-link" style={{ color: "#00b4a6" }}>
                Read how Tellacity works →
              </Link>
              <p className="rp-intro-note">
                Moderation and audit trails align to our{" "}
                <Link href="/safety-trust" className="rp-inline-link">
                  Safety &amp; Trust
                </Link>{" "}
                framework.
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 5. Platform modules */}
      <FadeUp threshold={IO} className="rp-modules">
        <div className="rp-modules-bg" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            Platform <span className="rp-section-accent">Modules</span>
          </h2>
          <p className="rp-modules-sub">
            Six modules, one verified review infrastructure, one centralised dashboard.
            Explore each module in depth on its solution page.
          </p>
          <div className="rp-module-grid">
            {PLATFORM_CARDS.map((card, index) => (
              <StaggerFadeUp key={card.href} index={index} staggerMs={60} threshold={IO}>
                <Link href={card.href} className="rp-module-card h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.imageTop ?? card.image}
                    alt={card.imageAlt ?? card.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="rp-module-body">
                    <span
                      className="rp-module-icon"
                      style={{
                        background:
                          card.iconAccent === "forest"
                            ? "rgba(18,69,65,0.1)"
                            : "rgba(0,180,166,0.12)",
                        color: card.iconAccent === "forest" ? "#124541" : "#00b4a6",
                      }}
                    >
                      <ModuleIcon type={card.icon} />
                    </span>
                    <h3>{card.title}</h3>
                    <p className="rp-module-tagline">{card.tagline}</p>
                    <p>{card.description}</p>
                    <span className="rp-module-link">Learn more →</span>
                  </div>
                </Link>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Teams */}
      <FadeUp threshold={IO} className="rp-teams">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">Use Cases by Team</h2>
          <p className="rp-intro-note">
            Every team uses the Tellacity Reputation Management Platform differently, but
            they all work from the same verified customer data — not duplicate exports or
            conflicting scores.
          </p>
          <div className="rp-team-grid">
            {TEAM_USE_CASES.map((team, index) => (
              <StaggerFadeUp key={team.team} index={index} staggerMs={60} threshold={IO}>
                <article className="rp-team-card h-full">
                  <h3>
                    <span aria-hidden>{team.icon}</span> {team.team}
                  </h3>
                  <p className="font-medium text-gray-700">{team.benefit}</p>
                  <p>{team.body}</p>
                  <div className="rp-team-links">
                    {team.links.map((link) => (
                      <Link key={link.href} href={link.href} className="rp-team-pill">
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Workflow */}
      <FadeUp threshold={IO} className="rp-workflow">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">How the Workflow Fits Together</h2>
          <p className="rp-intro-note">
            This is one system, not separate tools stitched together. The steps below show
            how modules connect from invitation through improvement.
          </p>
          <ol className="rp-workflow-list">
            {WORKFLOW_STEPS.map((step, index) => (
              <li key={step.title} className="rp-workflow-step">
                <span className="rp-workflow-num">{index + 1}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </FadeUp>

      {/* Trust & search */}
      <FadeUp threshold={IO} className="rp-trust">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">Why This Matters for Trust and Search</h2>
          <p>
            Structured, verified, up-to-date reputation data helps users, search engines,
            and AI systems understand your business with less guesswork. When proof is
            consistent across your profile, widgets, and review pages, it is easier to
            trust and cite.
          </p>
          <p>
            Tellacity emits structured data, such as Review, AggregateRating, ImageObject,
            and related schema where applicable, so public proof stays aligned with what
            customers actually experience.
          </p>
          <p>
            We do not promise specific ranking outcomes; results depend on your content,
            market, and implementation. One consistent source is still easier to defend
            than scattered screenshots and stale testimonials.
          </p>
          <p>
            Read our{" "}
            <Link href="/reviewer-guidelines" className="rp-inline-link">
              reviewer guidelines
            </Link>{" "}
            and{" "}
            <Link href="/faq" className="rp-inline-link">
              FAQ
            </Link>{" "}
            for how verification and moderation work in practice.
          </p>
        </div>
      </FadeUp>

      {/* FAQ */}
      <FadeUp threshold={IO} className="rp-faq">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title text-center">Common Questions</h2>
          <p className="rp-intro-note text-center">
            Short answers to the most common questions about how the Tellacity Reputation
            Management Platform fits together.
          </p>
          <div className="mt-6">
            {PLATFORM_FAQS.map((faq) => (
              <details key={faq.question} className="rp-faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-600">
            See how the platform fits together in our{" "}
            <Link href="/how-tellacity-works" className="rp-inline-link">
              How Tellacity works
            </Link>{" "}
            guide, learn more in our{" "}
            <Link href="/resources" className="rp-inline-link">
              Resources
            </Link>{" "}
            hub, or visit the{" "}
            <Link href="/help-center" className="rp-inline-link">
              Help Center
            </Link>{" "}
            for setup support.
          </p>
        </div>
      </FadeUp>

      {/* Related */}
      <FadeUp threshold={IO} className="rp-related">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600">
            Tellacity&apos;s Reputation Management Platform sits at the center of our
            business, trust, and support ecosystem. Explore{" "}
            <Link href="/for-business" className="rp-inline-link">
              Tellacity for Business
            </Link>
            ,{" "}
            <Link href="/pricing" className="rp-inline-link">
              pricing
            </Link>
            ,{" "}
            <Link href="/safety-trust" className="rp-inline-link">
              Safety &amp; Trust
            </Link>
            , and{" "}
            <Link href="/help-center" className="rp-inline-link">
              Help Center
            </Link>{" "}
            to go deeper.
          </p>
          <ul className="rp-related-grid">
            {RELATED_PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="rp-inline-link">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </FadeUp>

      {/* Bottom CTA */}
      <FadeUp threshold={IO} className="rp-bottom-cta">
        <div className="rp-bottom-cta-bg" aria-hidden />
        <div className="rp-bottom-cta-inner">
          <h2>Start Building Your Reputation Platform</h2>
          <p>
            Claim your verified Tellacity profile, invite your first customers, and put
            every part of your customer reputation on one centralised platform.
          </p>
          <p>
            Start free, centralize invitations and responses in one dashboard, and add
            widgets and analytics as your reputation program grows.
          </p>
          <div className="rp-bottom-cta-actions">
            <Link href="/business/signup" className="rp-btn-primary">
              Start Free
            </Link>
            <Link href="/suggest-business" className="rp-btn-outline-white">
              Claim Your Business
            </Link>
            <Link href="/business/dashboard" className="rp-btn-outline-white">
              Open Dashboard
            </Link>
          </div>
        </div>
      </FadeUp>

      <div className="rp-sr-block">
        <p>
          The Tellacity Reputation Management Platform connects review invitations, widgets,
          analytics, reputation management, and photo uploads in one verified system. Every
          module reads from the same verified review pipeline, so customers, search engines,
          and AI systems see one consistent trust signal across every touchpoint.
        </p>
        <p>
          Explore{" "}
          <Link href="/for-business">Tellacity for Business</Link>, compare{" "}
          <Link href="/pricing">pricing</Link>, or read{" "}
          <Link href="/how-tellacity-works">how Tellacity works</Link>.
        </p>
        {PLATFORM_CARDS.map((card) => (
          <p key={card.href}>
            {card.title}: {card.detail}
          </p>
        ))}
      </div>
    </main>
  );
}
