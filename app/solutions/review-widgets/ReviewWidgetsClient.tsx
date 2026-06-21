"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  Archive,
  BarChart2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardX,
  CreditCard,
  EyeOff,
  Filter,
  Gauge,
  Globe,
  LayoutGrid,
  Megaphone,
  Package,
  Paintbrush,
  PanelRight,
  Palette,
  Plug,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  CONTROL_PLANE,
  FAQ,
  FEATURE_ICON_CONFIG,
  FEATURES_SECTION,
  FINAL_CTA,
  HERO,
  OUTCOMES,
  PLATFORMS,
  PROBLEM,
  PROBLEM_BORDER,
  RELATED,
  RELATED_IMAGES,
  RW_IMAGES,
  SOLUTION,
  TRUST_STATS,
  VERIFIED_TRUST,
  WORKFLOW,
  type FeatureIconKey,
} from "./reviewWidgetsData";

const IO = 0.12;

const PROBLEM_ICONS: LucideIcon[] = [
  EyeOff,
  ClipboardX,
  Paintbrush,
  ShoppingCart,
  Archive,
  Puzzle,
  Gauge,
];

const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  star: Star,
  layout: LayoutGrid,
  panel: PanelRight,
  palette: Palette,
  zap: Zap,
  plug: Plug,
  globe: Globe,
  package: Package,
  barChart: BarChart2,
  accessibility: Accessibility,
  refresh: RefreshCw,
  settings: Settings,
  filter: Filter,
};

function WidgetMock({ large = false }: { large?: boolean }) {
  return (
    <div className={`rw-widget-mock${large ? " rw-widget-mock--large" : ""}`}>
      <div className="rw-widget-mock-bar">
        <span>tellacity.com/your-store</span>
        <span className="rw-widget-live">
          <span className="rw-widget-live-dot" aria-hidden />
          Live
        </span>
      </div>
      <h3>Customer Reviews</h3>
      <p className="rw-widget-score">
        4.8 <span>★★★★★</span>
      </p>
      <p className="rw-widget-meta">4.8 / 5 · 12,408 verified reviews</p>
      <div className="rw-widget-review">
        <div className="rw-widget-review-head">
          <span className="rw-widget-avatar rw-widget-avatar--teal">SK</span>
          <div>
            <strong>
              Sarah K.
              <span className="rw-widget-verified">✓ Verified</span>
            </strong>
            <p className="rw-widget-stars">★★★★★</p>
          </div>
        </div>
        <p className="rw-widget-body">
          Fast shipping, exactly as described. Will buy again.
        </p>
      </div>
      <div className="rw-widget-review">
        <div className="rw-widget-review-head">
          <span className="rw-widget-avatar rw-widget-avatar--forest">DR</span>
          <div>
            <strong>
              Daniel R.
              <span className="rw-widget-verified">✓ Verified</span>
            </strong>
            <p className="rw-widget-stars">★★★★★</p>
          </div>
        </div>
        <p className="rw-widget-body">
          Great quality and easy returns. Support replied within an hour.
        </p>
      </div>
      <div className="rw-widget-foot">
        <span>Powered by Tellacity</span>
        <span className="rw-inline-link">View all →</span>
      </div>
    </div>
  );
}

function FeatureIconEl({ type, accent }: { type: FeatureIconKey; accent: "teal" | "forest" }) {
  const Icon = FEATURE_ICONS[type];
  return (
    <span
      className={`rw-icon-circle rw-icon-circle--sm ${accent === "teal" ? "rw-icon-circle--teal" : "rw-icon-circle--forest"}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

function AnimatedStat({
  value,
  label,
  variant,
}: {
  value: string;
  label: string;
  variant: "teal" | "forest";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const target = parseFloat(match[1]);
    if (Number.isNaN(target)) return;
    const suffix = match[2] ?? "";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || done) return;
        setDone(true);
        const start = performance.now();
        const duration = 1200;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 3;
          setDisplay(`${Math.round(target * eased)}${suffix}`);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: IO }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, done]);

  return (
    <div ref={ref} className="text-center">
      <div
        className={`rw-stat-value ${variant === "teal" ? "rw-stat-value--teal" : "rw-stat-value--forest"}`}
      >
        {display}
      </div>
      <div className="rw-stat-label">{label}</div>
    </div>
  );
}

function HorizontalProblemScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft };
    el.classList.add("is-dragging");
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active || !scrollRef.current) return;
    const dx = e.clientX - drag.current.startX;
    scrollRef.current.scrollLeft = drag.current.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    drag.current.active = false;
    scrollRef.current?.classList.remove("is-dragging");
    try {
      scrollRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rw-scroll-wrap">
      <div
        ref={scrollRef}
        className="rw-scroll-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {PROBLEM.items.map((item, index) => {
          const border = PROBLEM_BORDER[index] ?? "teal";
          const Icon = PROBLEM_ICONS[index] ?? EyeOff;
          const circle =
            border === "teal"
              ? "rw-icon-circle--teal"
              : border === "amber"
                ? "rw-icon-circle--amber"
                : "rw-icon-circle--red";
          return (
            <article
              key={item.title}
              className={`rw-scroll-card rw-scroll-card--${border}`}
            >
              <span className={`rw-icon-circle ${circle}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-[15px] font-bold">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-snug text-gray-500">{item.description}</p>
            </article>
          );
        })}
      </div>
      <div className="rw-scroll-arrows">
        <button type="button" className="rw-scroll-arrow" onClick={() => scrollBy(-1)} aria-label="Scroll left">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" className="rw-scroll-arrow" onClick={() => scrollBy(1)} aria-label="Scroll right">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TimelineSection() {
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineOn, setLineOn] = useState(false);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLineOn(true);
          observer.disconnect();
        }
      },
      { threshold: IO }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="rw-timeline-section">
      <div className="rw-section-inner">
        <p className="text-xs font-bold uppercase tracking-widest text-[#00B4A6]">
          {WORKFLOW.kicker}
        </p>
        <h2 className="rw-section-title">
          <span className="rw-section-accent">{WORKFLOW.title.lead} </span>
          <span className="rw-section-dark">{WORKFLOW.title.accent}</span>
        </h2>
        <p className="rw-section-sub">{WORKFLOW.description}</p>
        <div ref={lineRef} className="rw-timeline-track">
          <div className="rw-timeline-line-bg" aria-hidden />
          <div className={`rw-timeline-line-fill${lineOn ? " is-visible" : ""}`} aria-hidden />
          <div className="rw-timeline-steps">
            {WORKFLOW.steps.map((step, index) => {
              const isAbove = index % 2 === 0;
              const isForest = index % 2 === 1;
              return (
                <div
                  key={step.title}
                  className={`rw-timeline-step ${isAbove ? "rw-timeline-step--above" : "rw-timeline-step--below"}`}
                >
                  {isAbove ? (
                    <div className="rw-timeline-card">
                      <span className="rw-timeline-emoji" aria-hidden>
                        {step.icon}
                      </span>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  ) : null}
                  <span
                    className={`rw-timeline-node${isForest ? " rw-timeline-node--forest" : ""}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {!isAbove ? (
                    <div className="rw-timeline-card">
                      <span className="rw-timeline-emoji" aria-hidden>
                        {step.icon}
                      </span>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rw-timeline-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RW_IMAGES.timelineDevices} alt="" loading="lazy" decoding="async" />
          <div className="rw-timeline-banner-overlay">
            <p>{WORKFLOW.bannerQuote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function splitBullet(text: string): { title: string; body: string } {
  const idx = text.indexOf(":");
  if (idx === -1) return { title: text, body: "" };
  return {
    title: text.slice(0, idx + 1).trim(),
    body: text.slice(idx + 1).trim(),
  };
}

export default function ReviewWidgetsClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqLeft = FAQ.items.slice(0, 8);
  const faqRight = FAQ.items.slice(8);

  const renderFaqColumn = (
    items: readonly (typeof FAQ.items)[number][],
    offset: number
  ) =>
    items.map((item, i) => {
      const index = offset + i;
      const isOpen = openFaq === index;
      return (
        <div key={item.question} className={`rw-faq-item${isOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="rw-faq-trigger"
            aria-expanded={isOpen}
            onClick={() => setOpenFaq(isOpen ? null : index)}
          >
            {item.question}
            <ChevronDown className="rw-faq-chevron h-5 w-5" aria-hidden />
          </button>
          <div className="rw-faq-panel">
            <div className="rw-faq-panel-inner">
              <p className="rw-faq-answer">{item.answer}</p>
            </div>
          </div>
        </div>
      );
    });

  return (
    <main className="rw-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="rw-hero" aria-labelledby="rw-hero-title">
        <div className="rw-hero-split">
          <div className="rw-hero-left">
            <Link href={HERO.breadcrumb.href} className="rw-hero-breadcrumb">
              {HERO.breadcrumb.label}
              <span aria-hidden> →</span>
            </Link>
            <span className="rw-hero-badge">{HERO.kicker}</span>
            <h1 id="rw-hero-title">
              <span className="rw-hero-title-lead">{HERO.headline.lead}</span>
              <span className="rw-hero-title-accent">{HERO.headline.accent}</span>
            </h1>
            <div className="rw-hero-sub">
              {HERO.valuePropParagraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <div className="rw-hero-ctas">
              <Link href={HERO.primaryCta.href} className="rw-btn-forest">
                {HERO.primaryCta.label}
              </Link>
              <Link href={HERO.secondaryCta.href} className="rw-btn-outline-teal">
                {HERO.secondaryCta.label} →
              </Link>
            </div>
            <div className="rw-hero-pills">
              {HERO.trustStrip.map((pill) => (
                <span key={pill} className="rw-hero-pill">
                  <span className="rw-hero-pill-dot" aria-hidden />
                  ✓ {pill}
                </span>
              ))}
            </div>
          </div>
          <div className="rw-hero-right">
            <WidgetMock />
          </div>
        </div>
      </section>

      {/* 2. Challenge scroll */}
      <section className="rw-challenge" aria-labelledby="rw-problem-title">
        <div className="rw-challenge-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RW_IMAGES.challengeBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="rw-challenge-inner rw-section-inner">
          <h2 id="rw-problem-title" className="rw-section-title rw-header-center">
            <span>{PROBLEM.title.lead} </span>
            <span className="rw-section-accent">{PROBLEM.title.accent}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70">
            {PROBLEM.description}
          </p>
          <div className="rw-challenge-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RW_IMAGES.challengeBanner} alt="" loading="lazy" decoding="async" />
            <div className="rw-challenge-banner-overlay" aria-hidden />
            <p className="rw-challenge-banner-quote">{PROBLEM.bannerQuote}</p>
          </div>
          <HorizontalProblemScroll />
        </FadeUp>
      </section>

      {/* 3. Solution */}
      <FadeUp threshold={IO} className="rw-solution">
        <div className="rw-section-inner">
          <h2 className="rw-section-title rw-header-center">
            <span className="rw-section-dark">{SOLUTION.title.lead} </span>
            <span className="rw-section-accent">{SOLUTION.title.accent}</span>
          </h2>
          <p className="rw-section-sub">{SOLUTION.description}</p>
          <div className="rw-solution-grid">
            <div className="rw-solution-list-wrap">
              {SOLUTION.bullets.map((bullet) => {
                const { title, body } = splitBullet(bullet);
                return (
                  <div key={bullet} className="rw-solution-row">
                    <strong>{title}</strong>
                    {body ? <p>{body}</p> : null}
                  </div>
                );
              })}
              <p className="rw-solution-tagline">{SOLUTION.tagline}</p>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RW_IMAGES.solution}
                alt="Laptop showing Tellacity dashboard and widget analytics"
                className="rw-solution-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. Timeline */}
      <FadeUp threshold={IO}>
        <TimelineSection />
      </FadeUp>

      {/* 5. Widget features, split hero + capability grid */}
      <FadeUp threshold={IO} className="rw-features-split">
        <div className="rw-section-inner rw-features-inner">
          <div className="rw-features-hero">
            <div className="rw-features-copy">
              <p className="rw-features-kicker">{FEATURES_SECTION.kicker}</p>
              <h2 className="rw-section-title">
                <span className="rw-section-accent">{FEATURES_SECTION.title.lead} </span>
                <span className="rw-section-dark">{FEATURES_SECTION.title.accent}</span>
              </h2>
              <p className="rw-features-lead">{FEATURES_SECTION.description}</p>
            </div>
            <div className="rw-features-stage" aria-hidden>
              <div className="rw-features-stage-mesh" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RW_IMAGES.featuresSticky}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="rw-features-grid">
            {FEATURES_SECTION.items.map((feature, index) => {
              const cfg = FEATURE_ICON_CONFIG[index]!;
              return (
                <StaggerFadeUp key={feature.title} index={index} staggerMs={40} threshold={IO}>
                  <article className="rw-feature-card">
                    <div className="rw-feature-card-top">
                      <span className="rw-feature-card-badge" aria-hidden>
                        {feature.badge}
                      </span>
                      <FeatureIconEl type={cfg.icon} accent={cfg.accent} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* 6. Verified */}
      <section className="rw-verified" aria-labelledby="rw-verified-title">
        <div className="rw-verified-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RW_IMAGES.verifiedBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="rw-verified-inner">
          <h2 id="rw-verified-title" className="rw-section-title">
            <span>{VERIFIED_TRUST.title.lead} </span>
            <span className="rw-section-accent">{VERIFIED_TRUST.title.accent}</span>
          </h2>
          <p className="rw-verified-desc">{VERIFIED_TRUST.description}</p>
          <div className="rw-verified-mock-wrap">
            <WidgetMock large />
          </div>
          <ul className="rw-verified-grid">
            {VERIFIED_TRUST.bullets.map((bullet) => (
              <li key={bullet} className="rw-verified-benefit">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </FadeUp>
      </section>

      {/* 7. Stats */}
      <section className="rw-stats" aria-label={TRUST_STATS.title}>
        <div className="rw-stats-row">
          {TRUST_STATS.stats.map((stat, index) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              variant={index % 2 === 0 ? "teal" : "forest"}
            />
          ))}
        </div>
      </section>

      {/* 8. Platforms */}
      <FadeUp threshold={IO} className="rw-platforms">
        <div className="rw-section-inner">
          <h2 className="rw-section-title rw-header-center">
            <span className="rw-section-accent">{PLATFORMS.title.lead} </span>
            <span className="rw-section-dark">{PLATFORMS.title.accent}</span>
          </h2>
          <p className="rw-section-sub">{PLATFORMS.description}</p>
          <div className="rw-platforms-grid">
            <div>
              {PLATFORMS.attributes.map((attr) => (
                <div key={attr} className="rw-platform-row">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  <span>{attr}</span>
                </div>
              ))}
              <div className="rw-platform-logos">
                {PLATFORMS.frameworks.map((fw) => (
                  <div key={fw.name} className="rw-platform-logo">
                    <span aria-hidden>{fw.icon}</span>
                    {fw.name}
                  </div>
                ))}
              </div>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RW_IMAGES.tech}
                alt="Developer integrating Tellacity widgets on a laptop"
                className="rw-platform-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 9. Bento control plane */}
      <section className="rw-control" aria-labelledby="rw-control-title">
        <div className="rw-control-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RW_IMAGES.controlBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="rw-control-inner rw-section-inner">
          <h2 id="rw-control-title" className="rw-section-title rw-header-center">
            <span>{CONTROL_PLANE.title.lead} </span>
            <span className="rw-section-accent">{CONTROL_PLANE.title.accent}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70">
            {CONTROL_PLANE.description}
          </p>
          <div className="rw-bento">
            <article className="rw-bento-card rw-bento-card--hero">
              <Settings className="h-10 w-10 text-[#00B4A6]" aria-hidden />
              <h4>{CONTROL_PLANE.capabilities[0]!.title}</h4>
              <p>{CONTROL_PLANE.capabilities[0]!.description}</p>
              <span className="rw-inline-link">→</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RW_IMAGES.bentoStrip}
                alt="Tellacity review dashboard"
                className="rw-bento-strip"
                loading="lazy"
                decoding="async"
              />
            </article>
            <article className="rw-bento-card rw-bento-card--teal">
              <Palette className="h-8 w-8 text-white" aria-hidden />
              <h4>{CONTROL_PLANE.capabilities[1]!.title}</h4>
              <p>{CONTROL_PLANE.capabilities[1]!.description}</p>
            </article>
            {CONTROL_PLANE.capabilities.slice(2, 5).map((cap) => (
              <article key={cap.title} className="rw-bento-card">
                <span className="text-2xl" aria-hidden>
                  {cap.icon}
                </span>
                <h4>{cap.title}</h4>
                <p>{cap.description}</p>
              </article>
            ))}
            <article className="rw-bento-card rw-bento-card--forest">
              <span className="text-2xl" aria-hidden>
                {CONTROL_PLANE.capabilities[5]!.icon}
              </span>
              <h4>{CONTROL_PLANE.capabilities[5]!.title}</h4>
              <p>{CONTROL_PLANE.capabilities[5]!.description}</p>
            </article>
            <article className="rw-bento-card rw-bento-card--wide">
              <span className="text-2xl" aria-hidden>
                {CONTROL_PLANE.capabilities[6]!.icon}
              </span>
              <h4>{CONTROL_PLANE.capabilities[6]!.title}</h4>
              <p>{CONTROL_PLANE.capabilities[6]!.description}</p>
            </article>
          </div>
          <p className="rw-control-tagline">{CONTROL_PLANE.tagline}</p>
        </FadeUp>
      </section>

      {/* 10. Conversion */}
      <FadeUp threshold={IO}>
        <section className="rw-section-inner">
          <h2 className="rw-section-title rw-header-center">
            <span className="rw-section-accent">{OUTCOMES.title.lead}: </span>
            <span className="rw-section-dark">{OUTCOMES.title.accent}</span>
          </h2>
          <p className="rw-section-sub">{OUTCOMES.description}</p>
          <div className="rw-conversion-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RW_IMAGES.conversion} alt="" loading="lazy" decoding="async" />
            <div className="rw-conversion-overlay">
              <p>{OUTCOMES.bannerQuote}</p>
            </div>
          </div>
          <div className="rw-conversion-grid">
            {OUTCOMES.items.map((item, index) => {
              const isForest = index % 2 === 1;
              const icons = [CreditCard, ShoppingCart, Package, TrendingUp, Users, Search];
              const Icon = icons[index] ?? CreditCard;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`rw-conversion-card${isForest ? " rw-conversion-card--forest" : ""}`}
                  >
                    <span className="text-xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span
                      className={`rw-icon-circle rw-icon-circle--sm mt-2 ${isForest ? "rw-icon-circle--forest" : "rw-icon-circle--teal"}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="mt-2 font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 11. FAQ */}
      <FadeUp threshold={IO} className="rw-faq">
        <div className="rw-section-inner">
          <h2 className="rw-section-title rw-header-center">
            <span className="rw-section-dark">{FAQ.title.lead} </span>
            <span className="rw-section-accent">{FAQ.title.accent}</span>
          </h2>
          <p className="rw-section-sub">{FAQ.description}</p>
          <div className="rw-faq-columns">
            <div>{renderFaqColumn(faqLeft, 0)}</div>
            <div>{renderFaqColumn(faqRight, 8)}</div>
          </div>
        </div>
      </FadeUp>

      {/* 12. Related */}
      <FadeUp threshold={IO}>
        <section className="rw-section-inner">
          <h2 className="rw-section-title rw-header-center">
            <span className="rw-section-accent">{RELATED.title.lead} </span>
            <span className="rw-section-dark">{RELATED.title.accent}</span>
          </h2>
          <div className="mt-10">
            {RELATED.items.map((item, index) => {
              const icons = [Megaphone, BarChart2, Shield, Camera];
              const Icon = icons[index] ?? Megaphone;
              const isForest = index === 0 || index === 2;
              return (
                <Link key={item.href} href={item.href} className="rw-related-card">
                  <div className="rw-related-body">
                    <span
                      className={`rw-icon-circle ${isForest ? "rw-icon-circle--forest" : "rw-icon-circle--teal"}`}
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <h3 className="mt-3">{item.title}</h3>
                    <p>{item.description}</p>
                    <span className="rw-related-link">Learn more →</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RELATED_IMAGES[item.title] ?? RW_IMAGES.relatedInvitations}
                    alt=""
                    className="rw-related-img"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 13. Final CTA */}
      <section className="rw-final" aria-labelledby="rw-final-title">
        <div className="rw-final-glow" aria-hidden />
        <div className="rw-final-card">
          <h2 id="rw-final-title">{FINAL_CTA.title}</h2>
          <p>{FINAL_CTA.description}</p>
          <div className="rw-final-ctas">
            <Link href={FINAL_CTA.primaryCta.href} className="rw-btn-teal-fill">
              {FINAL_CTA.primaryCta.label}
            </Link>
            <Link href={FINAL_CTA.secondaryCta.href} className="rw-btn-outline-white">
              {FINAL_CTA.secondaryCta.label}
            </Link>
            <Link href={FINAL_CTA.dashboardCta.href} className="rw-text-link">
              {FINAL_CTA.dashboardCta.label} →
            </Link>
          </div>
          <p className="rw-final-footnote">✓ {FINAL_CTA.footnote.replace(/ · /g, "  ✓ ")}</p>
        </div>
      </section>
    </main>
  );
}
