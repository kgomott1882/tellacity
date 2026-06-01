import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared layout for `/solutions/<slug>` product pages.
 *
 * Tellacity is positioned as a product-led platform: every solution page is
 * structured as a SaaS landing page (Hero → Problem → Solution → Features →
 * Trust → CTA) so the marketing surface scales without competitor references
 * and consistently funnels to the dashboard / signup flows.
 *
 * Design intentionally avoids:
 *  - competitor comparisons
 *  - inflated metrics / hyperbolic claims
 *  - decorative illustrations in place of real product UI
 *
 * The component is a server component (no "use client") so each page can
 * export its own `metadata` and ship fully-rendered HTML for SEO.
 */

export type SolutionFeature = {
  title: string;
  description: string;
  /** Optional lucide-style emoji glyph or short label rendered in the badge. */
  badge?: string;
};

export type SolutionStat = {
  label: string;
  value: string;
};

export type RelatedSolution = {
  title: string;
  href: string;
  description: string;
};

export type SolutionFaq = {
  question: string;
  answer: string;
};

export type WorkflowStep = {
  icon: string;
  title: string;
  description: string;
};

export type SolutionWorkflow = {
  kicker?: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
};

export type VerifiedTrustBlock = {
  kicker?: string;
  title: string;
  description: string;
  bullets: string[];
  /**
   * Which inline product-surface mock to render on the right column.
   * When omitted, the section renders either as a single centered column
   * (kicker, title, description and bullets only) or as a two-column
   * layout if `image` is provided.
   */
  surface?: "widget-preview" | "analytics" | "moderation" | "media";
  /**
   * Optional image displayed on the right column. Used on pages that
   * don't have a built-in product-surface mock but still want a visual
   * companion next to the trust copy. Ignored when `surface` is set
   * (the mock takes precedence).
   */
  image?: { src: string; alt: string };
};

export type PlatformChip = {
  name: string;
  icon?: string;
};

export type SolutionPlatformsBlock = {
  kicker?: string;
  title: string;
  description: string;
  frameworks: PlatformChip[];
  attributes: string[];
};

export type ControlPlaneCapability = {
  icon?: string;
  title: string;
  description: string;
};

export type SolutionControlPlaneBlock = {
  kicker?: string;
  title: string;
  description: string;
  /** Short pinned tagline shown beneath the section heading. */
  tagline?: string;
  capabilities: ControlPlaneCapability[];
};

export type SolutionDecision = {
  icon?: string;
  title: string;
  description: string;
};

export type SolutionDecisionsBlock = {
  kicker?: string;
  title: string;
  description: string;
  items: SolutionDecision[];
};

export type TeamAudience = {
  audience: string;
  value: string;
  icon?: string;
};

export type SolutionTeamsBlock = {
  kicker?: string;
  title: string;
  description: string;
  audiences: TeamAudience[];
};

export type SolutionOutcome = {
  icon?: string;
  title: string;
  description: string;
};

export type SolutionOutcomesBlock = {
  kicker?: string;
  title: string;
  description: string;
  items: SolutionOutcome[];
};

export type SolutionPageContent = {
  /** Short kicker above the hero headline, e.g. "Review Invitations". */
  kicker: string;
  /** Hero headline split into lines; last line gets the accent colour. */
  headline: { lead: string; accent: string };
  /** Sub-headline / value proposition paragraph. */
  valueProp: string;
  /** Primary CTA, typically signup / claim profile. */
  primaryCta: { label: string; href: string };
  /** Secondary CTA, typically open dashboard. */
  secondaryCta: { label: string; href: string };
  /** Hero image (real screenshot from /public/brand/...). */
  heroImage: { src: string; alt: string };
  /**
   * `edge` anchors the hero image to the bottom of the dark band (Review Invitations).
   * Default `center` vertically centers the image beside the copy.
   */
  heroImageAlign?: "center" | "edge";

  /** Three customer pain points covered in the Problem section. */
  problems: { title: string; description: string; icon?: string }[];

  /**
   * Optional override for the Problem section's H2 and supporting copy.
   * When omitted, the layout falls back to its generic defaults.
   */
  problemSectionTitle?: string;
  problemSectionDescription?: string;
  problemSectionKicker?: string;

  /**
   * Optional override for the Features ("Real capabilities") section's H2
   * and supporting copy. Defaults are used when omitted.
   */
  featuresSectionTitle?: string;
  featuresSectionDescription?: string;
  featuresSectionKicker?: string;

  /** Optional override for the FAQ section's H2 and intro paragraph. */
  faqSectionTitle?: string;
  faqSectionDescription?: string;

  /** "How Tellacity solves it". Short paragraph plus bullet list. */
  solution: {
    title: string;
    description: string;
    bullets: string[];
    screenshot: { src: string; alt: string };
  };

  /** Capabilities grid, pulled from the live dashboard. */
  features: SolutionFeature[];

  /**
   * Optional image displayed to the right of the features card on large
   * screens. When set, the "Real capabilities, not promises" section
   * switches from a single centered card to a two-column layout: the
   * features card on the left, the image on the right. Used on pages
   * where we have a polished product screenshot that pairs well with the
   * capabilities list.
   */
  featuresImage?: { src: string; alt: string };

  /** Trust block. Neutral, scale-focused, no inflated numbers. */
  trust: {
    title: string;
    description: string;
    stats: SolutionStat[];
  };

  /** Other product pages to cross-link at the bottom. */
  related: RelatedSolution[];

  /**
   * Optional FAQ block rendered below the final CTA. When present, the
   * layout also emits FAQPage JSON-LD automatically for SEO.
   */
  faqs?: SolutionFaq[];

  /**
   * Optional compact trust strip rendered immediately below the hero CTAs.
   * Small inline list with check glyphs. Keep entries short (2 to 4 words).
   */
  heroTrustStrip?: string[];

  /**
   * Optional "How it works" workflow section, rendered between Solution
   * and Features. Renders as a numbered, icon-led step timeline.
   */
  workflow?: SolutionWorkflow;

  /**
   * Optional "Why verified invitations matter" trust block, rendered
   * between Features and the dark Trust band. Renders the copy on the
   * left and an inline product-surface mock on the right when a `surface`
   * is set; otherwise renders as a single centered column.
   */
  verifiedTrust?: VerifiedTrustBlock;

  /**
   * Optional "Designed for modern teams" audience section, rendered
   * between the dark Trust band and the final CTA.
   */
  teams?: SolutionTeamsBlock;

  /**
   * Optional "More than review collection" business outcomes section,
   * rendered between the teams audience section and the final CTA.
   */
  outcomes?: SolutionOutcomesBlock;

  /**
   * Optional "Built for modern websites" platform / compatibility section.
   * Rendered between the dark Trust band and the ControlPlane / Teams blocks.
   */
  platforms?: SolutionPlatformsBlock;

  /**
   * Optional "One dashboard, every widget" control-plane section.
   * Rendered after the platforms section to reinforce centralised operations.
   */
  controlPlane?: SolutionControlPlaneBlock;

  /**
   * Optional "Designed for decision making" insights section. Rendered with
   * a sky-blue accent so it visually differentiates from the teal capability
   * cards and the amber outcome cards.
   */
  decisions?: SolutionDecisionsBlock;
};

const ACCENT = "#1FAF9E";
const ACCENT_BG = "#FBBF24";

/**
 * Shared keyframes + utility classes used across the consolidated "big card"
 * sections. Rendered once at the top of the main layout. Honours
 * `prefers-reduced-motion`.
 */
function SolutionStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes tellacity-fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tellacity-pulse-soft {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.05); }
}
.tellacity-anim-row {
  animation: tellacity-fade-in-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.tellacity-anim-glow {
  animation: tellacity-pulse-soft 7s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .tellacity-anim-row, .tellacity-anim-glow {
    animation: none !important;
  }
}
        `,
      }}
    />
  );
}

type BigCardRowsAccent = "teal" | "amber" | "sky";

type BigCardRowsItem = {
  icon?: string;
  title: string;
  description: string;
};

/**
 * Consolidates a list of icon + title + description items into ONE premium
 * big card with row separators, subtle glow ornaments, hover illumination,
 * and a staggered fade-in. Used in place of the previous N-card grids.
 *
 * `accent` controls the icon tile colour and the glow tint.
 * `variant` switches between light section background and dark section background.
 * `numbered` adds a small 01/02/03 prefix per row (used by the workflow section).
 */
function BigCardRows({
  items,
  accent = "teal",
  variant = "light",
  numbered = false,
  defaultIcon,
  compact = false,
}: {
  items: BigCardRowsItem[];
  accent?: BigCardRowsAccent;
  variant?: "light" | "dark";
  numbered?: boolean;
  defaultIcon?: string;
  /**
   * When true the outer wrapper drops its `mt-12 mx-auto max-w-5xl` so the
   * card fills its parent column exactly. Used inside the side-by-side
   * features-with-image layout where the parent grid controls placement.
   */
  compact?: boolean;
}) {
  const isDark = variant === "dark";

  // Resolve accent-specific styling via full literal class strings so the
  // Tailwind JIT can statically discover them.
  let iconBg: string;
  let iconColor: string;
  let glowColor: string;
  let hoverRingClass: string;
  let hoverShadowClass: string;
  let hoverArrowClass: string;
  let darkIconColor: string;
  if (accent === "amber") {
    iconBg = "#FEF3C7";
    iconColor = "#92400E";
    glowColor = "rgba(251,191,36,0.20)";
    hoverRingClass = "group-hover:ring-amber-400/50";
    hoverShadowClass = "group-hover:shadow-[0_0_24px_rgba(251,191,36,0.35)]";
    hoverArrowClass = isDark
      ? "group-hover:text-amber-300"
      : "group-hover:text-amber-700";
    darkIconColor = "#FCD34D";
  } else if (accent === "sky") {
    iconBg = "#E0F2FE";
    iconColor = "#0369A1";
    glowColor = "rgba(56,189,248,0.22)";
    hoverRingClass = "group-hover:ring-sky-400/50";
    hoverShadowClass = "group-hover:shadow-[0_0_24px_rgba(56,189,248,0.35)]";
    hoverArrowClass = isDark
      ? "group-hover:text-sky-300"
      : "group-hover:text-sky-700";
    darkIconColor = "#7DD3FC";
  } else {
    iconBg = "#E5F4F2";
    iconColor = "#0F766E";
    glowColor = "rgba(31,175,158,0.22)";
    hoverRingClass = "group-hover:ring-[#1FAF9E]/50";
    hoverShadowClass = "group-hover:shadow-[0_0_24px_rgba(31,175,158,0.40)]";
    hoverArrowClass = isDark
      ? "group-hover:text-[#5EE0CF]"
      : "group-hover:text-[#0F766E]";
    darkIconColor = "#5EE0CF";
  }

  const wrapperLayout = compact
    ? "relative w-full"
    : "relative mx-auto mt-12 w-full max-w-5xl";
  return (
    <div
      className={
        wrapperLayout +
        " overflow-hidden rounded-3xl border " +
        (isDark
          ? "border-white/10 bg-white/[0.03] backdrop-blur-sm"
          : "border-gray-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.06)]")
      }
    >
      <div
        aria-hidden
        className="tellacity-anim-glow pointer-events-none absolute -top-32 right-[-6rem] h-80 w-80 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="tellacity-anim-glow pointer-events-none absolute -bottom-32 left-[-6rem] h-80 w-80 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          animationDelay: "2s",
        }}
      />

      <ul className="relative grid grid-cols-1 gap-1 p-2 sm:grid-cols-2 sm:gap-2 sm:p-3">
        {items.map((item, idx) => (
          <li
            key={item.title}
            className={
              "tellacity-anim-row group relative flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 sm:[&:last-child:nth-child(odd)]:col-span-2 " +
              (isDark
                ? "hover:bg-white/[0.05]"
                : "hover:bg-gradient-to-r hover:from-gray-50 hover:via-gray-50/50 hover:to-transparent")
            }
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <span
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ring-1 transition-all duration-300 " +
                (isDark
                  ? "bg-white/[0.06] ring-white/10 group-hover:bg-white/[0.10] "
                  : "ring-gray-100 ") +
                hoverRingClass +
                " " +
                hoverShadowClass
              }
              style={
                isDark
                  ? { color: darkIconColor }
                  : { backgroundColor: iconBg, color: iconColor }
              }
              aria-hidden
            >
              {item.icon ?? defaultIcon ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className={
                  "text-[14px] font-semibold leading-snug sm:text-[15px] " +
                  (isDark ? "text-white" : "text-[#0E0E0E]")
                }
              >
                {numbered && (
                  <span
                    className={
                      "mr-1.5 text-[11px] font-semibold tabular-nums tracking-wider " +
                      (isDark ? "text-gray-500" : "text-gray-400")
                    }
                    aria-hidden
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                )}
                {item.title}
              </h3>
              <p
                className={
                  "mt-1 text-[13px] leading-relaxed " +
                  (isDark ? "text-gray-300/90" : "text-gray-600")
                }
              >
                {item.description}
              </p>
            </div>
            <span
              aria-hidden
              className={
                "hidden self-start pt-1 pl-1 text-sm opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:inline " +
                (isDark ? "text-gray-500 " : "text-gray-400 ") +
                hoverArrowClass
              }
            >
              →
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroSection({ content }: { content: SolutionPageContent }) {
  const heroImageEdge = content.heroImageAlign === "edge";

  return (
    <section
      className={`w-full bg-[#1a1a1a] ${heroImageEdge ? "overflow-hidden" : ""}`}
    >
      <div
        className={`mx-auto w-full max-w-7xl px-6 ${
          heroImageEdge ? "pt-16 pb-0 md:pt-20" : "py-16 md:py-20"
        }`}
      >
        <div
          className={`grid gap-10 md:grid-cols-2 ${
            heroImageEdge ? "md:items-end" : "md:items-center"
          }`}
        >
          <div className={`max-w-xl ${heroImageEdge ? "pb-16 md:pb-20" : ""}`}>
            <Link
              href="/reputation-platform"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-300 transition-colors hover:border-[#1FAF9E]/50 hover:text-white"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              />
              Part of the Tellacity Reputation Platform
              <span aria-hidden>→</span>
            </Link>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-gray-400">
              {content.kicker}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="block">{content.headline.lead}</span>
              <span className="block" style={{ color: ACCENT }}>
                {content.headline.accent}
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-300">
              {content.valueProp}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={content.primaryCta.href}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                style={{ backgroundColor: ACCENT_BG }}
              >
                {content.primaryCta.label}
              </Link>
              <Link
                href={content.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                {content.secondaryCta.label}
              </Link>
            </div>
            {content.heroTrustStrip && content.heroTrustStrip.length > 0 && (
              <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-300">
                {content.heroTrustStrip.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: ACCENT }}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={
              heroImageEdge
                ? "relative flex w-full items-end justify-center md:justify-end"
                : "relative flex items-center justify-center"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.heroImage.src}
              alt={content.heroImage.alt}
              className={
                heroImageEdge
                  ? "block h-auto w-full max-w-full object-contain object-bottom sm:max-w-5xl md:max-w-none md:w-[115%] lg:w-[130%] lg:max-w-[72rem]"
                  : "w-full max-w-3xl object-contain"
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection({
  problems,
  title,
  description,
  kicker,
}: {
  problems: SolutionPageContent["problems"];
  title?: string;
  description?: string;
  kicker?: string;
}) {
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
            {kicker ?? "The challenge"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {title ?? "Most teams already feel this pain."}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {description ??
              "Without a structured way to collect, surface, and respond to customer feedback, the same operational problems keep showing up."}
          </p>
        </div>
        <BigCardRows
          items={problems.map((p) => ({
            icon: p.icon,
            title: p.title,
            description: p.description,
          }))}
          accent="amber"
          defaultIcon="⚠️"
        />
      </div>
    </section>
  );
}

function SolutionSection({
  solution,
}: {
  solution: SolutionPageContent["solution"];
}) {
  return (
    <section className="w-full border-y border-gray-100 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={solution.screenshot.src}
              alt={solution.screenshot.alt}
              className="w-full rounded-3xl border border-gray-200 object-cover shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            />
          </div>
          <div className="order-1 md:order-2">
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              How Tellacity solves it
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              {solution.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {solution.description}
            </p>
            <ul className="mt-6 space-y-3">
              {solution.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-gray-700">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({
  features,
  featuresImage,
  title,
  description,
  kicker,
}: {
  features: SolutionFeature[];
  featuresImage?: { src: string; alt: string };
  title?: string;
  description?: string;
  kicker?: string;
}) {
  const cardItems = features.map((f) => ({
    icon: f.badge,
    title: f.title,
    description: f.description,
  }));
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: ACCENT }}
          >
            {kicker ?? "Built into the dashboard"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {title ?? "Real capabilities, not promises."}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {description ??
              "Every feature below is part of the live Tellacity business dashboard and is available the moment you claim your profile."}
          </p>
        </div>
        {featuresImage ? (
          <div className="mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuresImage.src}
              alt={featuresImage.alt}
              className="block h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        <BigCardRows items={cardItems} accent="teal" />
      </div>
    </section>
  );
}

function TrustSection({ trust }: { trust: SolutionPageContent["trust"] }) {
  return (
    <section className="w-full bg-[#0E0E0E] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="max-w-xl">
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              Built for scale
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {trust.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-300">
              {trust.description}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {trust.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-[#F5FAF9] via-white to-[#E5F4F2] p-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            Start with Tellacity today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">
            Claim your business profile, invite your first customers, and run
            your entire reputation programme from one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT_BG }}
            >
              Start free
            </Link>
            <Link
              href="/suggest-business"
              className="inline-flex items-center justify-center rounded-2xl border border-[#0E0E0E]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#0E0E0E] transition-colors hover:border-[#0E0E0E]/30"
            >
              Claim your business
            </Link>
            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({
  workflow,
}: {
  workflow: SolutionWorkflow | undefined;
}) {
  if (!workflow) return null;
  return (
    <section className="relative w-full overflow-hidden bg-[#0E0E0E] text-white">
      <div
        aria-hidden
        className="tellacity-anim-glow pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(31,175,158,0.18), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: ACCENT }}
          >
            {workflow.kicker ?? "How it works"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {workflow.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-300">
            {workflow.description}
          </p>
        </div>
        <BigCardRows
          items={workflow.steps.map((s) => ({
            icon: s.icon,
            title: s.title,
            description: s.description,
          }))}
          accent="teal"
          variant="dark"
          numbered
        />
      </div>
    </section>
  );
}

/**
 * Lightweight, on-brand mock of a Tellacity review widget embedded on a
 * customer's website.  Used inside the VerifiedTrustSection for the
 * /solutions/review-widgets page.
 */
function WidgetPreviewSurface() {
  const reviews: Array<{
    initials: string;
    name: string;
    stars: number;
    snippet: string;
  }> = [
    {
      initials: "SK",
      name: "Sarah K.",
      stars: 5,
      snippet:
        "Fast shipping, exactly as described. Will buy again. Already recommended to two colleagues.",
    },
    {
      initials: "DR",
      name: "Daniel R.",
      stars: 4,
      snippet:
        "Great quality and easy returns. Support team replied within an hour.",
    },
  ];
  function StarRow({ value }: { value: number }) {
    return (
      <span aria-hidden className="text-[#F59E0B]">
        {"★".repeat(value)}
        <span className="text-gray-300">{"★".repeat(5 - value)}</span>
      </span>
    );
  }
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-[#F8FAFC] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="mx-auto rounded-md bg-white px-3 py-1 text-[11px] text-gray-500">
          tellacity.com/your-store
        </span>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Customer Reviews
          </p>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <p className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
            4.8
          </p>
          <div>
            <StarRow value={5} />
            <p className="text-[11px] text-gray-500">
              4.8 / 5 · 12,408 verified reviews
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700"
                    aria-hidden
                  >
                    {r.initials}
                  </span>
                  <span className="text-sm font-medium text-[#0E0E0E]">
                    {r.name}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[#E5F4F2] px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]"
                  aria-hidden
                >
                  ✓ Verified
                </span>
              </div>
              <div className="mt-2 text-[13px]">
                <StarRow value={r.stars} />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-700">
                {r.snippet}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-[11px] text-gray-500">
          <span>Powered by Tellacity</span>
          <span className="font-semibold text-[#1FAF9E]">View all →</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight, on-brand mock of the analytics dashboard. Tailwind-only so it
 * stays sharp at any resolution. Used inside the VerifiedTrustSection for the
 * /solutions/business-analytics page.
 */
function AnalyticsSurface() {
  // Pre-shaped 12-point trust score series for the inline sparkline.
  const series = [4.1, 4.2, 4.15, 4.25, 4.3, 4.35, 4.4, 4.5, 4.55, 4.6, 4.65, 4.7];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const width = 220;
  const height = 56;
  const padX = 4;
  const padY = 6;
  const points = series
    .map((v, i) => {
      const x = padX + (i * (width - padX * 2)) / (series.length - 1);
      const yNorm = (v - min) / Math.max(0.0001, max - min);
      const y = padY + (1 - yNorm) * (height - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = series[series.length - 1];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Reputation overview
          </p>
          <p className="text-sm font-semibold text-[#0E0E0E]">Last 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-5">
        <div className="col-span-2 rounded-2xl border border-gray-100 bg-[#FAFBFC] p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Trust score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
              {last.toFixed(1)}
            </p>
            <span className="text-[11px] font-semibold text-[#0F766E]">
              ▲ +0.3
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-2 h-14 w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              fill="none"
              stroke="#1FAF9E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Reviews
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#0E0E0E]">
            1,284
          </p>
          <p className="mt-1 text-[11px] text-gray-500">verified</p>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="text-[11px] uppercase tracking-wider text-gray-500">
          Sentiment
        </p>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <span
            className="h-full bg-[#1FAF9E]"
            style={{ width: "78%" }}
            aria-label="Positive 78%"
          />
          <span
            className="h-full bg-amber-400"
            style={{ width: "14%" }}
            aria-label="Neutral 14%"
          />
          <span
            className="h-full bg-rose-400"
            style={{ width: "8%" }}
            aria-label="Negative 8%"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1FAF9E]" />
            Positive 78%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            Neutral 14%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
            Negative 8%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-gray-100 bg-[#F8FAFC] px-5 py-4 text-[11px]">
        <div>
          <p className="text-gray-500">Response rate</p>
          <p className="text-sm font-semibold text-[#0E0E0E]">94%</p>
        </div>
        <div>
          <p className="text-gray-500">Median reply</p>
          <p className="text-sm font-semibold text-[#0E0E0E]">2h 14m</p>
        </div>
        <div>
          <p className="text-gray-500">Verified share</p>
          <p className="text-sm font-semibold text-[#0E0E0E]">91%</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight mock of the reputation operations queue used inside the
 * VerifiedTrustSection for /solutions/reputation-management. Tailwind-only so
 * it stays crisp at any resolution.
 */
function ModerationSurface() {
  const items: Array<{
    label: string;
    detail: string;
    badge: string;
    icon: string;
    statusText: string;
    statusClass: string;
  }> = [
    {
      label: "Suspicious review pattern",
      detail: "★ 1 · multiple accounts · 6 reviews / 24h",
      badge: "Flag",
      icon: "🚩",
      statusText: "Investigating",
      statusClass: "bg-amber-100 text-amber-800",
    },
    {
      label: "Address mismatch on Branch 04",
      detail: "Profile dispute · raised by owner",
      badge: "Dispute",
      icon: "📝",
      statusText: "In review",
      statusClass: "bg-sky-100 text-sky-800",
    },
    {
      label: "Verified review awaiting reply",
      detail: "★ 5 · 2h ago · verified customer",
      badge: "Reply",
      icon: "💬",
      statusText: "Awaiting reply",
      statusClass: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Reputation operations
          </p>
          <p className="text-sm font-semibold text-[#0E0E0E]">Moderation queue</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Open flags
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            12
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Disputes
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            3
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Replies &lt; 24h
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            94%
          </p>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 px-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-3 px-3 py-3"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F6F8] text-base"
              aria-hidden
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-[#0E0E0E]">
                  {item.label}
                </p>
                <span className="hidden rounded-full border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-500 sm:inline-block">
                  {item.badge}
                </span>
              </div>
              <p className="truncate text-[11px] text-gray-500">{item.detail}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.statusClass}`}
            >
              {item.statusText}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-gray-100 bg-[#F8FAFC] px-5 py-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>📜</span>
          All actions logged
        </span>
        <span className="inline-flex items-center gap-2">
          Audit trail
          <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Lightweight mock of the visual review queue used inside the
 * VerifiedTrustSection for /solutions/photo-uploads. Renders four tasteful
 * gradient thumbnails (no external images) with verified / queued status and
 * product attribution chips. Tailwind only.
 */
function MediaSurface() {
  const tiles: Array<{
    product: string;
    rating: number;
    statusText: string;
    statusClass: string;
    gradient: string;
  }> = [
    {
      product: "Headphones, Studio Pro",
      rating: 5,
      statusText: "Verified",
      statusClass: "bg-[#1FAF9E]/15 text-[#0F766E]",
      gradient: "from-[#0E0E0E] via-[#1F2937] to-[#0F766E]",
    },
    {
      product: "Café, Branch 04",
      rating: 4,
      statusText: "Verified",
      statusClass: "bg-[#1FAF9E]/15 text-[#0F766E]",
      gradient: "from-amber-700 via-amber-500 to-orange-400",
    },
    {
      product: "Backpack, Trail 30L",
      rating: 5,
      statusText: "Awaiting moderation",
      statusClass: "bg-amber-100 text-amber-800",
      gradient: "from-slate-700 via-slate-500 to-slate-300",
    },
    {
      product: "Espresso machine, Atlas",
      rating: 4,
      statusText: "Verified",
      statusClass: "bg-[#1FAF9E]/15 text-[#0F766E]",
      gradient: "from-[#0369A1] via-sky-500 to-cyan-300",
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Visual review queue
          </p>
          <p className="text-sm font-semibold text-[#0E0E0E]">Media moderation</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            In queue
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            8
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Approved today
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            142
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFC] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Verified rate
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#0E0E0E]">
            96%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        {tiles.map((tile) => (
          <div
            key={tile.product}
            className="overflow-hidden rounded-2xl border border-gray-100"
          >
            <div
              className={`relative aspect-[4/3] w-full bg-gradient-to-br ${tile.gradient}`}
              aria-hidden
            >
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2.5 py-2">
                <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  {"★".repeat(tile.rating)}
                  {"☆".repeat(5 - tile.rating)}
                </span>
                <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-[#0E0E0E] backdrop-blur-sm">
                  EXIF stripped
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-white px-3 py-2">
              <p className="truncate text-[11px] text-gray-700">
                {tile.product}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${tile.statusClass}`}
              >
                {tile.statusText}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-[#F8FAFC] px-5 py-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>🛡</span>
          Auto-moderation · NSFW · duplicates
        </span>
        <span className="inline-flex items-center gap-2">
          Tied to verified reviews
          <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  );
}

function VerifiedTrustSection({
  block,
}: {
  block: VerifiedTrustBlock | undefined;
}) {
  if (!block) return null;
  const surface = block.surface;
  const surfaceElement =
    surface === "widget-preview" ? (
      <WidgetPreviewSurface />
    ) : surface === "analytics" ? (
      <AnalyticsSurface />
    ) : surface === "moderation" ? (
      <ModerationSurface />
    ) : surface === "media" ? (
      <MediaSurface />
    ) : null;
  // `surface` takes precedence; `image` is used only when no surface mock
  // is configured but the page still wants a visual companion.
  const imageBlock = !surfaceElement && block.image ? block.image : null;
  const hasVisual = Boolean(surfaceElement || imageBlock);
  return (
    <section className="w-full border-y border-gray-100 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div
          className={
            imageBlock
              ? "grid gap-10 md:grid-cols-2 md:items-center"
              : surfaceElement
                ? "grid gap-10 md:grid-cols-2 md:items-center"
                : "grid gap-10"
          }
        >
          <div
            className={
              hasVisual
                ? "flex max-w-xl flex-col"
                : "mx-auto max-w-3xl text-center"
            }
          >
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              {block.kicker ?? "Built on verification"}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              {block.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {block.description}
            </p>
            <ul
              className={
                hasVisual
                  ? "mt-6 space-y-3"
                  : "mt-6 space-y-3 text-left sm:mx-auto sm:max-w-2xl"
              }
            >
              {block.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-gray-700">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {surfaceElement ? (
            <div className="md:justify-self-end">{surfaceElement}</div>
          ) : imageBlock ? (
            <div className="flex w-full md:justify-self-end">
              <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageBlock.src}
                  alt={imageBlock.alt}
                  className="block h-auto w-full"
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PlatformsSection({
  block,
}: {
  block: SolutionPlatformsBlock | undefined;
}) {
  if (!block) return null;
  return (
    <section className="w-full border-y border-gray-100 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="max-w-xl">
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              {block.kicker ?? "Built for modern websites"}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              {block.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {block.description}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {block.attributes.map((attribute) => (
                <li key={attribute} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-gray-700">
                    {attribute}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {block.frameworks.map((framework) => (
              <div
                key={framework.name}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center transition-colors hover:border-[#1FAF9E]/40"
              >
                {framework.icon && (
                  <span className="text-lg" aria-hidden>
                    {framework.icon}
                  </span>
                )}
                <span className="mt-1 text-sm font-semibold text-[#0E0E0E]">
                  {framework.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlPlaneSection({
  block,
}: {
  block: SolutionControlPlaneBlock | undefined;
}) {
  if (!block) return null;
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: ACCENT }}
          >
            {block.kicker ?? "One dashboard, every widget"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {block.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {block.description}
          </p>
          {block.tagline && (
            <p
              className="mt-4 inline-block rounded-full border border-[#1FAF9E]/30 bg-[#E5F4F2] px-4 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#0F766E" }}
            >
              {block.tagline}
            </p>
          )}
        </div>
        <BigCardRows
          items={block.capabilities.map((c) => ({
            icon: c.icon,
            title: c.title,
            description: c.description,
          }))}
          accent="teal"
        />
      </div>
    </section>
  );
}

function DecisionsSection({
  block,
}: {
  block: SolutionDecisionsBlock | undefined;
}) {
  if (!block) return null;
  return (
    <section className="relative w-full border-y border-gray-100 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-sky-700">
            {block.kicker ?? "Designed for decision making"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {block.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {block.description}
          </p>
        </div>
        <BigCardRows
          items={block.items.map((i) => ({
            icon: i.icon,
            title: i.title,
            description: i.description,
          }))}
          accent="sky"
        />
      </div>
    </section>
  );
}

function TeamsSection({
  block,
}: {
  block: SolutionTeamsBlock | undefined;
}) {
  if (!block) return null;
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: ACCENT }}
          >
            {block.kicker ?? "Designed for modern teams"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {block.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {block.description}
          </p>
        </div>
        <BigCardRows
          items={block.audiences.map((a) => ({
            icon: a.icon,
            title: a.audience,
            description: a.value,
          }))}
          accent="teal"
        />
      </div>
    </section>
  );
}

function OutcomesSection({
  block,
}: {
  block: SolutionOutcomesBlock | undefined;
}) {
  if (!block) return null;
  return (
    <section className="relative w-full border-y border-gray-100 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
            {block.kicker ?? "More than review collection"}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {block.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {block.description}
          </p>
        </div>
        <BigCardRows
          items={block.items.map((i) => ({
            icon: i.icon,
            title: i.title,
            description: i.description,
          }))}
          accent="amber"
        />
      </div>
    </section>
  );
}

function FaqSection({
  faqs,
  title,
  description,
}: {
  faqs: SolutionFaq[] | undefined;
  title?: string;
  description?: string;
}) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="w-full border-t border-gray-100 bg-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            {title ?? "Frequently asked questions"}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {description ??
              "Quick answers to the most common questions about this part of the Tellacity platform."}
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors open:border-[#1FAF9E]/40 open:bg-[#F5FAF9]"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-[#0E0E0E]">
                <span>{faq.question}</span>
                <span
                  aria-hidden
                  className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-500 transition-transform duration-200 group-open:rotate-45 group-open:border-[#1FAF9E] group-open:text-[#1FAF9E]"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqJsonLd({ faqs }: { faqs: SolutionFaq[] | undefined }) {
  if (!faqs || faqs.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function RelatedSection({ related }: { related: RelatedSolution[] }) {
  if (!related || related.length === 0) return null;
  return (
    <section className="w-full border-t border-gray-100 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#0E0E0E] sm:text-3xl">
              Explore more solutions
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              The full Tellacity platform across review collection, widgets,
              analytics, and reputation.
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#1FAF9E]/40 hover:shadow-[0_18px_44px_rgba(31,175,158,0.15)]"
            >
              <p className="text-sm font-semibold text-[#0E0E0E]">{item.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                {item.description}
              </p>
              <span
                className="mt-4 inline-flex items-center text-xs font-semibold"
                style={{ color: ACCENT }}
              >
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SolutionPageLayout({
  content,
  jsonLd,
}: {
  content: SolutionPageContent;
  /** Optional Product / SoftwareApplication JSON-LD blob for SEO. */
  jsonLd?: ReactNode;
}) {
  return (
    <main className="bg-white">
      <SolutionStyles />
      {jsonLd}
      <HeroSection content={content} />
      <ProblemSection
        problems={content.problems}
        title={content.problemSectionTitle}
        description={content.problemSectionDescription}
        kicker={content.problemSectionKicker}
      />
      <SolutionSection solution={content.solution} />
      <WorkflowSection workflow={content.workflow} />
      <FeaturesSection
        features={content.features}
        featuresImage={content.featuresImage}
        title={content.featuresSectionTitle}
        description={content.featuresSectionDescription}
        kicker={content.featuresSectionKicker}
      />
      <VerifiedTrustSection block={content.verifiedTrust} />
      <TrustSection trust={content.trust} />
      <PlatformsSection block={content.platforms} />
      <ControlPlaneSection block={content.controlPlane} />
      <DecisionsSection block={content.decisions} />
      <TeamsSection block={content.teams} />
      <OutcomesSection block={content.outcomes} />
      <FinalCtaSection />
      <FaqSection
        faqs={content.faqs}
        title={content.faqSectionTitle}
        description={content.faqSectionDescription}
      />
      <FaqJsonLd faqs={content.faqs} />
      <RelatedSection related={content.related} />
    </main>
  );
}
