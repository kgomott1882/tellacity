"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FlaskConical,
  FolderDown,
  FolderOpen,
  GitBranch,
  Headphones,
  HeartPulse,
  HelpCircle,
  Inbox,
  Layout,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  PieChart,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Sliders,
  Star,
  Stethoscope,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  BA_IMAGES,
  DECISION_ICON_CONFIG,
  DECISIONS,
  FAQ,
  FEATURE_ICON_CONFIG,
  FEATURES_SECTION,
  FINAL_CTA,
  HERO,
  MOSAIC_322,
  OUTCOME_ICON_KEYS,
  OUTCOMES,
  PROBLEM,
  PROBLEM_ICON_CONFIG,
  RELATED,
  RELATED_CARD_IMAGES,
  SOURCE_ICON_CONFIG,
  SOURCE_OF_TRUTH,
  SOLUTION,
  TEAM_CARD_LINKS,
  TEAM_TAGS,
  TEAMS,
  TRUST_STATS,
  VERIFIED_TRUST,
  WORKFLOW,
  type FeatureIconKey,
  type OutcomeIconKey,
  type ProblemIconVariant,
  type SourceIconKey,
} from "./businessAnalyticsData";

const IO = 0.12;

const PROBLEM_ICONS: LucideIcon[] = [
  FolderOpen,
  HelpCircle,
  Clock,
  AlertTriangle,
  Compass,
  EyeOff,
  TrendingDown,
];

const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  trendingUp: TrendingUp,
  pieChart: PieChart,
  clock: Clock,
  package: Package,
  gitBranch: GitBranch,
  download: Download,
  building: Building2,
  messageSquare: MessageSquare,
  search: Search,
  users: Users,
  bell: Bell,
  calendar: Calendar,
  filter: Filter,
  folderDown: FolderDown,
};

const SOURCE_ICONS: Record<SourceIconKey, LucideIcon> = {
  database: Database,
  layout: Layout,
  refresh: RefreshCw,
  sliders: Sliders,
  fileText: FileText,
  users: Users,
  target: Target,
};

const DECISION_ICONS: Record<(typeof DECISION_ICON_CONFIG)[number], LucideIcon> = {
  stethoscope: Stethoscope,
  heartPulse: HeartPulse,
  rocket: Rocket,
  building: Building2,
  flask: FlaskConical,
  inbox: Inbox,
  radio: Radio,
};

const OUTCOME_ICONS: Record<OutcomeIconKey, LucideIcon> = {
  shield: Shield,
  eye: Eye,
  radio: Radio,
  alertCircle: AlertCircle,
  inbox: Inbox,
  database: Database,
  compass: Compass,
};

const TEAM_ICONS = [Megaphone, Headphones, Building2, Target, FlaskConical];

function problemCircleClass(variant: ProblemIconVariant) {
  if (variant === "amber") return "ba-icon-circle--amber";
  if (variant === "orange") return "ba-icon-circle--orange";
  if (variant === "red") return "ba-icon-circle--red";
  return "ba-icon-circle--teal";
}

function whyItMatters(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts[parts.length - 1] ?? text;
}

function HeroAnalyticsMock() {
  return (
    <div className="ba-hero-visual">
      <div className="ba-hero-mock" aria-hidden>
        <div className="ba-hero-mock-head">
          <h3>Reputation Overview</h3>
          <span>Last 30 days</span>
        </div>
        <div className="ba-hero-metric-grid">
          <div className="ba-hero-metric-tile">
            <div className="ba-hero-metric-val ba-hero-metric-val--teal">4.7</div>
            <div className="ba-hero-metric-lbl">Trust Score</div>
            <div className="ba-hero-metric-trend">▲ +0.3</div>
          </div>
          <div className="ba-hero-metric-tile">
            <div className="ba-hero-metric-val ba-hero-metric-val--forest">1,284</div>
            <div className="ba-hero-metric-lbl">Verified Reviews</div>
          </div>
          <div className="ba-hero-metric-tile">
            <div className="ba-hero-metric-val ba-hero-metric-val--teal">94%</div>
            <div className="ba-hero-metric-lbl">Response Rate</div>
            <div className="ba-hero-metric-sub">2h 14m avg</div>
          </div>
          <div className="ba-hero-metric-tile">
            <div className="ba-hero-metric-lbl">Sentiment</div>
            <div className="ba-hero-sentiment-stack">
              {[
                { label: "Positive", pct: 78, color: "var(--ba-teal)" },
                { label: "Neutral", pct: 14, color: "#9ca3af" },
                { label: "Negative", pct: 8, color: "#ef4444" },
              ].map((row) => (
                <div key={row.label} className="ba-hero-sentiment-row">
                  <span style={{ width: "3.5rem" }}>{row.label}</span>
                  <div className="ba-hero-sentiment-bar">
                    <div
                      className="ba-hero-sentiment-fill"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ba-hero-mock-progress">
          <label>Verified share: 91%</label>
          <div className="ba-hero-progress-track">
            <div className="ba-hero-progress-fill" style={{ width: "91%" }} />
          </div>
        </div>
        <div className="ba-hero-mock-foot">
          <span className="ba-hero-live-dot" aria-hidden />
          <span style={{ color: "var(--ba-teal)", fontWeight: 600 }}>● Live</span>
          <span>· Updates every minute</span>
        </div>
      </div>
      <div className="ba-hero-alert-badge" aria-hidden>
        <strong>🚨 Alert</strong>
        <p>Trust score ▲ +0.3</p>
        <span>This week</span>
      </div>
    </div>
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
    <div ref={ref} className="ba-stat">
      <div className="ba-stat-value">{display}</div>
      <div className="ba-stat-label">{label}</div>
    </div>
  );
}

function MosaicSection<T extends { title: string; description: string }>({
  items,
  renderCard,
}: {
  items: readonly T[];
  renderCard: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="ba-mosaic-322">
      {MOSAIC_322.map((row) => (
        <div key={row.join("-")} className={`ba-mosaic-row ba-mosaic-row--${row.length}`}>
          {row.map((index) => renderCard(items[index]!, index))}
        </div>
      ))}
    </div>
  );
}

export default function BusinessAnalyticsClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const relatedIcons = { mail: Mail, star: Star, shield: Shield, camera: Camera };

  return (
    <main className="ba-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero — analytics command-center aesthetic */}
      <section className="ba-hero ba-hero--command" aria-labelledby="ba-hero-title">
        <div className="ba-hero-mesh" aria-hidden />
        <div className="ba-hero-grid-lines" aria-hidden />
        <HeroStarField />
        <div className="ba-hero-aurora ba-hero-aurora--teal" aria-hidden />
        <div className="ba-hero-aurora ba-hero-aurora--mint" aria-hidden />
        <div className="ba-hero-photo" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BA_IMAGES.heroAmbient} alt="" loading="eager" decoding="async" />
        </div>
        <div className="ba-hero-photo-glow" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BA_IMAGES.heroGlow} alt="" loading="eager" decoding="async" />
        </div>
        <div className="ba-hero-inner">
          <div className="ba-hero-layout">
            <div className="ba-hero-panel">
              <Link href={HERO.breadcrumb.href} className="ba-hero-breadcrumb">
                {HERO.breadcrumb.label}
                <span className="ba-hero-breadcrumb-arrow" aria-hidden>
                  →
                </span>
              </Link>
              <span className="ba-hero-badge">{HERO.kicker}</span>
              <h1 id="ba-hero-title" className="ba-hero-title">
                <span className="ba-hero-title-line">{HERO.headline.lead}</span>
                <span className="ba-hero-title-accent">{HERO.headline.accent}</span>
              </h1>
              <div className="ba-hero-sub">
                {HERO.valuePropParagraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
              <div className="ba-hero-ctas">
                <Link href={HERO.primaryCta.href} className="ba-btn-primary">
                  {HERO.primaryCta.label}
                </Link>
                <Link href={HERO.secondaryCta.href} className="ba-btn-outline-white">
                  {HERO.secondaryCta.label} →
                </Link>
              </div>
              <div className="ba-hero-trust">
                {HERO.trustStrip.map((item) => (
                  <span key={item} className="ba-hero-trust-pill">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
              <div className="ba-hero-ticker" aria-hidden>
                <span className="ba-hero-ticker-dot" />
                Live metrics · Trust 4.7 · 1,284 verified reviews · 94% response rate
              </div>
            </div>
            <div className="ba-hero-stage">
              <div className="ba-hero-orbit ba-hero-orbit--trust" aria-hidden>
                <strong>4.7</strong>
                <span>Trust score</span>
              </div>
              <div className="ba-hero-orbit ba-hero-orbit--live" aria-hidden>
                <strong>Live</strong>
                <span>Every minute</span>
              </div>
              <div className="ba-hero-orbit ba-hero-orbit--verified" aria-hidden>
                <strong>91%</strong>
                <span>Verified</span>
              </div>
              <HeroAnalyticsMock />
            </div>
          </div>
        </div>
        <div className="ba-hero-wave" aria-hidden />
      </section>

      {/* 2. Challenge */}
      <FadeUp threshold={IO}>
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{PROBLEM.title.lead} </span>
            <span className="ba-section-accent">{PROBLEM.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{PROBLEM.description}</p>
          <div className="ba-challenge-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.challenge} alt="" loading="lazy" decoding="async" />
            <div className="ba-challenge-banner-overlay" aria-hidden />
            <p className="ba-challenge-banner-quote">{PROBLEM.bannerQuote}</p>
          </div>
          <MosaicSection
            items={PROBLEM.items}
            renderCard={(item, index) => {
              const variant = PROBLEM_ICON_CONFIG[index]?.variant ?? "amber";
              const Icon = PROBLEM_ICONS[index] ?? FolderOpen;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article className="ba-problem-card">
                    <div className="ba-problem-card-top">
                      <span className={`ba-icon-circle ${problemCircleClass(variant)}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="ba-problem-arrow" aria-hidden>
                        →
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                </StaggerFadeUp>
              );
            }}
          />
        </section>
      </FadeUp>

      {/* 3. Solution */}
      <FadeUp threshold={IO} className="ba-solution">
        <div className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{SOLUTION.title.lead} </span>
            <span className="ba-section-accent">{SOLUTION.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{SOLUTION.description}</p>
          <div className="ba-solution-grid">
            <div className="ba-solution-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BA_IMAGES.solutionMain}
                alt="Data charts and analytics visualization"
                className="ba-solution-main"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BA_IMAGES.solutionSecondary}
                alt="Customer feedback and review insights"
                className="ba-solution-secondary"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="ba-solution-list">
              {SOLUTION.bullets.map((bullet) => (
                <div key={bullet} className="ba-solution-row">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  <p>{bullet}</p>
                </div>
              ))}
              <p className="ba-solution-tagline">{SOLUTION.tagline}</p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. Workflow */}
      <section className="ba-workflow" aria-labelledby="ba-workflow-title">
        <div className="ba-workflow-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BA_IMAGES.workflowBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="ba-workflow-inner ba-section-inner">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00B4A6]">
            {WORKFLOW.kicker}
          </p>
          <h2 id="ba-workflow-title" className="ba-section-title">
            <span>{WORKFLOW.title.lead} </span>
            <span className="ba-section-accent">{WORKFLOW.title.accent}</span>
          </h2>
          <p className="ba-workflow-sub">{WORKFLOW.description}</p>
          <div className="ba-workflow-grid">
            {WORKFLOW.steps.map((step, index) => (
              <StaggerFadeUp key={step.title} index={index} staggerMs={80} threshold={IO}>
                <article className="ba-workflow-card">
                  <div className="ba-workflow-step-head">
                    <span
                      className={`ba-workflow-num${index % 2 === 1 ? " ba-workflow-num--forest" : ""}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ba-workflow-emoji" aria-hidden>
                      {step.icon}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <p className="ba-workflow-why-label">Why it matters:</p>
                  <p className="ba-workflow-why-text">{whyItMatters(step.description)}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
          <div className="ba-workflow-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.workflowBanner} alt="" loading="lazy" decoding="async" />
            <div className="ba-workflow-banner-overlay" aria-hidden />
            <p>{WORKFLOW.bannerQuote}</p>
          </div>
        </FadeUp>
      </section>

      {/* 5. Features */}
      <FadeUp threshold={IO}>
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{FEATURES_SECTION.title.lead} </span>
            <span className="ba-section-accent">{FEATURES_SECTION.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{FEATURES_SECTION.description}</p>
          <p className="ba-features-sub">Part of the live Tellacity business dashboard.</p>
          <div className="ba-features-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.features} alt="" loading="lazy" decoding="async" />
            <div className="ba-features-banner-overlay" aria-hidden />
            <div className="ba-features-banner-text">
              <h3>{FEATURES_SECTION.bannerQuote}</h3>
            </div>
          </div>
          <div className="ba-features-grid">
            {FEATURES_SECTION.items.map((feature, index) => {
              const cfg = FEATURE_ICON_CONFIG[index]!;
              const Icon = FEATURE_ICONS[cfg.icon];
              const isForest = cfg.accent === "forest";
              return (
                <StaggerFadeUp key={feature.title} index={index} staggerMs={50} threshold={IO}>
                  <article className="ba-feature-card">
                    <span aria-hidden>{feature.badge}</span>
                    <span
                      className={`ba-icon-circle ba-icon-circle--sm mt-2 ${isForest ? "ba-icon-circle--forest" : "ba-icon-circle--teal"}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                    <span className="ba-feature-card-footer" aria-hidden>
                      →
                    </span>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 6. Verified trust */}
      <FadeUp threshold={IO} className="ba-trust">
        <div className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{VERIFIED_TRUST.title.lead} </span>
            <span className="ba-section-accent">{VERIFIED_TRUST.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{VERIFIED_TRUST.description}</p>
          <div className="ba-trust-split">
            <div>
              <ul className="ba-trust-bullets list-none p-0">
                {VERIFIED_TRUST.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="ba-trust-mini-card" aria-hidden>
                <strong>Reputation Overview · Last 30 days</strong>
                <div className="ba-trust-mini-stats">
                  <span>
                    <span style={{ color: "var(--ba-teal)", fontWeight: 800, fontSize: "1.5rem" }}>
                      4.7
                    </span>
                  </span>
                  <span>
                    <span
                      style={{ color: "var(--ba-forest)", fontWeight: 800, fontSize: "1.5rem" }}
                    >
                      1,284
                    </span>
                  </span>
                  <span>
                    <span style={{ color: "var(--ba-teal)", fontWeight: 800, fontSize: "1.5rem" }}>
                      94%
                    </span>
                  </span>
                  <span style={{ color: "var(--ba-muted)", fontSize: "0.8125rem" }}>
                    91% verified
                  </span>
                </div>
                <div className="ba-hero-progress-track" style={{ marginTop: "0.75rem" }}>
                  <div className="ba-hero-progress-fill" style={{ width: "91%" }} />
                </div>
                <div className="ba-hero-mock-foot" style={{ marginTop: "0.5rem" }}>
                  <span className="ba-hero-live-dot" aria-hidden />
                  <span>Updated every minute</span>
                </div>
              </div>
            </div>
            <div className="ba-trust-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BA_IMAGES.trustTop}
                alt="Team reviewing trust data"
                className="ba-trust-img-top"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BA_IMAGES.trustBottom}
                alt="Team collaboration reviewing analytics"
                className="ba-trust-img-bottom"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 7. Stats */}
      <section className="ba-stats" aria-labelledby="ba-stats-title">
        <h2 id="ba-stats-title" className="ba-stats-title">
          {TRUST_STATS.title.lead}
        </h2>
        <p className="ba-section-sub" style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
          {TRUST_STATS.title.accent}
        </p>
        <div className="ba-stats-row">
          {TRUST_STATS.stats.map((stat) => (
            <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      {/* 8. Source of truth */}
      <FadeUp threshold={IO}>
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-accent">{SOURCE_OF_TRUTH.title.lead} </span>
            <span className="ba-section-dark">{SOURCE_OF_TRUTH.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{SOURCE_OF_TRUTH.description}</p>
          <div className="ba-source-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.sourceBanner} alt="" loading="lazy" decoding="async" />
            <div className="ba-source-banner-overlay" aria-hidden />
            <div className="ba-source-banner-text">
              <h3>{SOURCE_OF_TRUTH.bannerLine1}</h3>
              <p>{SOURCE_OF_TRUTH.bannerLine2}</p>
            </div>
          </div>
          <div className="ba-source-row">
            {SOURCE_OF_TRUTH.capabilities.map((cap, index) => {
              const cfg = SOURCE_ICON_CONFIG[index]!;
              const Icon = SOURCE_ICONS[cfg.icon];
              const isForest = cfg.accent === "forest";
              return (
                <StaggerFadeUp key={cap.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`ba-source-card${isForest ? " ba-source-card--forest" : ""}`}
                  >
                    <span
                      className={`ba-icon-circle ${isForest ? "ba-icon-circle--forest" : "ba-icon-circle--teal"}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h4 style={{ marginTop: "0.75rem", fontWeight: 700, fontSize: "0.875rem" }}>
                      {cap.title}
                    </h4>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--ba-muted)" }}>
                      {cap.description}
                    </p>
                    <span className="ba-inline-link" style={{ marginTop: "0.75rem", display: "inline-block" }}>
                      →
                    </span>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 9. Decisions */}
      <FadeUp threshold={IO} className="ba-decisions">
        <div className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-accent">{DECISIONS.title.lead} </span>
            <span className="ba-section-dark">{DECISIONS.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{DECISIONS.description}</p>
          <div className="ba-decisions-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.decisions} alt="" loading="lazy" decoding="async" />
            <div className="ba-decisions-banner-overlay" aria-hidden />
            <div className="ba-decisions-banner-text">
              <h3>{DECISIONS.bannerLine1}</h3>
              <p>{DECISIONS.bannerLine2}</p>
            </div>
          </div>
          <MosaicSection
            items={DECISIONS.items}
            renderCard={(item, index) => {
              const iconKey = DECISION_ICON_CONFIG[index]!;
              const Icon = DECISION_ICONS[iconKey];
              const isForest = item.border === "forest";
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`ba-decision-card${isForest ? " ba-decision-card--forest" : ""}`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span
                      className={`ba-icon-circle ba-icon-circle--sm mt-2 ${isForest ? "ba-icon-circle--forest" : "ba-icon-circle--teal"}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h4 style={{ marginTop: "0.75rem", fontWeight: 700 }}>{item.title}</h4>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--ba-muted)" }}>
                      {item.description}
                    </p>
                  </article>
                </StaggerFadeUp>
              );
            }}
          />
        </div>
      </FadeUp>

      {/* 10. Teams */}
      <section className="ba-teams-dark" aria-labelledby="ba-teams-title">
        <div className="ba-teams-dark-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BA_IMAGES.teamsBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="ba-section-inner ba-teams-dark-inner">
          <h2 id="ba-teams-title" className="ba-section-title">
            <span>{TEAMS.title.lead} </span>
            <span className="ba-section-accent">{TEAMS.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{TEAMS.description}</p>
          <div className="ba-teams-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.teamsBanner} alt="" loading="lazy" decoding="async" />
            <div className="ba-teams-banner-overlay" aria-hidden />
          </div>
          <div className="ba-teams-row">
            {TEAMS.audiences.map((team, index) => {
              const Icon = TEAM_ICONS[index] ?? Megaphone;
              const link = TEAM_CARD_LINKS[index];
              const isForest = index % 2 === 1;
              const tag = TEAM_TAGS[index]!;
              return (
                <StaggerFadeUp key={team.audience} index={index} staggerMs={70} threshold={IO}>
                  <article className={`ba-team-card${isForest ? " ba-team-card--forest" : ""}`}>
                    <span
                      className={`ba-icon-circle ba-icon-circle--sm ${isForest ? "ba-icon-circle--forest" : "ba-icon-circle--teal"}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="ba-team-emoji" aria-hidden>
                      {team.icon}
                    </span>
                    <h3>{team.audience}</h3>
                    <span
                      className={`ba-team-pill${isForest ? " ba-team-pill--forest" : ""}`}
                    >
                      {tag}
                    </span>
                    <p>{team.value}</p>
                    {link?.href ? (
                      <Link
                        href={link.href}
                        className={
                          isForest ? "ba-inline-link ba-inline-link--forest" : "ba-inline-link"
                        }
                      >
                        → {link.label}
                      </Link>
                    ) : null}
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </FadeUp>
      </section>

      {/* 11. Outcomes */}
      <FadeUp threshold={IO}>
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{OUTCOMES.title.lead} </span>
            <span className="ba-section-accent">{OUTCOMES.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{OUTCOMES.description}</p>
          <div className="ba-outcomes-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BA_IMAGES.outcomes} alt="" loading="lazy" decoding="async" />
            <div className="ba-outcomes-banner-overlay" aria-hidden />
            <p className="ba-outcomes-banner-quote">{OUTCOMES.bannerQuote}</p>
          </div>
          <MosaicSection
            items={OUTCOMES.items}
            renderCard={(item, index) => {
              const Icon = OUTCOME_ICONS[OUTCOME_ICON_KEYS[index]!];
              const isForest = index % 2 === 1;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`ba-outcome-card ba-outcome-card--border${isForest ? " ba-outcome-card--forest" : ""}`}
                  >
                    <Icon className="h-6 w-6 text-[#00B4A6]" aria-hidden />
                    <span className="ml-2" aria-hidden>
                      {item.icon}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span className="ba-feature-card-footer" aria-hidden>
                      →
                    </span>
                  </article>
                </StaggerFadeUp>
              );
            }}
          />
        </section>
      </FadeUp>

      {/* 12. FAQ */}
      <FadeUp threshold={IO} className="ba-faq-section">
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-dark">{FAQ.title.lead} </span>
            <span className="ba-section-accent">{FAQ.title.accent}</span>
          </h2>
          <p className="ba-section-sub">{FAQ.description}</p>
          <div className="ba-faq-list">
            {FAQ.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.question} className={`ba-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="ba-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.question}
                    <ChevronDown className="ba-faq-chevron h-5 w-5" aria-hidden />
                  </button>
                  <div className="ba-faq-panel">
                    <div className="ba-faq-panel-inner">
                      <p className="ba-faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 13. Related */}
      <FadeUp threshold={IO}>
        <section className="ba-section-inner">
          <h2 className="ba-section-title ba-header-center">
            <span className="ba-section-accent">{RELATED.title.lead} </span>
            <span className="ba-section-dark">{RELATED.title.accent}</span>
          </h2>
          <div className="ba-related-grid">
            {RELATED.items.map((item, index) => {
              const Icon = relatedIcons[item.icon];
              const isForest = item.icon === "star" || item.icon === "camera";
              return (
                <StaggerFadeUp key={item.href} index={index} staggerMs={70} threshold={IO}>
                  <Link href={item.href} className="ba-related-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={RELATED_CARD_IMAGES[item.title] ?? BA_IMAGES.relatedWidgets}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="ba-related-body">
                      <span
                        className={`ba-icon-circle ba-icon-circle--sm ${isForest ? "ba-icon-circle--forest" : "ba-icon-circle--teal"}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span className="ba-related-link">Learn more →</span>
                    </div>
                  </Link>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 14. Final CTA */}
      <section className="ba-final" aria-labelledby="ba-final-title">
        <h2 id="ba-final-title">{FINAL_CTA.title}</h2>
        <p>{FINAL_CTA.description}</p>
        <div className="ba-final-ctas">
          <Link href={FINAL_CTA.primaryCta.href} className="ba-btn-primary">
            {FINAL_CTA.primaryCta.label}
          </Link>
          <Link href={FINAL_CTA.secondaryCta.href} className="ba-btn-outline-white">
            {FINAL_CTA.secondaryCta.label}
          </Link>
          <Link href={FINAL_CTA.dashboardCta.href} className="ba-text-link">
            {FINAL_CTA.dashboardCta.label} →
          </Link>
        </div>
        <p className="ba-final-footnote">✓ {FINAL_CTA.footnote.replace(/ · /g, "  ✓ ")}</p>
      </section>
    </main>
  );
}
