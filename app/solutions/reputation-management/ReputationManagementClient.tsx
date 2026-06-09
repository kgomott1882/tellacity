"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  BadgeCheck,
  BarChart2,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  FileWarning,
  Flag,
  Flame,
  GitMerge,
  Headphones,
  Inbox,
  Lock,
  Mail,
  Megaphone,
  MessageCircleOff,
  MessageSquare,
  RefreshCw,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Star,
  Target,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  CONTROL_ICON_CONFIG,
  CONTROL_PLANE,
  DECISIONS,
  FAQ,
  FEATURE_ICON_CONFIG,
  FEATURES_SECTION,
  FINAL_CTA,
  HERO,
  OUTCOMES,
  PROBLEM,
  PROBLEM_ICON_CONFIG,
  RELATED,
  RELATED_CARD_IMAGES,
  RM_IMAGES,
  SOLUTION,
  TEAMS,
  TRUST_STATS,
  VERIFIED_TRUST,
  WORKFLOW,
  type FeatureIconKey,
} from "./reputationManagementData";

const IO = 0.12;

const PROBLEM_ICONS: LucideIcon[] = [
  MessageCircleOff,
  AlertOctagon,
  FileWarning,
  Flame,
  GitMerge,
  Eye,
  Building2,
];

function ProblemIcon({ index }: { index: number }) {
  const variant = PROBLEM_ICON_CONFIG[index]?.variant ?? "amber";
  const circle =
    variant === "amber"
      ? "rm-icon-circle--amber"
      : variant === "orange"
        ? "rm-icon-circle--orange"
        : variant === "red"
          ? "rm-icon-circle--red"
          : "rm-icon-circle--teal";
  const Icon = PROBLEM_ICONS[index] ?? MessageCircleOff;
  return (
    <span className={`rm-icon-circle ${circle}`}>
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  messageSquare: MessageSquare,
  flag: Flag,
  shield: Shield,
  badgeCheck: BadgeCheck,
  users: Users,
  scrollText: ScrollText,
  building: Building2,
  inbox: Inbox,
  bell: Bell,
  timer: Timer,
  refresh: RefreshCw,
  eye: Eye,
  lock: Lock,
  search: Search,
};

function FeatureIconEl({ type, accent }: { type: FeatureIconKey; accent: "teal" | "forest" }) {
  const Icon = FEATURE_ICONS[type];
  return (
    <span
      className={`rm-icon-circle rm-icon-circle--sm ${accent === "teal" ? "rm-icon-circle--teal" : "rm-icon-circle--forest"}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

function ControlIconEl({
  type,
  accent,
}: {
  type: FeatureIconKey | "fileText" | "sliders";
  accent: "teal" | "forest";
}) {
  const map: Record<string, LucideIcon> = {
    ...FEATURE_ICONS,
    fileText: FileText,
    sliders: Sliders,
  };
  const Icon = map[type] ?? Shield;
  return (
    <span
      className={`rm-icon-circle rm-icon-circle--sm ${accent === "teal" ? "rm-icon-circle--teal" : "rm-icon-circle--forest"}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

function ModerationQueueMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rm-queue-mock${compact ? " rm-queue-mock--compact" : ""}`} aria-hidden>
      <div className="rm-queue-mock-head">
        <strong>Reputation Operations</strong>
        <span>
          <span className="rm-queue-live-dot" />
          Live
        </span>
      </div>
      {!compact && (
        <div className="rm-queue-stats">
          <div>
            <span className="rm-queue-stat-val">12</span>
            <span className="rm-queue-stat-lbl">Open flags</span>
          </div>
          <div>
            <span className="rm-queue-stat-val rm-queue-stat-val--teal">3</span>
            <span className="rm-queue-stat-lbl">Disputes</span>
          </div>
          <div>
            <span className="rm-queue-stat-val rm-queue-stat-val--teal">94%</span>
            <span className="rm-queue-stat-lbl">Replies &lt;24h</span>
          </div>
        </div>
      )}
      <ul className="rm-queue-rows">
        <li>
          <span className="rm-queue-row-ico">🚩</span>
          <div>
            <strong>Suspicious review pattern</strong>
            <span className="rm-queue-tag rm-queue-tag--red">Flag</span>
            <p>★1 · multiple accounts</p>
          </div>
          <span className="rm-queue-status rm-queue-status--amber">Investigating</span>
        </li>
        <li>
          <span className="rm-queue-row-ico">📝</span>
          <div>
            <strong>Address mismatch Branch 04</strong>
            <span className="rm-queue-tag rm-queue-tag--orange">Dispute</span>
            <p>Profile dispute · owner raised</p>
          </div>
          <span className="rm-queue-status rm-queue-status--blue">In review</span>
        </li>
        <li>
          <span className="rm-queue-row-ico">💬</span>
          <div>
            <strong>Verified review awaiting reply</strong>
            <span className="rm-queue-tag rm-queue-tag--teal">Reply</span>
            <p>★5 · 2h ago · verified</p>
          </div>
          <span className="rm-queue-status rm-queue-status--teal">Awaiting reply</span>
        </li>
        <li>
          <span className="rm-queue-row-ico">📜</span>
          <div>
            <strong>All actions logged</strong>
            <p>Audit trail</p>
          </div>
          <span className="rm-queue-arrow">→</span>
        </li>
      </ul>
      <p className="rm-queue-foot">Moderation queue · Centralised · Audited</p>
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
    <div ref={ref} className="rm-stat">
      <div className="rm-stat-value">{display}</div>
      <div className="rm-stat-label">{label}</div>
    </div>
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

export default function ReputationManagementClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="rm-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="rm-hero rm-hero--split" aria-labelledby="rm-hero-title">
        <div className="rm-hero-split">
          <div className="rm-hero-left">
            <Link href={HERO.breadcrumb.href} className="rm-hero-breadcrumb rm-hero-breadcrumb--light">
              {HERO.breadcrumb.label}
              <span className="rm-hero-breadcrumb-arrow" aria-hidden>
                →
              </span>
            </Link>
            <span className="rm-hero-badge rm-hero-badge--pill">{HERO.kicker}</span>
            <h1 id="rm-hero-title" className="rm-hero-title rm-hero-title--split">
              <span className="rm-hero-title-line">{HERO.headline.lead}</span>
              <span className="rm-hero-title-accent">{HERO.headline.accent}</span>
            </h1>
            <div className="rm-hero-sub rm-hero-sub--light">
              {HERO.valuePropParagraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
            <div className="rm-hero-ctas">
              <Link href={HERO.primaryCta.href} className="rm-btn-primary">
                {HERO.primaryCta.label}
              </Link>
              <Link href={HERO.secondaryCta.href} className="rm-btn-outline-teal">
                {HERO.secondaryCta.label} →
              </Link>
            </div>
            <div className="rm-hero-pills">
              {HERO.trustStrip.map((item) => (
                <span key={item} className="rm-hero-pill">
                  <span className="rm-hero-pill-dot" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rm-hero-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RM_IMAGES.heroRight}
              alt="Tellacity reputation management dashboard"
              className="rm-hero-right-img"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* 2. Challenge */}
      <FadeUp threshold={IO}>
        <section className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{PROBLEM.title.lead} </span>
            <span className="rm-section-accent">{PROBLEM.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{PROBLEM.description}</p>
          <div className="rm-challenge-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.challenge} alt="" loading="lazy" decoding="async" />
            <div className="rm-challenge-banner-overlay" aria-hidden />
            <p className="rm-challenge-banner-quote">{PROBLEM.bannerQuote}</p>
          </div>
          <div className="rm-problem-grid rm-problem-grid--7">
            {PROBLEM.items.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <article className="rm-problem-card">
                  <div className="rm-problem-card-top">
                    <ProblemIcon index={index} />
                    <span aria-hidden>{item.icon}</span>
                    <span className="rm-problem-arrow" aria-hidden>
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
      <FadeUp threshold={IO} className="rm-solution">
        <div className="rm-section-inner">
          <p className="rm-solution-kicker">{SOLUTION.kicker}</p>
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{SOLUTION.title.lead} </span>
            <span className="rm-section-accent">{SOLUTION.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{SOLUTION.description}</p>
          <div className="rm-solution-grid">
            <div className="rm-solution-list-wrap">
              {SOLUTION.bullets.map((bullet) => {
                const { title, body } = splitBullet(bullet);
                return (
                  <div key={bullet} className="rm-solution-row">
                    <strong>{title}</strong>
                    {body ? <p>{body}</p> : null}
                  </div>
                );
              })}
              <p className="rm-solution-tagline">{SOLUTION.tagline}</p>
            </div>
            <div className="rm-solution-visual-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RM_IMAGES.solutionMain}
                alt="Tellacity business dashboard for reputation management"
                className="rm-solution-img"
                loading="lazy"
                decoding="async"
              />
              <div className="rm-solution-img-badge" aria-hidden>
                <span>Owner Responded</span>
                <span className="rm-solution-img-badge-dot" />
                Live moderation queue
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. Workflow */}
      <section className="rm-workflow" aria-labelledby="rm-workflow-title">
        <div className="rm-workflow-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RM_IMAGES.workflowBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="rm-workflow-inner rm-section-inner">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00B4A6]">
            {WORKFLOW.kicker}
          </p>
          <h2 id="rm-workflow-title" className="rm-section-title">
            <span>{WORKFLOW.title.lead} </span>
            <span className="rm-section-accent">{WORKFLOW.title.accent}</span>
          </h2>
          <p className="rm-workflow-sub">{WORKFLOW.description}</p>
          <div className="rm-workflow-grid">
            {WORKFLOW.steps.map((step, index) => (
              <StaggerFadeUp key={step.title} index={index} staggerMs={80} threshold={IO}>
                <article
                  className={`rm-workflow-card${index % 2 === 0 ? " rm-workflow-card--teal" : ""}`}
                >
                  <div className="rm-workflow-step-head">
                    <span
                      className={`rm-workflow-num${index % 2 === 0 ? " rm-workflow-num--teal" : ""}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rm-workflow-emoji" aria-hidden>
                      {step.icon}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
          <div className="rm-workflow-banner rm-workflow-banner--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RM_IMAGES.workflowBanner}
              alt="QR code for collecting verified customer reviews"
              loading="lazy"
              decoding="async"
            />
          </div>
        </FadeUp>
      </section>

      {/* 5. Features */}
      <FadeUp threshold={IO}>
        <section className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{FEATURES_SECTION.title.lead} </span>
            <span className="rm-section-accent">{FEATURES_SECTION.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{FEATURES_SECTION.description}</p>
          <div className="rm-features-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.features} alt="" loading="lazy" decoding="async" />
            <div className="rm-features-banner-overlay" aria-hidden />
            <div className="rm-features-banner-text">
              <h3>{FEATURES_SECTION.banner.lead}</h3>
              <p>{FEATURES_SECTION.banner.sub}</p>
            </div>
          </div>
          <div className="rm-features-grid rm-features-grid--14">
            {FEATURES_SECTION.items.map((feature, index) => {
              const cfg = FEATURE_ICON_CONFIG[index]!;
              return (
                <StaggerFadeUp key={feature.title} index={index} staggerMs={50} threshold={IO}>
                  <article className="rm-feature-card">
                    <div className="rm-feature-card-top">
                      <span aria-hidden>{feature.badge}</span>
                      <FeatureIconEl type={cfg.icon} accent={cfg.accent} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <span className="rm-feature-card-footer" aria-hidden>
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
      <FadeUp threshold={IO} className="rm-trust-split">
        <div className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{VERIFIED_TRUST.title.lead} </span>
            <span className="rm-section-accent">{VERIFIED_TRUST.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{VERIFIED_TRUST.description}</p>
          <div className="rm-trust-grid">
            <div className="rm-trust-copy">
              <ul className="rm-trust-bullets">
                {VERIFIED_TRUST.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <ModerationQueueMock compact />
            </div>
            <div className="rm-trust-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RM_IMAGES.trustTop}
                alt="Customer with receipt and phone for verified review proof"
                className="rm-trust-img-top"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RM_IMAGES.trustBottom}
                alt="Trust and credibility handshake"
                className="rm-trust-img-bottom"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 7. Stats */}
      <section className="rm-stats" aria-labelledby="rm-stats-title">
        <h2 id="rm-stats-title" className="rm-stats-title">
          {TRUST_STATS.title}
        </h2>
        <p className="rm-stats-sub">{TRUST_STATS.subtitle}</p>
        <div className="rm-stats-row">
          {TRUST_STATS.stats.map((stat) => (
            <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      {/* 8. Control plane */}
      <FadeUp threshold={IO}>
        <section className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-accent">{CONTROL_PLANE.title.lead} </span>
            <span className="rm-section-dark">{CONTROL_PLANE.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{CONTROL_PLANE.description}</p>
          <div className="rm-control-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.controlBanner} alt="" loading="lazy" decoding="async" />
            <div className="rm-control-banner-overlay" aria-hidden />
            <div className="rm-control-banner-text">
              <p>{CONTROL_PLANE.tagline}</p>
              <p className="rm-control-banner-accent">{CONTROL_PLANE.taglineAccent}</p>
            </div>
          </div>
          <div className="rm-control-row">
            {CONTROL_PLANE.capabilities.map((cap, index) => {
              const cfg = CONTROL_ICON_CONFIG[index]!;
              const isForest = cfg.accent === "forest";
              return (
                <StaggerFadeUp key={cap.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`rm-control-card${isForest ? " rm-control-card--forest" : ""}`}
                  >
                    <ControlIconEl type={cfg.icon} accent={cfg.accent} />
                    <span className="text-lg" aria-hidden>
                      {cap.icon}
                    </span>
                    <h3>{cap.title}</h3>
                    <p>{cap.description}</p>
                    <span className="rm-feature-card-footer" aria-hidden>
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
      <FadeUp threshold={IO} className="rm-decisions">
        <div className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-accent">{DECISIONS.title.lead} </span>
            <span className="rm-section-dark">{DECISIONS.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{DECISIONS.description}</p>
          <div className="rm-decisions-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.decisions} alt="" loading="lazy" decoding="async" />
            <div className="rm-decisions-banner-overlay" aria-hidden />
            <div className="rm-decisions-banner-text">
              <p>{DECISIONS.banner.lead}</p>
              <p className="rm-decisions-banner-accent">{DECISIONS.banner.accent}</p>
            </div>
          </div>
          <div className="rm-decisions-grid rm-problem-grid--7">
            {DECISIONS.items.map((item, index) => {
              const isForest = index % 2 === 1;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`rm-decision-card${isForest ? " rm-decision-card--forest" : ""}`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* 10. Teams */}
      <section className="rm-teams-dark" aria-labelledby="rm-teams-title">
        <div className="rm-teams-dark-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RM_IMAGES.teamsBg} alt="" loading="lazy" decoding="async" />
        </div>
        <FadeUp threshold={IO} className="rm-section-inner">
          <h2 id="rm-teams-title" className="rm-section-title rm-header-center">
            <span>{TEAMS.title.lead} </span>
            <span className="rm-section-accent">{TEAMS.title.accent}</span>
          </h2>
          <p className="rm-teams-sub">{TEAMS.description}</p>
          <div className="rm-teams-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.teamsBanner} alt="" loading="lazy" decoding="async" />
            <div className="rm-teams-banner-overlay" aria-hidden />
          </div>
          <div className="rm-teams-row">
            {TEAMS.audiences.map((team, index) => {
              const isForest = index % 2 === 1;
              const icons = [Headphones, Building2, Megaphone, Target, ShieldCheck];
              const Icon = icons[index] ?? Headphones;
              return (
                <StaggerFadeUp key={team.audience} index={index} staggerMs={70} threshold={IO}>
                  <article className={`rm-team-card${isForest ? " rm-team-card--forest" : ""}`}>
                    <span className="rm-team-emoji" aria-hidden>
                      {team.icon}
                    </span>
                    <span
                      className={`rm-icon-circle rm-icon-circle--sm ${isForest ? "rm-icon-circle--forest" : "rm-icon-circle--teal"}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3>{team.audience}</h3>
                    <span
                      className={`rm-team-tag${isForest ? " rm-team-tag--forest" : ""}`}
                    >
                      {team.tag}
                    </span>
                    <p>{team.value}</p>
                    <Link
                      href="/solutions/reputation-management"
                      className={isForest ? "rm-inline-link rm-inline-link--forest" : "rm-inline-link"}
                    >
                      → Reputation Management
                    </Link>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </FadeUp>
      </section>

      {/* 11. Outcomes */}
      <FadeUp threshold={IO}>
        <section className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{OUTCOMES.title.lead} </span>
            <span className="rm-section-accent">{OUTCOMES.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{OUTCOMES.description}</p>
          <div className="rm-outcomes-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RM_IMAGES.outcomes} alt="" loading="lazy" decoding="async" />
            <div className="rm-outcomes-banner-overlay" aria-hidden />
            <p className="rm-outcomes-banner-quote">{OUTCOMES.bannerQuote}</p>
          </div>
          <div className="rm-outcomes-grid rm-problem-grid--7">
            {OUTCOMES.items.map((item, index) => {
              const isForest = index % 2 === 1;
              return (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <article
                    className={`rm-outcome-card${isForest ? " rm-outcome-card--forest" : ""}`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span className="rm-feature-card-footer" aria-hidden>
                      →
                    </span>
                  </article>
                </StaggerFadeUp>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 12. FAQ */}
      <FadeUp threshold={IO} className="rm-faq-section">
        <section className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-dark">{FAQ.title.lead} </span>
            <span className="rm-section-accent">{FAQ.title.accent}</span>
          </h2>
          <p className="rm-section-sub">{FAQ.description}</p>
          <div className="rm-faq-list">
            {FAQ.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.question} className={`rm-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="rm-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.question}
                    <ChevronDown className="rm-faq-chevron h-5 w-5" aria-hidden />
                  </button>
                  <div className="rm-faq-panel">
                    <div className="rm-faq-panel-inner">
                      <p className="rm-faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* 13. Related */}
      <FadeUp threshold={IO} className="rm-related">
        <div className="rm-section-inner">
          <h2 className="rm-section-title rm-header-center">
            <span className="rm-section-accent">{RELATED.title.lead} </span>
            <span className="rm-section-dark">{RELATED.title.accent}</span>
          </h2>
          <div className="rm-related-grid">
            {RELATED.items.map((item, index) => {
              const icons = [Mail, Star, BarChart2, Camera];
              const Icon = icons[index] ?? Mail;
              const isForest = index === 1 || index === 3;
              return (
                <StaggerFadeUp key={item.href} index={index} staggerMs={70} threshold={IO}>
                  <Link href={item.href} className="rm-related-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={RELATED_CARD_IMAGES[item.title] ?? RM_IMAGES.relatedWidgets}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="rm-related-body">
                      <span
                        className={`rm-icon-circle rm-icon-circle--sm ${isForest ? "rm-icon-circle--forest" : "rm-icon-circle--teal"}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span className="rm-related-link">Learn more →</span>
                    </div>
                  </Link>
                </StaggerFadeUp>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* 14. Final CTA */}
      <section className="rm-final" aria-labelledby="rm-final-title">
        <h2 id="rm-final-title">{FINAL_CTA.title}</h2>
        <p>{FINAL_CTA.description}</p>
        <div className="rm-final-ctas">
          <Link href={FINAL_CTA.primaryCta.href} className="rm-btn-primary">
            {FINAL_CTA.primaryCta.label}
          </Link>
          <Link href={FINAL_CTA.secondaryCta.href} className="rm-btn-outline-white">
            {FINAL_CTA.secondaryCta.label}
          </Link>
          <Link href={FINAL_CTA.dashboardCta.href} className="rm-text-link">
            {FINAL_CTA.dashboardCta.label} →
          </Link>
        </div>
        <p className="rm-final-footnote">✓ {FINAL_CTA.footnote.replace(/ · /g, "  ✓ ")}</p>
      </section>
    </main>
  );
}
