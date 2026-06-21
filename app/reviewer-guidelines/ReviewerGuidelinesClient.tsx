"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Badge,
  BadgeCheck,
  BarChart2,
  Building2,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  Eye,
  FileSearch,
  FileText,
  Flag,
  HelpCircle,
  Info,
  Lock,
  MessageCircle,
  Receipt,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldOff,
  Trash2,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  appealRules,
  businessGuidelines,
  consumerGuidelines,
  corePrinciples,
  disputeSteps,
  enforcementActions,
  generalRules,
  relatedPages,
  RG_IMAGES,
} from "./reviewerGuidelinesData";

const IO = 0.12;

function PrincipleIcon({ type }: { type: "shield" | "eye" | "scale" }) {
  const cls = "h-5 w-5";
  if (type === "eye") return <Eye className={cls} aria-hidden />;
  if (type === "scale") return <Scale className={cls} aria-hidden />;
  return <Shield className={cls} aria-hidden />;
}

function ConsumerIcon({ type }: { type: (typeof consumerGuidelines)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "fileText":
      return <FileText className={cls} aria-hidden />;
    case "checkCircle":
      return <CheckCircle className={cls} aria-hidden />;
    case "alertCircle":
      return <AlertCircle className={cls} aria-hidden />;
    default:
      return <Receipt className={cls} aria-hidden />;
  }
}

function BusinessIcon({ type }: { type: (typeof businessGuidelines)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "xCircle":
      return <XCircle className={cls} aria-hidden />;
    case "shieldOff":
      return <ShieldOff className={cls} aria-hidden />;
    case "users":
      return <Users className={cls} aria-hidden />;
    default:
      return <MessageCircle className={cls} aria-hidden />;
  }
}

function EnforcementIcon({ type }: { type: (typeof enforcementActions)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "alertTriangle":
      return <AlertTriangle className={cls} aria-hidden />;
    case "userX":
      return <UserX className={cls} aria-hidden />;
    case "building2":
      return <Building2 className={cls} aria-hidden />;
    default:
      return <Trash2 className={cls} aria-hidden />;
  }
}

function DisputeIcon({ type }: { type: (typeof disputeSteps)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "search":
      return <Search className={cls} aria-hidden />;
    case "checkSquare":
      return <CheckSquare className={cls} aria-hidden />;
    default:
      return <Flag className={cls} aria-hidden />;
  }
}

function RelatedIcon({ type }: { type: (typeof relatedPages)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "shield":
      return <Shield className={cls} aria-hidden />;
    case "helpCircle":
      return <HelpCircle className={cls} aria-hidden />;
    case "barChart2":
      return <BarChart2 className={cls} aria-hidden />;
    case "info":
      return <Info className={cls} aria-hidden />;
    default:
      return <Settings className={cls} aria-hidden />;
  }
}

function AppealIcon({
  type,
}: {
  type: (typeof appealRules)[number]["icon"];
}) {
  if (type === "one") {
    return <span className="rg-appeal-icon">1</span>;
  }
  if (type === "lock") {
    return (
      <span className="rg-appeal-icon rg-appeal-icon--forest">
        <Lock className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="rg-appeal-icon">
      <FileSearch className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

export default function ReviewerGuidelinesClient() {
  return (
    <main className="rg-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="rg-hero" aria-labelledby="rg-hero-title">
        <div className="rg-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="rg-hero-inner">
          <span className="rg-hero-badge">COMMUNITY · FAIRNESS · TRUST</span>
          <h1 id="rg-hero-title">
            <span className="rg-hero-title-line">Community &amp; Reviewer</span>
            <span className="rg-hero-title-accent">Guidelines</span>
          </h1>
          <p className="rg-hero-sub">
            Clear rules that ensure fairness, transparency, and respect for both
            consumers and businesses.
          </p>
          <div className="rg-hero-pillars">
            <span className="rg-hero-pillar">🛡 Trust</span>
            <span className="rg-hero-pillar">👁 Transparency</span>
            <span className="rg-hero-pillar">⚖ Fairness</span>
          </div>
          <div className="rg-hero-cta">
            <Link href="/write-review" className="rg-btn-primary">
              Write a Review →
            </Link>
          </div>
        </div>
        <div className="rg-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* 2. Core principles */}
      <FadeUp threshold={IO} className="rg-principles">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            <span className="rg-section-accent">Core</span> Principles
          </h2>
          <p className="rg-intro-note">
            Tellacity operates on three foundational pillars. Together they define how
            reviews are collected, displayed, and moderated so the platform stays useful
            for consumers and fair for businesses.
          </p>
          <div className="rg-principle-grid">
            {corePrinciples.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={80} threshold={IO}>
                <article
                  className={`rg-principle-card rg-principle-card--${item.accent} h-full`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
                  <div className="rg-principle-body">
                    <span className={`rg-principle-icon rg-principle-icon--${item.accent}`}>
                      <PrincipleIcon type={item.icon} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>
                      {item.body} {item.extra}
                    </p>
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 3. General rules */}
      <FadeUp threshold={IO} className="rg-rules">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            General Rules <span className="rg-section-accent">for Everyone</span>
          </h2>
          <p className="rg-intro-note">
            Whether you are writing a review or replying to one, these rules apply to all
            users equally. They protect the community from abuse, keep content relevant,
            and preserve privacy for everyone involved.
          </p>
          <div className="rg-rules-grid">
            <div className="rg-rules-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RG_IMAGES.rulesCommunity}
                alt="Honest community member"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RG_IMAGES.rulesReview}
                alt="Person writing an honest review"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              {generalRules.map((rule) => (
                <div key={rule.num} className="rg-rule-row">
                  <div className="rg-rule-head">
                    <span className="rg-rule-num">{rule.num}</span>
                    <h3>{rule.title}</h3>
                  </div>
                  <p>{rule.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 4. Consumers */}
      <FadeUp threshold={IO} className="rg-consumers">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            Guidelines for <span className="rg-section-accent">Consumers</span>
          </h2>
          <div className="rg-feature-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RG_IMAGES.consumerBanner}
              alt="Reviewer sharing feedback on Tellacity"
              loading="lazy"
              decoding="async"
            />
            <p className="rg-feature-banner-text">
              Your reviews help others make better decisions.
            </p>
          </div>
          <p className="rg-intro-note">
            Following these guidelines keeps your feedback credible, useful, and harder to
            dismiss if it is ever challenged.
          </p>
          <div className="rg-consumer-grid">
            {consumerGuidelines.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <div className="rg-guideline-card h-full">
                  <span className={`rg-guideline-icon rg-guideline-icon--${item.accent}`}>
                    <ConsumerIcon type={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.tag ? (
                    <span className={`rg-tag rg-tag--${item.tagStyle}`}>{item.tag}</span>
                  ) : null}
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 5. Businesses */}
      <FadeUp threshold={IO} className="rg-businesses">
        <div className="rg-businesses-bg" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            Guidelines for <span className="rg-section-accent">Businesses</span>
          </h2>
          <p className="relative z-[1] mt-3 max-w-2xl text-sm text-white/75">
            How you respond to reviews says as much about your business as the reviews
            themselves. These rules protect consumers and prevent reputation manipulation.
          </p>
          <div className="rg-business-grid">
            {businessGuidelines.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <div className="rg-business-card h-full">
                  <span
                    className="rg-business-icon"
                    style={{
                      background:
                        item.accent === "red"
                          ? "rgba(239, 68, 68, 0.12)"
                          : item.accent === "forest"
                            ? "rgba(18, 69, 65, 0.1)"
                            : "rgba(0, 180, 166, 0.12)",
                      color:
                        item.accent === "red"
                          ? "#ef4444"
                          : item.accent === "forest"
                            ? "#124541"
                            : "#00b4a6",
                    }}
                  >
                    <BusinessIcon type={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.tag ? <span className="rg-tag rg-tag--red">{item.tag}</span> : null}
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 6. Verified vs unverified */}
      <FadeUp threshold={IO} className="rg-compare">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            Verified vs <span className="rg-section-accent">Unverified Reviews</span>
          </h2>
          <p className="rg-intro-note">
            Tellacity distinguishes between verified and unverified content so readers can
            weigh feedback appropriately. We encourage all users to verify reviews
            voluntarily, see{" "}
            <Link href="/how-tellacity-works" className="rg-inline-link">
              How Tellacity Works
            </Link>{" "}
            for more on verification.
          </p>
          <div className="rg-compare-wrap">
            <span className="rg-compare-vs">VS</span>
            <article className="rg-compare-card rg-compare-card--verified">
              <BadgeCheck className="h-10 w-10 text-[#00b4a6]" aria-hidden />
              <h3>Verified Reviews</h3>
              <p>
                The reviewer has submitted valid proof of purchase or experience, or used
                a verified invitation link. These reviews are highlighted and trusted more
                by our algorithm.
              </p>
              <ul className="rg-compare-list">
                <li><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b4a6]" aria-hidden /> Proof of purchase submitted</li>
                <li><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b4a6]" aria-hidden /> Highlighted in algorithm</li>
                <li><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b4a6]" aria-hidden /> Harder to dispute</li>
                <li><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b4a6]" aria-hidden /> Builds stronger trust signal</li>
              </ul>
              <span className="rg-compare-badge rg-compare-badge--verified">VERIFIED</span>
            </article>
            <article className="rg-compare-card rg-compare-card--unverified">
              <Badge className="h-10 w-10 text-[#f59e0b]" aria-hidden />
              <h3>Unverified Reviews</h3>
              <p>
                Allowed, but flagged as &quot;Unverified&quot;. If challenged by a business,
                the reviewer must provide proof within a set timeframe, or the review may
                be removed.
              </p>
              <ul className="rg-compare-list">
                <li><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" aria-hidden /> Flagged as &quot;Unverified&quot;</li>
                <li><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" aria-hidden /> Can be challenged</li>
                <li><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" aria-hidden /> Must provide proof if disputed</li>
                <li><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" aria-hidden /> May be removed without proof</li>
              </ul>
              <span className="rg-compare-badge rg-compare-badge--unverified">UNVERIFIED</span>
            </article>
          </div>
        </div>
      </FadeUp>

      {/* 7. Dispute & moderation */}
      <FadeUp threshold={IO} className="rg-dispute">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            Dispute &amp; <span className="rg-section-accent">Moderation Process</span>
          </h2>
          <p className="rg-intro-note">
            We use automated systems and human moderation. Content is flagged, investigated,
            and decided on evidence, not on whether a business simply dislikes the outcome.
            We do not remove reviews simply because they are negative. Read more in{" "}
            <Link href="/safety-trust" className="rg-inline-link">
              Safety &amp; Trust
            </Link>
            .
          </p>
          <div className="rg-dispute-grid">
            <div className="rg-dispute-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RG_IMAGES.dispute}
                alt="Moderation and review process"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="rg-dispute-steps">
              {disputeSteps.map((step, index) => (
                <StaggerFadeUp key={step.title} index={index} staggerMs={150} threshold={IO}>
                  <div className="rg-dispute-step">
                    <span className="rg-dispute-step-icon">
                      <DisputeIcon type={step.icon} />
                    </span>
                    <h3>{step.title}</h3>
                    {"body" in step && step.body ? <p>{step.body}</p> : null}
                    {"outcomes" in step && step.outcomes
                      ? step.outcomes.map((o) => (
                          <p key={o.text} className={`rg-outcome rg-outcome--${o.tone}`}>
                            {o.tone === "teal" ? "✓" : "✗"} {o.text}
                          </p>
                        ))
                      : null}
                  </div>
                </StaggerFadeUp>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 8. Enforcement */}
      <FadeUp threshold={IO} className="rg-enforcement">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            <span className="rg-section-accent">Enforcement</span> Actions
          </h2>
          <p className="rg-intro-note">
            Violating these guidelines results in consequences meant to protect trust, not
            punish disagreement. A single harsh but honest review will not trigger removal;
            repeated hate speech, fake reviews, or retaliation will.
          </p>
          <div className="rg-enforcement-grid">
            {enforcementActions.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                <article
                  className="rg-enforcement-card h-full"
                  style={{ ["--rg-bar-color" as string]: item.color }}
                >
                  <span style={{ color: item.color }}>
                    <EnforcementIcon type={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 9. Appeals */}
      <FadeUp threshold={IO} className="rg-appeals">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rg-appeals-inner">
            <h2 className="rg-section-title">
              <span className="rg-section-accent">Appeals</span> Process
            </h2>
            <p className="rg-intro-note">
              We understand that moderation mistakes can happen. Appeals exist so users can
              challenge a decision once, with new information.
            </p>
            <div className="rg-appeals-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RG_IMAGES.appeals}
                alt="Tellacity appeals process"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="rg-appeals-grid">
              {appealRules.map((item, index) => (
                <StaggerFadeUp key={item.title} index={index} staggerMs={60} threshold={IO}>
                  <div className="rg-appeal-card h-full">
                    <AppealIcon type={item.icon} />
                    <h3>{item.title}</h3>
                    <p>
                      {item.body}{" "}
                      {item.title === "Final decisions" ? (
                        <>
                          See the{" "}
                          <Link href="/faq" className="rg-inline-link">
                            FAQ
                          </Link>
                          .
                        </>
                      ) : null}
                    </p>
                  </div>
                </StaggerFadeUp>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 10. Why these guidelines matter */}
      <FadeUp threshold={IO} className="rg-why">
        <div className="rg-why-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RG_IMAGES.why}
            alt="Trust and community at the beach"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="rg-why-blocks">
          <div className="rg-why-block">
            <h3>Why trust matters</h3>
            <p>
              A review platform is only useful if it is trusted. When consumers cheat,
              businesses suffer unfairly. When businesses cheat, consumers lose money and
              trust. Honesty from both sides is what makes Tellacity worth using.
            </p>
          </div>
          <div className="rg-why-divider" aria-hidden />
          <div className="rg-why-block">
            <h3>Why fairness matters</h3>
            <p>
              By strictly enforcing these guidelines, we ensure Tellacity remains a valuable
              resource for finding great businesses and for businesses to build a genuine,
              hard-earned reputation. These guidelines are part of the broader{" "}
              <Link href="/for-business" className="text-[#1ecfb8] underline underline-offset-2">
                Tellacity Reputation Platform
              </Link>
              .
            </p>
          </div>
        </div>
      </FadeUp>

      {/* 11. Related trust pages */}
      <FadeUp threshold={IO} className="rg-related">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rg-section-title">
            <span className="rg-section-accent">Related</span> Trust Pages
          </h2>
          <p className="rg-intro-note">
            Learn more about how moderation, verification, and reputation work across
            Tellacity.
          </p>
          <div className="rg-related-grid">
            {relatedPages.map((page, index) => (
              <StaggerFadeUp key={page.href} index={index} staggerMs={60} threshold={IO}>
                <Link href={page.href} className="rg-related-card block h-full">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background: index % 2 === 0 ? "rgba(0,180,166,0.1)" : "rgba(18,69,65,0.08)",
                      color: index % 2 === 0 ? "#00b4a6" : "#124541",
                    }}
                  >
                    <RelatedIcon type={page.icon} />
                  </span>
                  <h3>{page.title}</h3>
                  <p>{page.description}</p>
                  <span className="rg-related-link">Learn more →</span>
                </Link>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 12. Bottom CTA */}
      <FadeUp threshold={IO} className="rg-bottom-cta">
        <div className="rg-bottom-cta-bg" aria-hidden />
        <div className="rg-bottom-cta-inner">
          <h2>Ready to write your first review?</h2>
          <p>
            Be honest, be fair, and help us build a marketplace where the truth wins.
          </p>
          <div className="rg-bottom-cta-actions">
            <Link href="/write-review" className="rg-btn-primary">
              Write a Review
            </Link>
            <Link href="/how-tellacity-works" className="rg-btn-outline-white">
              Learn How It Works
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* SEO / remaining copy */}
      <FadeUp threshold={IO} className="rg-seo">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>
            Building a marketplace of trust requires clear rules. These guidelines apply
            across the{" "}
            <Link href="/for-business" className="rg-inline-link">
              Tellacity Reputation Platform
            </Link>{" "}
            and work alongside our{" "}
            <Link href="/how-tellacity-works" className="rg-inline-link">
              verification and moderation systems
            </Link>
            .
          </p>
          <p>
            Weighted proof matters more than anonymous noise because verified experiences
            give readers a stronger basis for trust. Unverified reviews keep the platform
            open while giving businesses a fair path to challenge suspicious content.
          </p>
        </div>
      </FadeUp>

      <div className="rg-sr-block">
        <h2>Final Word</h2>
        <p>
          Community responsibility: Tellacity is a community. We rely on you, our users and
          business partners, to uphold these standards.
        </p>
        <p>
          Honest participation: Be honest, be fair, and help us create a marketplace where
          the truth wins. Thank you for being part of Tellacity. Learn more about our mission
          on the About page.
        </p>
      </div>
    </main>
  );
}
