"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertOctagon,
  BadgeCheck,
  BarChart2,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle,
  ChevronDown,
  Cpu,
  FileText,
  Globe,
  Handshake,
  Layers,
  Lock,
  Network,
  Presentation,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  CONTACT_TOPICS,
  HIGHLIGHTS,
  INTEGRITY_MILESTONES,
  INVESTMENT_REASONS,
  IR_HERO_UNSPLASH,
  IR_IMAGES,
  IR_UNSPLASH,
  KEY_THEMES,
  PROGRESS_MILESTONES,
  STATS_BAND,
  TRUST_GAP_CARDS,
} from "./investorData";

const IO = 0.12;

function BrandBannerImage({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={400}
      className="ir-banner-img"
    />
  );
}

function BrandSplitImage({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={700}
      height={470}
      className="ir-split-main-img"
    />
  );
}

function HeroMarketCount({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: IO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target]);

  return (
    <span ref={ref} className="ir-hero-float-value">
      ${display}T+
    </span>
  );
}

function StatsCountUp({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: IO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <p ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </p>
  );
}

function MilestoneTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: IO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ir-milestone-track ${drawn ? "is-drawn" : ""}`}
      aria-hidden
    />
  );
}

export default function InvestorClient() {
  return (
    <main className="investor-cinematic">
      <HomeScrollProgress />

      {/* Hero */}
      <section className="ir-hero" aria-labelledby="ir-hero-title">
        <div
          className="ir-hero-bg"
          style={{ backgroundImage: `url(${IR_HERO_UNSPLASH})` }}
          aria-hidden
        />
        <div className="ir-hero-overlay" aria-hidden />
        <div className="ir-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="ir-hero-layout">
          <div className="ir-hero-inner">
            <span className="ir-hero-badge">INVESTOR RELATIONS</span>
            <h1 id="ir-hero-title">
              <span className="ir-hero-title-line">Powering the</span>
              <span className="ir-hero-title-accent">Trust Economy</span>
            </h1>
            <p className="ir-hero-sub">
              We are redefining digital reputation through verified proof. Join us as we
              build the global standard for consumer transparency.
            </p>
            <p className="ir-hero-sub ir-hero-sub--secondary">
              This investor relations page combines market opportunity, product strategy,
              and transparency for analysts and prospective partners. Learn more about{" "}
              <Link href="/about" className="ir-hero-link">
                Tellacity
              </Link>{" "}
              and our{" "}
              <Link href="/for-business" className="ir-hero-link">
                Reputation Platform
              </Link>
              .
            </p>
            <p className="ir-hero-note">
              Market opportunity, product strategy, and transparency for analysts and
              prospective partners.
            </p>
          </div>
          <div className="ir-hero-float" aria-hidden>
            <div className="ir-hero-float-card">
              <p className="ir-hero-float-title">Trust Economy Market</p>
              <div className="ir-hero-float-divider" />
              <HeroMarketCount target={4} />
              <p className="ir-hero-float-label">Annual trust gap</p>
              <div className="ir-hero-float-bar">
                <span style={{ width: "80%" }} />
              </div>
              <div className="ir-hero-float-stats">
                <div>
                  <p className="ir-hero-float-stat-val">600K+</p>
                  <p className="ir-hero-float-stat-lbl">Businesses</p>
                </div>
                <span className="ir-hero-float-sep">·</span>
                <div>
                  <p className="ir-hero-float-stat-val ir-hero-float-stat-val--forest">7</p>
                  <p className="ir-hero-float-stat-lbl">Markets</p>
                </div>
              </div>
              <p className="ir-hero-float-live">
                <span className="ir-hero-float-live-dot" aria-hidden />
                Live opportunity
              </p>
            </div>
          </div>
        </div>
        <div className="ir-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* Investment Opportunity */}
      <section className="ir-section ir-section--white">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              <span className="ir-section-accent">Investment</span> Opportunity
            </h2>
          </FadeUp>
          <FadeUp threshold={IO} className="ir-banner-wrap">
            <div className="ir-banner ir-banner--invest">
              <BrandBannerImage src={IR_IMAGES.investment} alt="Markets and investment opportunity" />
              <div className="ir-banner-overlay ir-banner-overlay--forest" aria-hidden />
              <div className="ir-banner-quote">
                <p>Infrastructure for verified trust at scale.</p>
                <p className="ir-banner-quote-accent">Not a surface-level ratings site.</p>
              </div>
            </div>
          </FadeUp>
          <div className="ir-split">
            <FadeUp threshold={IO} className="ir-split-copy">
              <p className="ir-lead">
                Tellacity is building infrastructure for verified trust in online
                reputation, not a surface-level ratings site, but software, moderation,
                and trust signals designed to scale with businesses and consumers.
              </p>
              <p className="ir-lead">
                For investors, the opportunity sits at the intersection of SaaS recurring
                revenue, platform integrity, and a large addressable market where confidence
                in reviews directly affects economic outcomes.
              </p>
              <p className="ir-lead">
                Tellacity combines software, trust infrastructure, and transparent
                moderation into a scalable platform model.
              </p>
              <ul className="ir-check-list">
                {HIGHLIGHTS.map((item) => (
                  <li key={item.title} className="ir-check-row">
                    <CheckCircle className="ir-check-icon" aria-hidden />
                    <div>
                      <p className="ir-check-title">{item.title}</p>
                      <p className="ir-check-desc">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="ir-inline-links">
                Business monetisation is outlined on our{" "}
                <Link href="/pricing" className="ir-text-link">
                  pricing
                </Link>{" "}
                and{" "}
                <Link href="/for-business" className="ir-text-link">
                  for-business
                </Link>{" "}
                pages; trust enforcement is detailed in{" "}
                <Link href="/safety-trust" className="ir-text-link">
                  Safety &amp; Trust
                </Link>
                .
              </p>
            </FadeUp>
            <div className="ir-theme-stack">
              {KEY_THEMES.map((theme, i) => (
                <StaggerFadeUp key={theme.title} index={i} staggerMs={60} threshold={IO}>
                  <div className={`ir-theme-card ir-theme-card--${theme.variant}`}>
                    <span className={`ir-icon-circle ir-icon-circle--${theme.variant} ir-icon-circle--sm`}>
                      <ThemeIcon type={theme.icon} />
                    </span>
                    <div>
                      <p className="ir-theme-title">{theme.title}</p>
                      <p className="ir-theme-detail">{theme.detail}</p>
                    </div>
                  </div>
                </StaggerFadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Gap */}
      <section className="ir-section ir-section--dark">
        <div
          className="ir-section-dark-bg"
          style={{ backgroundImage: `url(${IR_IMAGES.trustGap})` }}
          aria-hidden
        />
        <div className="ir-section-inner ir-section-inner--relative">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title ir-section-title--light">
              Bridging the <span className="ir-section-accent">Trust Gap</span>
            </h2>
            <div className="ir-trust-impact">
              <p className="ir-trust-big">$4 TRILLION</p>
              <p className="ir-trust-sub">annually in lost value and fraud</p>
            </div>
            <p className="ir-section-sub ir-section-sub--light">
              The digital economy suffers from a crisis of confidence. Fake reviews,
              AI-generated content, and paid endorsements cost the global economy over $4
              trillion annually in lost value and fraud. That $4T trust gap reflects
              economic loss from decisions made on manipulated or unverified feedback.
            </p>
          </FadeUp>
          <div className="ir-trust-grid">
            {TRUST_GAP_CARDS.map((card, i) => (
              <StaggerFadeUp key={card.title} index={i} staggerMs={80} threshold={IO}>
                <div className="ir-trust-card">
                  <TrustGapIcon type={card.icon} accent={card.accent} />
                  <h3 className="ir-trust-card-title">{card.title}</h3>
                  <p className="ir-trust-card-body">{card.detail}</p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="ir-section ir-section--beige">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              Why Invest in <span className="ir-section-accent">Tellacity?</span>
            </h2>
            <p className="ir-section-sub">
              Structural advantages in a trust-driven market.
            </p>
            <p className="ir-section-copy">
              Our platform is designed to build trust at scale while unlocking sustainable
              growth. The themes below summarise why verification infrastructure, network
              effects, and brand neutrality matter to long-term investors.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="ir-banner-wrap">
            <div className="ir-banner ir-banner--why">
              <BrandBannerImage src={IR_IMAGES.whyInvest} alt="Why invest in Tellacity" />
              <div className="ir-banner-overlay" aria-hidden />
              <p className="ir-banner-quote ir-banner-quote--sm">
                Verification infrastructure. Network effects. Brand neutrality.
              </p>
            </div>
          </FadeUp>
          <div className="ir-why-grid">
            {INVESTMENT_REASONS.map((item, i) => (
              <StaggerFadeUp key={item.title} index={i} staggerMs={70} threshold={IO}>
                <div className={`ir-why-card ir-why-card--${item.accent}`}>
                  <span className={`ir-icon-circle ir-icon-circle--${item.accent}`}>
                    <WhyIcon type={item.icon} />
                  </span>
                  <h3 className="ir-why-title">{item.title}</h3>
                  <p className="ir-why-body">{item.body}</p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Integrity */}
      <section className="ir-section ir-section--white">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              <span className="ir-section-accent">Commitment to</span> Integrity
            </h2>
          </FadeUp>
          <div className="ir-split ir-split--integrity">
            <FadeUp threshold={IO} className="ir-split-media ir-split-media--float">
              <BrandSplitImage src={IR_IMAGES.integrity} alt="Build growth with integrity" />
              <div className="ir-integrity-float">
                <p className="ir-integrity-float-title">🛡 Verified</p>
                <p className="ir-integrity-float-sub">Fraud detection active</p>
                <p className="ir-integrity-float-meta">AI-powered · 24/7</p>
              </div>
            </FadeUp>
            <FadeUp threshold={IO} className="ir-split-copy">
              <p className="ir-lead">
                Our verification systems and transparent moderation policies are built to
                protect trust for consumers and businesses.
              </p>
              <p className="ir-lead">
                Transparent moderation and verification are core to Tellacity&apos;s business
                model, not optional product features. Trust is both the market need we
                address and the principle that governs how the platform operates.
              </p>
              <div className="ir-integrity-rows">
                {INTEGRITY_MILESTONES.map((item, i) => (
                  <StaggerFadeUp key={item.title} index={i} staggerMs={80} threshold={IO}>
                    <div className={`ir-integrity-row ir-integrity-row--${item.variant}`}>
                      <span className={`ir-icon-circle ir-icon-circle--${item.variant} ir-icon-circle--sm`}>
                        <IntegrityIcon type={item.icon} />
                      </span>
                      <div>
                        <p className="ir-integrity-title">{item.title}</p>
                        <p className="ir-integrity-detail">{item.detail}</p>
                      </div>
                    </div>
                  </StaggerFadeUp>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="ir-section ir-section--beige">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              Milestones &amp; <span className="ir-section-accent">Progress</span>
            </h2>
            <p className="ir-section-sub">
              Operational proof points, not aspirations.
            </p>
            <p className="ir-section-copy">
              These milestones are operational proof points showing execution across
              product, AI, expansion, and partnerships, not aspirations alone.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="ir-banner-wrap">
            <div className="ir-banner ir-banner--milestones">
              <BrandBannerImage src={IR_IMAGES.milestones} alt="AI and partnership milestones" />
              <div className="ir-banner-overlay ir-banner-overlay--forest" aria-hidden />
              <p className="ir-banner-quote ir-banner-quote--sm">
                Execution across product, AI, and partnerships.
              </p>
            </div>
          </FadeUp>
          <div className="ir-milestone-wrap">
            <MilestoneTrack />
            <div className="ir-milestone-grid">
              {PROGRESS_MILESTONES.map((item, i) => (
                <StaggerFadeUp key={item.label} index={i} staggerMs={120} threshold={IO}>
                  <div className="ir-milestone-card">
                    <div className="ir-milestone-badge">
                      <span className="ir-milestone-num">{item.number}</span>
                      <MilestoneIcon type={item.icon} />
                    </div>
                    <h3 className="ir-milestone-title">{item.label}</h3>
                    <p className="ir-milestone-body">{item.detail}</p>
                    <span className={`ir-milestone-pill ir-milestone-pill--${item.pillVariant}`}>
                      {item.pill}
                    </span>
                  </div>
                </StaggerFadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="ir-stats-band" aria-label="Trust and growth metrics">
        <div
          className="ir-stats-bg"
          style={{ backgroundImage: `url(${IR_UNSPLASH.statsBg})` }}
          aria-hidden
        />
        <div className="ir-stats-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-stats-title">Trust and Growth</h2>
          </FadeUp>
          <div className="ir-stats-grid">
            {STATS_BAND.map((stat, i) => (
              <div key={stat.label} className="ir-stat-item">
                {i > 0 ? <span className="ir-stat-sep" aria-hidden /> : null}
                <StatsCountUp
                  value={stat.value}
                  prefix={"prefix" in stat ? stat.prefix : ""}
                  suffix={stat.suffix}
                  className="ir-stat-value"
                />
                <p className="ir-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Reports */}
      <section id="financial-reports" className="ir-section ir-section--white">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              Financial Reports <span className="ir-section-accent">&amp; Decks</span>
            </h2>
            <p className="ir-section-sub">
              Investors can review official materials here to support due diligence,
              including the latest earnings update, investor deck, and annual report.
            </p>
            <p className="ir-section-copy">
              The Q4 2025 earnings report is now available alongside presentation materials
              summarising performance, strategy, and trust-economy positioning.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="ir-banner-wrap">
            <div className="ir-banner ir-banner--reports">
              <BrandBannerImage src={IR_IMAGES.reports} alt="Sunset Beach financial reports" />
              <div className="ir-banner-overlay ir-banner-overlay--forest" aria-hidden />
              <div className="ir-banner-quote">
                <p>Q4 2025 Earnings Report Now Available</p>
                <p className="ir-banner-quote-accent">Download or request regional access →</p>
              </div>
            </div>
          </FadeUp>
          <div className="ir-reports-grid">
            <FadeUp threshold={IO}>
              <div className="ir-report-card ir-report-card--teal">
                <span className="ir-icon-circle ir-icon-circle--teal ir-icon-circle--lg">
                  <Presentation className="h-6 w-6 text-white" aria-hidden />
                </span>
                <h3 className="ir-report-title">Investor Deck</h3>
                <p className="ir-report-body">
                  Performance, strategy, and trust-economy positioning.
                </p>
                <button type="button" className="ir-report-btn ir-report-btn--teal">
                  Download Investor Deck →
                </button>
              </div>
            </FadeUp>
            <FadeUp threshold={IO}>
              <div className="ir-report-card ir-report-card--forest">
                <span className="ir-icon-circle ir-icon-circle--forest ir-icon-circle--lg">
                  <BookOpen className="h-6 w-6 text-white" aria-hidden />
                </span>
                <h3 className="ir-report-title">Annual Report</h3>
                <p className="ir-report-body">Comprehensive annual performance summary.</p>
                <button type="button" className="ir-report-btn ir-report-btn--forest">
                  View Annual Report →
                </button>
              </div>
            </FadeUp>
            <FadeUp threshold={IO}>
              <div className="ir-report-card ir-report-card--teal ir-report-card--new">
                <span className="ir-report-new">NEW</span>
                <span className="ir-icon-circle ir-icon-circle--teal ir-icon-circle--lg">
                  <BarChart2 className="h-6 w-6 text-white" aria-hidden />
                </span>
                <h3 className="ir-report-title">Q4 2025 Earnings</h3>
                <p className="ir-report-body">Latest earnings update now available.</p>
                <Link href="/investor-relations/contact" className="ir-report-btn ir-report-btn--teal">
                  Request Access →
                </Link>
              </div>
            </FadeUp>
          </div>
          <p className="ir-reports-note">
            Q4 2025 report available. Request access via{" "}
            <Link href="/investor-relations/contact" className="ir-text-link">
              investor relations contact
            </Link>{" "}
            if materials are not yet published to your region.
          </p>
        </div>
      </section>

      {/* Get in Touch */}
      <section className="ir-section ir-section--beige">
        <div className="ir-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="ir-section-title">
              Get in <span className="ir-section-accent">Touch</span>
            </h2>
          </FadeUp>
          <div className="ir-split">
            <FadeUp threshold={IO} className="ir-split-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IR_UNSPLASH.contact}
                alt=""
                className="ir-split-main-img"
                loading="lazy"
                decoding="async"
              />
            </FadeUp>
            <FadeUp threshold={IO} className="ir-split-copy ir-contact-copy">
              <p className="ir-lead">
                Contact our investor relations team to learn more about Tellacity&apos;s
                performance, roadmap, and growth strategy.
              </p>
              <p className="ir-lead">
                Our team can help with earnings materials, strategic updates, partnership
                discussions, and scheduling management or analyst conversations.
              </p>
              <div className="ir-contact-rows">
                {CONTACT_TOPICS.map((row) => (
                  <div key={row.label} className="ir-contact-row">
                    <span className={`ir-icon-circle ir-icon-circle--${row.variant} ir-icon-circle--sm`}>
                      <ContactIcon type={row.icon} />
                    </span>
                    <div>
                      <p className="ir-contact-label">{row.label}</p>
                      <p className="ir-contact-desc">{row.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/investor-relations/contact" className="ir-contact-cta">
                Email Investor Relations →
              </Link>
              <p className="ir-contact-footnote">
                For general enquiries outside investor relations, see{" "}
                <Link href="/contact" className="ir-text-link">
                  contact →
                </Link>
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ir-final-cta" aria-labelledby="ir-final-title">
        <div className="ir-section-inner ir-final-inner">
          <FadeUp threshold={IO}>
            <span className="ir-final-badge">INVESTOR RELATIONS</span>
            <h2 id="ir-final-title" className="ir-final-title">
              <span>Join Us in Building</span>
              <span className="ir-final-accent">the Trust Economy</span>
            </h2>
            <p className="ir-final-sub">
              Tellacity&apos;s investor story is closely tied to our{" "}
              <Link href="/for-business" className="ir-inline-link">
                trust infrastructure
              </Link>{" "}
              and{" "}
              <Link href="/for-business" className="ir-inline-link">
                business platform
              </Link>
              .
            </p>
            <div className="ir-final-btns">
              <a href="#financial-reports" className="ir-btn-primary">
                Download Investor Deck
              </a>
              <Link href="/investor-relations/contact" className="ir-btn-outline">
                Email Investor Relations →
              </Link>
            </div>
            <p className="ir-final-footnote">
              For general enquiries see{" "}
              <Link href="/contact" className="ir-inline-link">
                contact →
              </Link>
            </p>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}

function ThemeIcon({ type }: { type: (typeof KEY_THEMES)[number]["icon"] }) {
  const cls = "h-4 w-4 text-white";
  switch (type) {
    case "barChart":
      return <BarChart2 className={cls} aria-hidden />;
    case "globe":
      return <Globe className={cls} aria-hidden />;
    case "refresh":
      return <RefreshCw className={cls} aria-hidden />;
    case "shield":
      return <Shield className={cls} aria-hidden />;
    default:
      return <Layers className={cls} aria-hidden />;
  }
}

function TrustGapIcon({
  type,
  accent,
}: {
  type: (typeof TRUST_GAP_CARDS)[number]["icon"];
  accent: (typeof TRUST_GAP_CARDS)[number]["accent"];
}) {
  const cls = "ir-trust-icon";
  if (type === "trendingDown")
    return <TrendingDown className={`${cls} ir-trust-icon--red`} aria-hidden />;
  if (type === "alert")
    return <AlertOctagon className={`${cls} ir-trust-icon--amber`} aria-hidden />;
  return <TrendingUp className={`${cls} ir-trust-icon--teal`} aria-hidden />;
}

function WhyIcon({ type }: { type: (typeof INVESTMENT_REASONS)[number]["icon"] }) {
  const cls = "h-5 w-5 text-white";
  switch (type) {
    case "lock":
      return <Lock className={cls} aria-hidden />;
    case "trendingUp":
      return <TrendingUp className={cls} aria-hidden />;
    case "shield":
      return <Shield className={cls} aria-hidden />;
    case "network":
      return <Network className={cls} aria-hidden />;
    case "globe":
      return <Globe className={cls} aria-hidden />;
    default:
      return <BadgeCheck className={cls} aria-hidden />;
  }
}

function IntegrityIcon({ type }: { type: (typeof INTEGRITY_MILESTONES)[number]["icon"] }) {
  const cls = "h-4 w-4 text-white";
  switch (type) {
    case "bot":
      return <Bot className={cls} aria-hidden />;
    case "globe":
      return <Globe className={cls} aria-hidden />;
    case "handshake":
      return <Handshake className={cls} aria-hidden />;
    default:
      return <CheckCircle className={cls} aria-hidden />;
  }
}

function MilestoneIcon({ type }: { type: (typeof PROGRESS_MILESTONES)[number]["icon"] }) {
  const cls = "h-6 w-6 text-white";
  switch (type) {
    case "bot":
      return <Bot className={cls} aria-hidden />;
    case "globe":
      return <Globe className={cls} aria-hidden />;
    case "handshake":
      return <Handshake className={cls} aria-hidden />;
    default:
      return <Cpu className={cls} aria-hidden />;
  }
}

function ContactIcon({ type }: { type: (typeof CONTACT_TOPICS)[number]["icon"] }) {
  const cls = "h-4 w-4 text-white";
  switch (type) {
    case "trendingUp":
      return <TrendingUp className={cls} aria-hidden />;
    case "handshake":
      return <Handshake className={cls} aria-hidden />;
    case "calendar":
      return <Calendar className={cls} aria-hidden />;
    default:
      return <FileText className={cls} aria-hidden />;
  }
}
