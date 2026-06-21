"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart2,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  EyeOff,
  GitBranch,
  Headphones,
  Link2,
  Mail,
  Megaphone,
  PieChart,
  RefreshCw,
  Receipt,
  Send,
  Shield,
  ShieldAlert,
  Star,
  Target,
  Upload,
  Users,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  FAQ,
  FEATURE_ICON_CONFIG,
  FEATURES_SECTION,
  FINAL_CTA,
  HERO,
  PROBLEM,
  PROBLEM_ICON_CONFIG,
  RELATED,
  RELATED_CARD_IMAGES,
  RI_IMAGES,
  SOLUTION,
  TEAM_CARD_LINKS,
  TEAMS,
  TRUST_STATS,
  VERIFIED_TRUST,
  WORKFLOW,
  OUTCOMES,
  type FeatureIconKey,
} from "./reviewInvitationsData";

const IO = 0.12;

const PROBLEM_ICONS: LucideIcon[] = [
  VolumeX,
  AlertTriangle,
  ShieldAlert,
  Clock,
  EyeOff,
  GitBranch,
];

function ProblemIcon({ index }: { index: number }) {
  const cls = "h-5 w-5";
  const variant = PROBLEM_ICON_CONFIG[index]?.variant ?? "amber";
  const circle =
    variant === "amber"
      ? "ri-icon-circle--amber"
      : variant === "orange"
        ? "ri-icon-circle--orange"
        : "ri-icon-circle--red";
  const Icon = PROBLEM_ICONS[index] ?? VolumeX;
  return (
    <span className={`ri-icon-circle ${circle}`}>
      <Icon className={cls} aria-hidden />
    </span>
  );
}

function FeatureIconEl({ type, accent }: { type: FeatureIconKey; accent: "teal" | "forest" }) {
  const cls = "h-4 w-4";
  const map: Record<FeatureIconKey, LucideIcon> = {
    mail: Mail,
    link: Link2,
    refresh: RefreshCw,
    receipt: Receipt,
    barChart: BarChart2,
    shield: Shield,
    building: Building2,
    upload: Upload,
    pieChart: PieChart,
    users: Users,
    clock: Clock,
    send: Send,
  };
  const Icon = map[type];
  return (
    <span
      className={`ri-icon-circle ri-icon-circle--sm ${accent === "teal" ? "ri-icon-circle--teal" : "ri-icon-circle--forest"}`}
    >
      <Icon className={cls} aria-hidden />
    </span>
  );
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplay(value);
      setDone(true);
      return;
    }

    const target = parseFloat(match[1]!);
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
          const current = Math.round(target * eased);
          setDisplay(`${current}${suffix}`);
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
    <div ref={ref} className="ri-stat">
      <div className="ri-stat-value">{display}</div>
      <div className="ri-stat-label">{label}</div>
    </div>
  );
}

function InviteHeroMock() {
  return (
    <div className="ri-invite-mock" aria-hidden>
      <div className="ri-invite-mock-toolbar">
        <span className="ri-invite-mock-dot" />
        <span className="ri-invite-mock-dot" />
        <span className="ri-invite-mock-dot" />
        <span>Review invitation</span>
      </div>
      <div className="ri-invite-mock-body">
        <div className="ri-invite-mock-brand">
          <span className="ri-invite-mock-logo">T</span>
          <div>
            <strong>Your Store</strong>
            <p>via Tellacity</p>
          </div>
        </div>
        <h3>How was your experience?</h3>
        <p className="ri-invite-mock-copy">
          Thanks for choosing us. Share a verified review in under a minute.
        </p>
        <p className="ri-invite-mock-stars" aria-hidden>
          ★ ★ ★ ★ ★
        </p>
        <span className="ri-invite-mock-btn">Leave a verified review</span>
      </div>
    </div>
  );
}

export default function ReviewInvitationsClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="ri-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero, command-center layout */}
      <section className="ri-hero ri-hero--command" aria-labelledby="ri-hero-title">
        <HeroStarField />
        <div className="ri-hero-mesh" aria-hidden />
        <div className="ri-hero-grid-lines" aria-hidden />
        <div className="ri-hero-aurora ri-hero-aurora--teal" aria-hidden />
        <div className="ri-hero-aurora ri-hero-aurora--mint" aria-hidden />
        <div className="ri-hero-inner">
          <div className="ri-hero-layout">
            <div className="ri-hero-panel">
              <Link href={HERO.breadcrumb.href} className="ri-hero-breadcrumb">
                {HERO.breadcrumb.label}
                <span className="ri-hero-breadcrumb-arrow" aria-hidden>
                  →
                </span>
              </Link>
              <span className="ri-hero-badge">{HERO.kicker}</span>
              <h1 id="ri-hero-title" className="ri-hero-title">
                <span className="ri-hero-title-line">{HERO.headline.lead}</span>
                <span className="ri-hero-title-accent">{HERO.headline.accent}</span>
              </h1>
              <div className="ri-hero-sub">
                {HERO.valuePropParagraphs.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
              <div className="ri-hero-ctas">
                <Link href={HERO.primaryCta.href} className="ri-btn-primary">
                  {HERO.primaryCta.label}
                </Link>
                <Link href={HERO.secondaryCta.href} className="ri-btn-outline-white">
                  {HERO.secondaryCta.label} →
                </Link>
              </div>
              <div className="ri-hero-trust">
                {HERO.trustStrip.map((item) => (
                  <span key={item} className="ri-hero-trust-pill">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="ri-hero-stage">
              <div className="ri-hero-stage-glow" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RI_IMAGES.heroMain}
                alt=""
                className="ri-hero-ambient-img"
                loading="eager"
                decoding="async"
              />
              <InviteHeroMock />
              <div className="ri-hero-float ri-hero-float--sent" aria-hidden>
                <div className="ri-hero-float-title">
                  <CheckCircle2 className="h-4 w-4 text-[#00B4A6]" aria-hidden />
                  Review sent!
                </div>
                <p className="ri-hero-float-meta">Verified · Just now</p>
                <p className="ri-hero-float-stars">★★★★★</p>
              </div>
              <div className="ri-hero-float ri-hero-float--stats" aria-hidden>
                <p className="ri-hero-float-stat">+47 reviews</p>
                <p className="ri-hero-float-stat-sub">This month</p>
              </div>
            </div>
          </div>
        </div>
        <div className="ri-hero-wave" aria-hidden />
      </section>

      {/* 2. Challenge */}
      <FadeUp threshold={IO}>
        <section className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{PROBLEM.title.lead} </span>
            <span className="ri-section-accent">{PROBLEM.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{PROBLEM.description}</p>
          <div className="ri-challenge-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RI_IMAGES.challenge} alt="" loading="lazy" decoding="async" />
            <div className="ri-challenge-banner-overlay" aria-hidden />
            <p className="ri-challenge-banner-quote">{PROBLEM.bannerQuote}</p>
          </div>
          <div className="ri-problem-grid">
            {PROBLEM.items.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <article className="ri-problem-card">
                  <div className="ri-problem-card-top">
                    <ProblemIcon index={index} />
                    <span className="ri-problem-arrow" aria-hidden>
                      →
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </section>
      </FadeUp>

      {/* 3. Solution */}
      <FadeUp threshold={IO} className="ri-solution">
        <div className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{SOLUTION.title.lead} </span>
            <span className="ri-section-accent">{SOLUTION.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{SOLUTION.description}</p>
          <div className="ri-solution-grid">
            <div className="ri-solution-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RI_IMAGES.solutionMain}
                alt="Customer receiving a branded review invitation email"
                className="ri-solution-main"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RI_IMAGES.solutionMobile}
                alt="Mobile-friendly Tellacity review form"
                className="ri-solution-secondary"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="ri-solution-list">
              {SOLUTION.bullets.map((bullet) => (
                <div key={bullet} className="ri-solution-row">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  <p>{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. Workflow */}
      <section className="ri-workflow" aria-labelledby="ri-workflow-title">
        <div className="ri-workflow-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RI_IMAGES.workflowBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="ri-workflow-inner ri-section-inner">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00B4A6]">
            {WORKFLOW.kicker}
          </p>
          <h2 id="ri-workflow-title" className="ri-section-title">
            <span>{WORKFLOW.title.lead} </span>
            <span className="ri-section-accent">{WORKFLOW.title.accent}</span>
          </h2>
          <p className="ri-workflow-sub">{WORKFLOW.description}</p>
          <div className="ri-workflow-grid">
            {WORKFLOW.steps.map((step, index) => (
              <StaggerFadeUp key={step.title} index={index} staggerMs={80} threshold={IO}>
                <article className="ri-workflow-card">
                  <div className="ri-workflow-step-head">
                    <span className="ri-workflow-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ri-workflow-emoji" aria-hidden>
                      {step.icon}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* 5. Dashboard features */}
      <FadeUp threshold={IO}>
        <section className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{FEATURES_SECTION.title.lead} </span>
            <span className="ri-section-accent">{FEATURES_SECTION.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{FEATURES_SECTION.description}</p>
          <div className="ri-features-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RI_IMAGES.features} alt="" loading="lazy" decoding="async" />
            <div className="ri-features-banner-overlay" aria-hidden />
            <div className="ri-features-banner-text">
              <h3>{FEATURES_SECTION.banner.lead}</h3>
              <p>{FEATURES_SECTION.banner.sub}</p>
            </div>
          </div>
          <div className="ri-features-grid">
            {FEATURES_SECTION.items.map((feature, index) => {
              const cfg = FEATURE_ICON_CONFIG[index]!;
              const inner = (
                <>
                  <span aria-hidden>{feature.badge}</span>
                  <FeatureIconEl type={cfg.icon} accent={cfg.accent} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="ri-feature-card-footer" aria-hidden>
                    →
                  </span>
                </>
              );
              return (
                <StaggerFadeUp key={feature.title} index={index} staggerMs={50} threshold={IO}>
                  {cfg.href ? (
                    <Link href={cfg.href} className="ri-feature-card">
                      {inner}
                    </Link>
                  ) : (
                    <article className="ri-feature-card">{inner}</article>
                  )}
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 6. Verified trust */}
      <FadeUp threshold={IO} className="ri-trust-split">
        <div className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{VERIFIED_TRUST.title.lead} </span>
            <span className="ri-section-accent">{VERIFIED_TRUST.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{VERIFIED_TRUST.description}</p>
          <div className="ri-trust-grid">
            <ul className="ri-trust-bullets">
              {VERIFIED_TRUST.bullets.map((bullet) => (
                <li key={bullet}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="ri-trust-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RI_IMAGES.trustTop}
                alt="Customer with receipt and phone for verified review proof"
                className="ri-trust-img-top"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RI_IMAGES.trustBottom}
                alt="Star rating representing verified customer reviews"
                className="ri-trust-img-bottom"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 7. Stats */}
      <section className="ri-stats" aria-labelledby="ri-stats-title">
        <h2 id="ri-stats-title" className="ri-stats-title">
          {TRUST_STATS.title}
        </h2>
        <div className="ri-stats-row">
          {TRUST_STATS.stats.map((stat) => (
            <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      {/* 8. Teams */}
      <FadeUp threshold={IO}>
        <section className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">Designed for modern </span>
            <span className="ri-section-accent">teams</span>
          </h2>
          <p className="ri-section-sub">{TEAMS.description}</p>
          <div className="ri-teams-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RI_IMAGES.teams} alt="" loading="lazy" decoding="async" />
            <div className="ri-teams-banner-overlay" aria-hidden />
          </div>
          <div className="ri-teams-grid">
            {TEAMS.audiences.map((team, index) => {
              const link = TEAM_CARD_LINKS[index]!;
              const isForest = index % 2 === 1;
              return (
                <StaggerFadeUp key={team.audience} index={index} staggerMs={70} threshold={IO}>
                  <article
                    className={`ri-team-card${isForest ? " ri-team-card--forest" : ""}`}
                  >
                    <span
                      className={`ri-icon-circle ri-icon-circle--sm mt-1 ${isForest ? "ri-icon-circle--forest" : "ri-icon-circle--teal"}`}
                    >
                      {index === 0 ? (
                        <Megaphone className="h-4 w-4" aria-hidden />
                      ) : index === 1 ? (
                        <Headphones className="h-4 w-4" aria-hidden />
                      ) : index === 2 ? (
                        <Building2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Target className="h-4 w-4" aria-hidden />
                      )}
                    </span>
                    <span className="ri-team-emoji" aria-hidden>
                      {team.icon}
                    </span>
                    <h3>{team.audience}</h3>
                    <p>{team.value}</p>
                    <Link
                      href={link.href}
                      className={
                        isForest ? "ri-inline-link ri-inline-link--forest" : "ri-inline-link"
                      }
                    >
                      → {link.label}
                    </Link>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 9. Outcomes */}
      <FadeUp threshold={IO} className="ri-outcomes">
        <div className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{OUTCOMES.title.lead}: </span>
            <span className="ri-section-accent">{OUTCOMES.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{OUTCOMES.description}</p>
          <div className="ri-outcomes-grid">
            {OUTCOMES.items.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <article className="ri-outcome-card">
                  <span aria-hidden>{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="ri-feature-card-footer" aria-hidden>
                    →
                  </span>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 10. FAQ */}
      <FadeUp threshold={IO}>
        <section className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-dark">{FAQ.title.lead} </span>
            <span className="ri-section-accent">{FAQ.title.accent}</span>
          </h2>
          <p className="ri-section-sub">{FAQ.description}</p>
          <div className="ri-faq-list">
            {FAQ.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.question} className={`ri-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="ri-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.question}
                    <ChevronDown className="ri-faq-chevron h-5 w-5" aria-hidden />
                  </button>
                  <div className="ri-faq-panel">
                    <div className="ri-faq-panel-inner">
                      <p className="ri-faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 11. Related */}
      <FadeUp threshold={IO} className="ri-related">
        <div className="ri-section-inner">
          <h2 className="ri-section-title ri-header-center">
            <span className="ri-section-accent">{RELATED.title.lead} </span>
            <span className="ri-section-dark">{RELATED.title.accent}</span>
          </h2>
          <div className="ri-related-grid">
            {RELATED.items.map((item, index) => (
              <StaggerFadeUp key={item.href} index={index} staggerMs={70} threshold={IO}>
                <Link href={item.href} className="ri-related-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RELATED_CARD_IMAGES[item.title] ?? RI_IMAGES.relatedWidgets}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="ri-related-body">
                    <Star className="h-4 w-4 text-[#00B4A6]" aria-hidden />
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span className="ri-related-link">Learn more →</span>
                  </div>
                </Link>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 12. Final CTA */}
      <section className="ri-final" aria-labelledby="ri-final-title">
        <h2 id="ri-final-title">{FINAL_CTA.title}</h2>
        <p>{FINAL_CTA.description}</p>
        <div className="ri-final-ctas">
          <Link href={FINAL_CTA.primaryCta.href} className="ri-btn-primary">
            {FINAL_CTA.primaryCta.label}
          </Link>
          <Link href={FINAL_CTA.secondaryCta.href} className="ri-btn-outline-white">
            {FINAL_CTA.secondaryCta.label}
          </Link>
          <Link href={FINAL_CTA.dashboardCta.href} className="ri-text-link">
            {FINAL_CTA.dashboardCta.label} →
          </Link>
        </div>
        <p className="ri-final-footnote">✓ {FINAL_CTA.footnote.replace(/ · /g, "  ✓ ")}</p>
      </section>
    </main>
  );
}
