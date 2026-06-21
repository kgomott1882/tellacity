"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Crosshair,
  Eye,
  Globe,
  Heart,
  Network,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import type { JobSpec } from "./jobs";
import {
  CAREERS_HERO_UNSPLASH,
  CAREERS_IMAGES,
  CAREERS_UNSPLASH,
  GLOBAL_TEAM,
  HOW_WE_WORK,
  ROLE_SUMMARIES,
  VALUES,
  WHY_JOIN,
  chunkJobRows,
  deptPillClass,
  isValidSlug,
} from "./careersData";

const IO = 0.12;

type CareersClientProps = {
  jobs: JobSpec[];
};

export default function CareersClient({ jobs }: CareersClientProps) {
  const validJobs = jobs.filter((j) => isValidSlug(j.slug));
  const jobRows = chunkJobRows(validJobs);

  return (
    <main className="careers-cinematic">
      <HomeScrollProgress />

      {/* Hero */}
      <section className="careers-hero" aria-labelledby="careers-hero-title">
        <div
          className="careers-hero-bg"
          style={{ backgroundImage: `url(${CAREERS_HERO_UNSPLASH})` }}
          aria-hidden
        />
        <div className="careers-hero-overlay" aria-hidden />
        <div className="careers-hero-parallax" aria-hidden />
        <HeroStarField />
        <div className="careers-hero-layout">
          <div className="careers-hero-inner">
            <p className="careers-hero-crumb">Our values guide how we work</p>
            <span className="careers-hero-badge">CAREERS AT TELLACITY</span>
            <h1 id="careers-hero-title">
              <span className="careers-hero-title-line">Build Trust</span>
              <span className="careers-hero-title-accent">with Purpose</span>
            </h1>
            <p className="careers-hero-sub">
              Tellacity is a place to do meaningful work with people who care about
              transparency, fairness, and real impact.
            </p>
            <p className="careers-hero-sub careers-hero-sub--secondary">
              We build products that make reputation verifiable and fair. Learn more about{" "}
              <Link href="/about" className="careers-hero-link">
                Tellacity
              </Link>{" "}
              and what we stand for in{" "}
              <Link href="/safety-trust" className="careers-hero-link">
                Safety &amp; Trust
              </Link>
              .
            </p>
            <div className="careers-hero-ctas">
              <a href="#careers-jobs" className="careers-btn-primary">
                View Open Roles
              </a>
              <Link href="/contact" className="careers-btn-outline">
                Contact Talent →
              </Link>
            </div>
            <div className="careers-hero-trust">
              <span>✓ Remote-first</span>
              <span>✓ Mission-driven</span>
              <span>✓ Trust-focused work</span>
              <span>✓ Global team</span>
            </div>
          </div>
          <div className="careers-hero-float" aria-hidden>
            <div className="careers-hero-float-card">
              <p className="careers-hero-float-title">Open Roles</p>
              <div className="careers-hero-float-divider" />
              {validJobs.map((job) => (
                <div key={job.slug} className="careers-hero-float-row">
                  <span className="careers-hero-float-dot" />
                  <div>
                    <p className="careers-hero-float-role">{job.title}</p>
                    <p className="careers-hero-float-dept">{job.department}</p>
                  </div>
                </div>
              ))}
              <a href="#careers-jobs" className="careers-hero-float-link">
                All roles Remote →
              </a>
            </div>
          </div>
        </div>
        <div className="careers-hero-scroll" aria-hidden>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* Values */}
      <section className="careers-section careers-section--beige">
        <div className="careers-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title">
              Our <span className="careers-section-accent">Values</span>
            </h2>
            <p className="careers-section-sub">
              Not wall art. These are expectations for decisions, communication, and how we treat
              each other.
            </p>
            <p className="careers-section-copy">
              Our values guide how we work day to day, not as wall art, but as expectations
              for decisions, communication, and how we treat customers and each other.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="careers-banner-wrap">
            <div className="careers-banner">
              <Image
                src={CAREERS_IMAGES.valuesBanner}
                alt="Happy champions at Tellacity"
                width={1200}
                height={400}
                className="careers-banner-img"
              />
              <div className="careers-banner-overlay" aria-hidden />
              <div className="careers-banner-quote">
                <p>How we work day to day.</p>
                <p className="careers-banner-quote-accent">Not slogans. Actual expectations.</p>
              </div>
            </div>
          </FadeUp>
          <div className="careers-values-grid">
            {VALUES.map((value, i) => (
              <StaggerFadeUp key={value.title} index={i} staggerMs={80} threshold={IO}>
                <div className={`careers-value-card careers-value-card--${value.variant}`}>
                  <span className={`careers-icon-circle careers-icon-circle--${value.variant}`}>
                    <ValueIcon type={value.icon} />
                  </span>
                  <h3 className="careers-value-title">
                    <CheckCircle className="careers-value-check" aria-hidden />
                    {value.title}
                  </h3>
                  <p className="careers-value-body">{value.description}</p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="careers-section careers-section--white">
        <div className="careers-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title">
              How We <span className="careers-section-accent">Work</span>
            </h2>
          </FadeUp>
          <div className="careers-split">
            <FadeUp threshold={IO} className="careers-split-media">
              <Image
                src={CAREERS_IMAGES.boardroom}
                alt="Boardroom team at Tellacity"
                width={700}
                height={500}
                className="careers-split-main-img"
              />
              <Image
                src={CAREERS_IMAGES.howWeWorkOverlap}
                alt=""
                width={700}
                height={470}
                className="careers-split-overlap-img"
              />
            </FadeUp>
            <FadeUp threshold={IO} className="careers-split-copy">
              <p className="careers-lead">
                We value clear communication, thoughtful execution, and a healthy balance
                between focus and collaboration. Our teams are small, empowered, and trusted
                to deliver.
              </p>
              <p className="careers-lead">
                That means async-friendly updates, direct ownership of outcomes, and
                collaboration when cross-functional context improves the result, not meetings
                for their own sake.
              </p>
              <div className="careers-feature-rows">
                {HOW_WE_WORK.map((item) => (
                  <div key={item.title} className="careers-feature-row">
                    <span className={`careers-icon-circle careers-icon-circle--${item.variant} careers-icon-circle--sm`}>
                      <WorkIcon type={item.icon} />
                    </span>
                    <div>
                      <h3 className="careers-feature-title">{item.title}</h3>
                      <p className="careers-feature-detail">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="careers-tagline">
                Async-friendly. Direct ownership. Collaboration when it matters.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section id="careers-jobs" className="careers-section careers-section--dark">
        <div
          className="careers-section-dark-bg"
          style={{ backgroundImage: `url(${CAREERS_UNSPLASH.jobsBg})` }}
          aria-hidden
        />
        <div className="careers-section-inner careers-section-inner--relative">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title careers-section-title--light">
              <span className="careers-section-accent">Opportunity</span> Unlocked
            </h2>
            <p className="careers-section-sub careers-section-sub--light">
              We&apos;re growing quickly and building a team that cares about trust,
              transparency, and impact.
            </p>
            <p className="careers-section-sub careers-section-sub--light">
              We are hiring across product, engineering, trust, moderation, and business
              functions as we scale the{" "}
              <Link href="/for-business" className="careers-inline-link">
                business platform
              </Link>{" "}
              and{" "}
              <Link href="/for-business" className="careers-inline-link">
                reputation infrastructure
              </Link>
              .
            </p>
            <p className="careers-section-sub careers-section-sub--light">
              Each role contributes directly to the product, reputation, or growth engine
              behind Tellacity.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="careers-banner-wrap">
            <div className="careers-banner careers-banner--jobs">
              <Image
                src={CAREERS_IMAGES.jobsBanner}
                alt=""
                width={1200}
                height={400}
                className="careers-banner-img"
              />
              <div className="careers-banner-overlay careers-banner-overlay--jobs" aria-hidden />
            </div>
          </FadeUp>
          <div className="careers-jobs-grid">
            {jobRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`careers-jobs-row careers-jobs-row--${row.length}`}
              >
                {row.map((job, i) => (
                  <JobCard key={job.slug} job={job} index={rowIdx * 3 + i} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="careers-section careers-section--beige">
        <div className="careers-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title">
              Why Join <span className="careers-section-accent">Tellacity?</span>
            </h2>
            <p className="careers-section-sub">
              Real problems in trust, reviews, and transparency, not recruitment slogans.
            </p>
            <p className="careers-section-copy">
              You can expect a practical, mission-driven environment, not generic recruitment
              slogans, but real problems in trust, reviews, and transparency.
            </p>
          </FadeUp>
          <FadeUp threshold={IO} className="careers-banner-wrap">
            <div className="careers-banner careers-banner--why">
              <Image
                src={CAREERS_IMAGES.whyJoinBanner}
                alt="Sunset Beach team moment at Tellacity"
                width={1200}
                height={400}
                className="careers-banner-img"
              />
              <div className="careers-banner-overlay" aria-hidden />
              <p className="careers-banner-quote careers-banner-quote--sm">
                Purpose-driven work that actually matters.
              </p>
            </div>
          </FadeUp>
          <div className="careers-why-grid">
            {WHY_JOIN.map((item, i) => (
              <StaggerFadeUp key={item.title} index={i} staggerMs={70} threshold={IO}>
                <div className={`careers-why-card careers-why-card--${item.accent}`}>
                  <span className={`careers-icon-circle careers-icon-circle--${item.accent}`}>
                    <WhyIcon type={item.icon} />
                  </span>
                  <h3 className="careers-why-title">{item.title}</h3>
                  <p className="careers-why-body">
                    {item.detail}
                    {"link" in item && item.link ? (
                      <Link href={item.link.href} className="careers-text-link">
                        {item.link.label}
                      </Link>
                    ) : null}
                    {"suffix" in item ? item.suffix : null}
                  </p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Global team */}
      <section className="careers-section careers-section--white">
        <div className="careers-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title">
              One <span className="careers-section-accent">Global Team</span>
            </h2>
            <p className="careers-section-sub">
              We work across regions with a shared mission to make trust more transparent
              and accessible for everyone.
            </p>
          </FadeUp>
          <div className="careers-split careers-split--reverse">
            <FadeUp threshold={IO} className="careers-split-copy">
              <div className="careers-bullet-rows">
                {GLOBAL_TEAM.map((item) => (
                  <div key={item.title} className="careers-bullet-row">
                    <span className="careers-bullet" aria-hidden>
                      ●
                    </span>
                    <div>
                      <h3 className="careers-bullet-title">{item.title}</h3>
                      <p className="careers-bullet-detail">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="careers-section-copy">
                Distributed collaboration helps us build a more accessible trust platform,
                and reflects how our customers use Tellacity across markets.{" "}
                <Link href="/investor-relations" className="careers-text-link">
                  Read more from investor relations about our global footprint →
                </Link>
              </p>
            </FadeUp>
            <FadeUp threshold={IO} className="careers-split-media careers-split-media--stack">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CAREERS_UNSPLASH.globalTop}
                alt=""
                className="careers-split-main-img"
                loading="lazy"
                decoding="async"
              />
              <Image
                src={CAREERS_IMAGES.officeDiscussion}
                alt=""
                width={500}
                height={320}
                className="careers-split-overlap-img careers-split-overlap-img--left"
              />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="careers-section careers-section--beige">
        <div className="careers-section-inner">
          <FadeUp threshold={IO}>
            <h2 className="careers-section-title">
              Don&apos;t See the <span className="careers-section-accent">Right Role?</span>
            </h2>
          </FadeUp>
          <div className="careers-split">
            <FadeUp threshold={IO} className="careers-split-media">
              <Image
                src={CAREERS_IMAGES.contactMain}
                alt=""
                width={700}
                height={470}
                className="careers-split-main-img"
              />
            </FadeUp>
            <FadeUp threshold={IO} className="careers-split-copy careers-contact-copy">
              <p className="careers-lead">
                Don&apos;t see the right role? Send us your profile and tell us how you&apos;d
                like to contribute. We review general applications and keep strong candidates
                in mind for future openings.
              </p>
              <div className="careers-contact-rows">
                <div className="careers-contact-row">
                  <span className="careers-icon-circle careers-icon-circle--teal careers-icon-circle--sm">
                    <Briefcase className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="careers-contact-label">General Applications</p>
                    <p className="careers-contact-desc">We review and keep strong candidates</p>
                  </div>
                </div>
                <div className="careers-contact-row">
                  <span className="careers-icon-circle careers-icon-circle--forest careers-icon-circle--sm">
                    <Globe className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="careers-contact-label">All Roles Remote</p>
                    <p className="careers-contact-desc">Location is not a barrier to ownership</p>
                  </div>
                </div>
                <div className="careers-contact-row">
                  <span className="careers-icon-circle careers-icon-circle--teal careers-icon-circle--sm">
                    <Users className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="careers-contact-label">Mission-driven Culture</p>
                    <p className="careers-contact-desc">Join people who care about fairness</p>
                  </div>
                </div>
              </div>
              <Link href="/contact" className="careers-contact-cta">
                Contact Talent →
              </Link>
              <p className="careers-contact-footnote">
                Tellacity&apos;s careers and culture are shaped by the same trust principles
                that guide our product. See{" "}
                <Link href="/safety-trust" className="careers-text-link">
                  Safety &amp; Trust
                </Link>{" "}
                and the{" "}
                <Link href="/for-business" className="careers-text-link">
                  Reputation Platform
                </Link>{" "}
                to understand what we build and why it matters.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="careers-final-cta" aria-labelledby="careers-final-title">
        <div className="careers-section-inner careers-final-inner">
          <FadeUp threshold={IO}>
            <span className="careers-final-badge">JOIN THE TEAM</span>
            <h2 id="careers-final-title" className="careers-final-title">
              <span>Build the Trust</span>
              <span className="careers-final-accent">Economy with Us</span>
            </h2>
            <p className="careers-final-sub">
              See{" "}
              <Link href="/safety-trust" className="careers-inline-link">
                Safety &amp; Trust
              </Link>{" "}
              and the{" "}
              <Link href="/for-business" className="careers-inline-link">
                Reputation Platform
              </Link>{" "}
              to understand what we build and why it matters.
            </p>
            <div className="careers-final-btns">
              <a href="#careers-jobs" className="careers-btn-primary">
                View Open Roles
              </a>
              <Link href="/contact" className="careers-btn-outline">
                Contact Talent →
              </Link>
            </div>
            <p className="careers-final-trust">
              ✓ Remote-first &nbsp; ✓ Mission-driven &nbsp; ✓ Trust-focused
            </p>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}

function JobCard({ job, index }: { job: JobSpec; index: number }) {
  const slug = job.slug.trim().toLowerCase();
  const summary = ROLE_SUMMARIES[slug];

  return (
    <StaggerFadeUp index={index} staggerMs={80} threshold={IO}>
      <Link href={`/careers/${slug}`} className="careers-job-card">
        <div className="careers-job-card-top">
          {job.department ? (
            <span className={deptPillClass(job.department)}>{job.department}</span>
          ) : null}
          <span className="careers-remote-pill">
            <Globe className="h-3 w-3" aria-hidden />
            {job.location}
          </span>
        </div>
        <h3 className="careers-job-title">{job.title}</h3>
        {summary ? (
          <>
            <p className="careers-job-work">{summary.work}</p>
            <p className="careers-job-fit">{summary.fit}</p>
          </>
        ) : null}
        <div className="careers-job-divider" />
        <span className="careers-job-apply">
          Apply now → <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
    </StaggerFadeUp>
  );
}

function ValueIcon({ type }: { type: (typeof VALUES)[number]["icon"] }) {
  const cls = "h-6 w-6 text-white";
  switch (type) {
    case "shield":
      return <Shield className={cls} aria-hidden />;
    case "eye":
      return <Eye className={cls} aria-hidden />;
    case "heart":
      return <Heart className={cls} aria-hidden />;
    case "target":
      return <Target className={cls} aria-hidden />;
    default:
      return <TrendingUp className={cls} aria-hidden />;
  }
}

function WorkIcon({ type }: { type: (typeof HOW_WE_WORK)[number]["icon"] }) {
  const cls = "h-4 w-4 text-white";
  if (type === "globe") return <Globe className={cls} aria-hidden />;
  if (type === "users") return <Users className={cls} aria-hidden />;
  return <Crosshair className={cls} aria-hidden />;
}

function WhyIcon({ type }: { type: (typeof WHY_JOIN)[number]["icon"] }) {
  const cls = "h-5 w-5 text-white";
  switch (type) {
    case "users":
      return <Users className={cls} aria-hidden />;
    case "eye":
      return <Eye className={cls} aria-hidden />;
    case "zap":
      return <Zap className={cls} aria-hidden />;
    case "globe":
      return <Globe className={cls} aria-hidden />;
    case "shield":
      return <Shield className={cls} aria-hidden />;
    default:
      return <Network className={cls} aria-hidden />;
  }
}
