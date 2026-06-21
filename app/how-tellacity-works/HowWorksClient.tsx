"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Award,
  BarChart2,
  Building2,
  Camera,
  Check,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  businessSteps,
  businessStepDetails,
  consumerSteps,
  consumerStepDetails,
  feedbackLoopStages,
  insideCards,
  platformIncludes,
  HOW_WORKS_IMAGES,
  stepFlowItems,
  trustScoreItems,
  verificationItems,
} from "./howWorksData";

const IO = 0.12;

function VerificationIcon({ type }: { type: (typeof verificationItems)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "receipt":
      return <Receipt className={cls} aria-hidden />;
    case "userCheck":
      return <UserCheck className={cls} aria-hidden />;
    case "alertTriangle":
      return <AlertTriangle className={cls} aria-hidden />;
    case "camera":
      return <Camera className={cls} aria-hidden />;
    case "users":
      return <Users className={cls} aria-hidden />;
    default:
      return <Shield className={cls} aria-hidden />;
  }
}

function PlatformIcon({ type }: { type: (typeof platformIncludes)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "building":
      return <Building2 className={cls} aria-hidden />;
    case "fileText":
      return <FileText className={cls} aria-hidden />;
    case "layoutDashboard":
      return <LayoutDashboard className={cls} aria-hidden />;
    case "award":
      return <Award className={cls} aria-hidden />;
    case "shieldCheck":
      return <ShieldCheck className={cls} aria-hidden />;
    default:
      return <BarChart2 className={cls} aria-hidden />;
  }
}

function LoopIcon({ type }: { type: (typeof feedbackLoopStages)[number]["icon"] }) {
  const cls = "h-6 w-6";
  switch (type) {
    case "user":
      return <User className={cls} aria-hidden />;
    case "star":
      return <Star className={cls} aria-hidden />;
    case "messageSquare":
      return <MessageSquare className={cls} aria-hidden />;
    case "trendingUp":
      return <TrendingUp className={cls} aria-hidden />;
    default:
      return <Globe className={cls} aria-hidden />;
  }
}

function StepSection({
  step,
}: {
  step: (typeof stepFlowItems)[number];
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: IO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reverse = !step.imageLeft;

  return (
    <section
      ref={ref}
      className={`how-step-section how-step-section--${step.bg}`}
      aria-labelledby={`step-${step.num}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`how-step-grid${reverse ? " how-step-grid--reverse" : ""}`}>
          <div
            className={`how-step-image-wrap${step.imagePlain ? " how-step-image-wrap--plain" : ""}${visible ? " is-visible" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={`how-step-copy${visible ? " is-visible" : ""}`}>
            <span className="how-step-num">{step.num}</span>
            <h2 id={`step-${step.num}`} className="how-step-title">
              {step.title}
            </h2>
            <p className="how-step-body">{step.detail}</p>
            <span className="how-step-why-label">Why it matters:</span>
            <p className="how-step-why">{step.whyItMatters}</p>
            {step.cta ? (
              <Link href={step.cta.href} className="how-step-cta">
                {step.cta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustScoreBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: IO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="how-trust-card">
      <div className="how-trust-score-num">
        4.3 <span>/ 5</span>
      </div>
      <p className="how-trust-score-label">Trust Score</p>
      {trustScoreItems.map((item) => (
        <div key={item.title} className="how-trust-bar-row">
          <div className="how-trust-bar-head">
            <span>{item.title}</span>
            <span>{item.pct}%</span>
          </div>
          <div className="how-trust-bar-track">
            <div
              className={`how-trust-bar-fill${visible ? " is-visible" : ""}`}
              style={{ ["--hw-bar-pct" as string]: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HowWorksClient() {
  return (
    <main className="how-works-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="how-hero" aria-labelledby="how-hero-title">
        <div className="how-hero-bg" aria-hidden />
        <div className="how-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="how-hero-inner">
          <span className="how-hero-badge">TRANSPARENT · VERIFIED · FAIR</span>
          <h1 id="how-hero-title">
            <span className="how-hero-title-line">How Tellacity</span>
            <span className="how-hero-title-accent">Works</span>
          </h1>
          <p className="how-hero-sub">
            Our verification process, transparent policies, and fair moderation keep
            the platform trustworthy for everyone.
          </p>
          <div className="how-hero-ctas">
            <Link href="/write-review" className="how-btn-primary">
              Write a Review
            </Link>
            <Link href="/business/claim" className="how-btn-outline-white">
              Claim Your Business
            </Link>
          </div>
        </div>
        <div className="how-hero-steps" aria-hidden>
          {[1, 2, 3, 4, 5, 6].flatMap((n, i) => [
            <span
              key={`step-${n}`}
              className="how-hero-step"
              style={{ animationDelay: `${0.2 + i * 0.25}s` }}
            >
              {n}
            </span>,
            ...(i < 5
              ? [
                  <span
                    key={`arrow-${n}`}
                    className="how-hero-step-arrow"
                    style={{ animationDelay: `${0.32 + i * 0.25}s` }}
                  >
                    →
                  </span>,
                ]
              : []),
          ])}
        </div>
      </section>

      {/* 2. Intro band */}
      <FadeUp threshold={IO} className="how-intro">
        <div className="how-intro-shimmer" aria-hidden />
        <p className="how-intro-text">
          Six steps connect customers, reviews, and businesses, from the first search
          to the verified feedback that updates trust signals.
        </p>
      </FadeUp>

      {/* 3. Six steps */}
      {stepFlowItems.map((step) => (
        <StepSection key={step.num} step={step} />
      ))}

      {/* 4. Inside Tellacity */}
      <FadeUp threshold={IO} className="how-inside">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            <span className="how-section-accent">Inside</span> Tellacity
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
            Three surfaces customers and businesses use: public profile, review form,
            and business dashboard, turning experience into verified reputation.
          </p>
          <div className="how-inside-banner" role="img" aria-label="Inside Tellacity platform" />
          <div className="how-inside-cards">
            {insideCards.map((card, index) => (
              <StaggerFadeUp key={card.title} index={index} staggerMs={80} threshold={IO}>
                <article className="how-inside-card h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image} alt={card.title} loading="lazy" decoding="async" />
                  <div className="how-inside-card-body">
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <Link href={card.href} className="how-inside-card-link">
                      {card.linkLabel}
                    </Link>
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm text-white/70">
            Consumers interact with profiles and the review form. Businesses use the{" "}
            <Link href="/for-business" className="text-[#1ecfb8] underline underline-offset-2">
              Tellacity Reputation Management Platform
            </Link>{" "}
            to connect responses, analytics, and widgets to the same verified pipeline.
          </p>
        </div>
      </FadeUp>

      {/* 5. Verification system */}
      <FadeUp threshold={IO} className="how-verify">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            The Verification <span className="how-section-accent">System</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Multiple overlapping layers protect authenticity and fairness. Read our{" "}
            <Link href="/reviewer-guidelines" className="how-inline-link">
              reviewer guidelines
            </Link>{" "}
            and{" "}
            <Link href="/safety-trust" className="how-inline-link">
              Safety &amp; Trust
            </Link>{" "}
            pages for policy detail.
          </p>
          <div className="how-verify-grid">
            <div className="how-verify-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Tellacity%20Vefication%20Batch.png"
                alt="Tellacity verification badge"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOW_WORKS_IMAGES.verificationSecondary}
                alt="Team reviewing the same verification data"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              {verificationItems.map((item) => (
                <div key={item.title} className="how-verify-row">
                  <span className="how-verify-icon">
                    <VerificationIcon type={item.icon} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 6. Trust Score */}
      <FadeUp threshold={IO} className="how-trust">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            How the Trust <span className="how-section-accent">Score Works</span>
          </h2>
          <div className="how-trust-grid">
            <div className="how-trust-copy">
              <p>
                The Trust Score is a single, transparent number summarizing reputation
                on Tellacity, calculated from six explicit factors, not a hidden
                algorithm.
              </p>
              <p>
                Recency, verification rate, and response behavior matter alongside
                volume and quality, so the score reflects how the business is doing
                now.
              </p>
              <div className="how-trust-dash">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Tellacity%20Dash.png"
                  alt="Tellacity dashboard trust analytics"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="how-trust-factors">
                {trustScoreItems.map((item) => (
                  <div key={item.title} className="how-trust-factor">
                    <h3>{item.fullTitle ?? item.title}</h3>
                    <p>
                      <strong>What it measures:</strong> {item.measures}
                    </p>
                    <p>
                      <strong>Why it matters:</strong> {item.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <TrustScoreBars />
          </div>
        </div>
      </FadeUp>

      {/* 7. Feedback loop */}
      <FadeUp threshold={IO} className="how-loop">
        <div className="how-loop-bg" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            The Feedback <span className="how-section-accent">Loop</span>
          </h2>
          <p className="relative z-[1] mt-3 max-w-2xl text-sm text-white/75">
            Customer experiences flow into reviews, business responses, updated trust
            signals, and community benefit, transparent by design. Explore the{" "}
            <Link href="/for-business" className="text-[#1ecfb8] underline underline-offset-2">
              reputation management platform
            </Link>
            .
          </p>
          <div className="how-loop-diagram">
            {feedbackLoopStages.map((stage) => (
              <div key={stage.title} className="how-loop-node">
                <span className="how-loop-node-tip">{stage.detail}</span>
                <span className="how-loop-node-circle">
                  <LoopIcon type={stage.icon} />
                </span>
                <span className="how-loop-node-label">{stage.title}</span>
              </div>
            ))}
          </div>
          <div className="how-loop-cards">
            {feedbackLoopStages.map((stage, index) => (
              <StaggerFadeUp key={stage.title} index={index} staggerMs={80} threshold={IO}>
                <div className="how-loop-card h-full">
                  <h3>{stage.title}</h3>
                  <p>{stage.detail}</p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 8. Verified review */}
      <FadeUp threshold={IO} className="how-verified">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            What a Verified Review <span className="how-section-accent">Looks Like</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Verified means a real account, passed verification, and (where applicable)
            proof of purchase on file, weighing more heavily in the Trust Score.
          </p>
          <div className="how-verified-grid">
            <div className="how-verified-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/write%20a%20review.png"
                alt="Writing a verified review"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <div className="how-mock-review">
                <div className="how-mock-stars" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <p className="how-mock-title">Great service and fast support.</p>
                <p className="how-mock-body">
                  The team resolved my issue quickly and kept me updated throughout.
                </p>
                <span className="how-mock-verified-label">Verified Customer</span>
                <div className="how-mock-badge-row">
                  <span className="how-mock-badge">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Verified Review
                  </span>
                  <span className="text-xs text-gray-500">Example Business Ltd</span>
                </div>
              </div>
              <div className="how-check-row">
                <Check className="h-4 w-4" aria-hidden />
                <span>Real account verification</span>
              </div>
              <div className="how-check-row">
                <Check className="h-4 w-4" aria-hidden />
                <span>Passed moderation system</span>
              </div>
              <div className="how-check-row">
                <Check className="h-4 w-4" aria-hidden />
                <span>Proof of purchase on file</span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 9. Split panels */}
      <section className="how-split" aria-label="For consumers and businesses">
        <div className="how-split-panel how-split-panel--consumer">
          <div className="how-split-bg" aria-hidden />
          <div className="how-split-inner">
            <p className="how-split-label">For Consumers</p>
            <h2 className="how-split-title">Share your real experiences.</h2>
            <div className="how-split-pills">
              {consumerSteps.map((label) => (
                <span key={label} className="how-split-pill">
                  {label}
                </span>
              ))}
            </div>
            <Link href="/write-review" className="how-btn-dark">
              Write a Review →
            </Link>
            <Link href="/reviewer-guidelines" className="how-split-link">
              Reviewer Guidelines →
            </Link>
          </div>
        </div>
        <div className="how-split-panel how-split-panel--business">
          <div className="how-split-bg" aria-hidden />
          <div className="how-split-inner">
            <p className="how-split-label">For Businesses</p>
            <h2 className="how-split-title">Build trust that compounds.</h2>
            <div className="how-split-pills">
              {businessSteps.map((label) => (
                <span key={label} className="how-split-pill">
                  {label}
                </span>
              ))}
            </div>
            <Link href="/for-business" className="how-btn-teal-on-dark">
              Tellacity for Business →
            </Link>
            <Link href="/business/claim" className="how-split-link">
              Claim Your Business →
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Platform includes */}
      <FadeUp threshold={IO} className="how-platform">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="how-section-title">
            What the Platform <span className="how-section-accent">Includes</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Public discovery and reputation management connected through reviews,
            verification, trust signals, and business tools.
          </p>
          <div className="how-platform-grid">
            {platformIncludes.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <article className="how-platform-card h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
                  <div className="how-platform-card-body">
                    <span
                      className={`how-platform-icon ${
                        index % 2 === 0 ? "how-platform-icon--forest" : "how-platform-icon--teal"
                      }`}
                    >
                      <PlatformIcon type={item.icon} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    <Link href={item.href} className="how-platform-link">
                      Learn more →
                    </Link>
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-600">
            Explore the full platform on the{" "}
            <Link href="/for-business" className="how-inline-link">
              Reputation Management Platform
            </Link>{" "}
            page or browse{" "}
            <Link href="/resources" className="how-inline-link">
              resources
            </Link>{" "}
            and the{" "}
            <Link href="/articles" className="how-inline-link">
              blog
            </Link>
            .
          </p>
        </div>
      </FadeUp>

      {/* 11. Bottom CTA */}
      <FadeUp threshold={IO} className="how-bottom-cta">
        <div className="how-bottom-cta-bg" aria-hidden />
        <div className="how-bottom-cta-inner">
          <h2>Ready to share your experience?</h2>
          <p>Join thousands of people helping others make better decisions.</p>
          <div className="how-hero-ctas">
            <Link href="/write-review" className="how-btn-primary how-btn-primary-dark-text">
              Write a Review
            </Link>
            <Link href="/business/claim" className="how-btn-outline-white">
              Claim Your Business
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* SEO / remaining copy */}
      <FadeUp threshold={IO} className="how-seo">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>
            This page explains how consumers and businesses interact with Tellacity,
            from discovery to verified feedback and trust signals. The journey is the
            backbone of the customer reviews and feedback platform: discovery, reading,
            writing, verification, business collaboration, and community impact feed the
            same trust infrastructure.
          </p>
          <p>
            The{" "}
            <Link href="/for-business" className="how-inline-link">
              Tellacity Reputation Management Platform
            </Link>{" "}
            underpins the entire feedback loop, wiring verified reviews into dashboards,
            widgets, analytics, and automation. See{" "}
            <Link href="/for-business" className="how-inline-link">
              Tellacity for Business
            </Link>{" "}
            and{" "}
            <Link href="/pricing" className="how-inline-link">
              pricing
            </Link>{" "}
            for how teams get started.
          </p>
          <p>
            Verified reviews, transparent moderation, and trust signals matter because
            buying decisions should not depend on manipulated ratings. Learn more on{" "}
            <Link href="/about" className="how-inline-link">
              About Tellacity
            </Link>
            , read{" "}
            <Link href="/business-guidelines" className="how-inline-link">
              business guidelines
            </Link>
            , or visit the{" "}
            <Link href="/help-center" className="how-inline-link">
              Help Center
            </Link>
            . Explore{" "}
            <Link href="/write-review" className="how-inline-link">
              Write a review
            </Link>
            ,{" "}
            <Link href="/reviewer-guidelines" className="how-inline-link">
              reviewer guidelines
            </Link>
            ,{" "}
            <Link href="/safety-trust" className="how-inline-link">
              Safety &amp; Trust
            </Link>
            , and{" "}
            <Link href="/contact" className="how-inline-link">
              contact
            </Link>
            .
          </p>
        </div>
      </FadeUp>

      <div className="how-sr-block">
        <p>
          Tellacity makes it easy to share and discover real experiences. This page
          explains how consumers and businesses interact with Tellacity, from discovery
          to verified feedback and trust signals.
        </p>
        {consumerStepDetails.map((s) => (
          <p key={s.title}>
            {s.title}: {s.description}
          </p>
        ))}
        {businessStepDetails.map((s) => (
          <p key={s.title}>
            {s.title}: {s.description}
          </p>
        ))}
        <p>
          Every verified review carries transparent structure: star rating, clear title,
          detailed body, verified identity, related business, and verified badge.
        </p>
      </div>
    </main>
  );
}
