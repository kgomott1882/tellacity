"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BarChart2,
  Bell,
  Building2,
  Check,
  ChevronDown,
  Database,
  Eye,
  Globe,
  MapPin,
  MessageSquare,
  Scale,
  Send,
  Shield,
  ShoppingBag,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import HeroStarField from "@/components/home/HeroStarField";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import ForBusinessPlatformSections from "./ForBusinessPlatformSections";
import {
  AUDIENCES,
  CONVERSION_POINTS,
  FAQ_ITEMS,
  FEATURES,
  GOAL_ITEMS,
  GOAL_TAGS,
  INTEGRATION_POINTS,
  INTEGRATIONS,
  LEADER_POINTS,
  MARQUEE_TEXT,
  PRINCIPLES,
  REVIEW_FLOW_STEPS,
  SIZE_ITEMS,
  SIZE_TAGS,
  TRANSPARENCY_POINTS,
} from "./forBusinessData";

const IO = 0.12;

type FeatureIcon = (typeof FEATURES)[number]["icon"];

function FeatureIconEl({ type, accent }: { type: FeatureIcon; accent: "teal" | "forest" }) {
  const cls = "h-4 w-4";
  const icon =
    type === "send" ? (
      <Send className={cls} aria-hidden />
    ) : type === "badgeCheck" ? (
      <BadgeCheck className={cls} aria-hidden />
    ) : type === "shield" ? (
      <Shield className={cls} aria-hidden />
    ) : type === "globe" ? (
      <Globe className={cls} aria-hidden />
    ) : type === "barChart2" ? (
      <BarChart2 className={cls} aria-hidden />
    ) : (
      <Building2 className={cls} aria-hidden />
    );

  return (
    <span
      className={`fb-feature-icon ${accent === "teal" ? "fb-feature-icon--teal" : "fb-feature-icon--forest"}`}
    >
      {icon}
    </span>
  );
}

function FlowStepIcon({ type }: { type: (typeof REVIEW_FLOW_STEPS)[number]["icon"] }) {
  const cls = "h-5 w-5";
  switch (type) {
    case "userCheck":
      return <UserCheck className={cls} aria-hidden />;
    case "bell":
      return <Bell className={cls} aria-hidden />;
    case "messageSquare":
      return <MessageSquare className={cls} aria-hidden />;
    default:
      return <TrendingUp className={cls} aria-hidden />;
  }
}

function LeaderIcon({ type, accent }: { type: (typeof LEADER_POINTS)[number]["icon"]; accent: "teal" | "forest" }) {
  const cls = `fb-leader-icon ${accent === "forest" ? "fb-leader-icon--forest" : ""}`.trim();
  switch (type) {
    case "badgeCheck":
      return <BadgeCheck className={cls} aria-hidden />;
    case "eye":
      return <Eye className={cls} aria-hidden />;
    case "scale":
      return <Scale className={cls} aria-hidden />;
    default:
      return <TrendingUp className={cls} aria-hidden />;
  }
}

function AudienceIcon({ type }: { type: (typeof AUDIENCES)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "mapPin":
      return <MapPin className={cls} aria-hidden />;
    case "shoppingBag":
      return <ShoppingBag className={cls} aria-hidden />;
    default:
      return <TrendingUp className={cls} aria-hidden />;
  }
}

export default function ForBusinessClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const marqueeItems = Array.from({ length: 3 }, (_, i) => (
    <span key={i} className="fb-marquee-item">
      {MARQUEE_TEXT}
    </span>
  ));

  return (
    <main className="fb-cinematic">
      <HomeScrollProgress />

      {/* 1. Hero */}
      <section className="fb-hero" aria-labelledby="fb-hero-title">
        <div className="fb-hero-bg" aria-hidden />
        <HeroStarField />
        <div className="fb-hero-inner">
          <div className="fb-hero-grid">
            <div>
              <span className="fb-hero-badge">VERIFIED REVIEWS · REAL GROWTH</span>
              <h1 id="fb-hero-title">
                <span className="fb-hero-h1-line">Your Reputation Is</span>
                <span className="fb-hero-h1-accent">Your Strongest</span>
                <span className="fb-hero-h1-line">Growth Channel</span>
              </h1>
              <p className="fb-hero-sub">
                Turn verified customer reviews and real customer feedback into
                powerful insights, build trust, and attract new customers.
              </p>
              <div className="fb-hero-ctas">
                <Link href="/business/signup" className="fb-btn-primary">
                  Claim Free Profile
                </Link>
                <Link href="/pricing" className="fb-btn-outline-white">
                  View Pricing →
                </Link>
              </div>
              <div className="fb-hero-trust">
                <span>✓ Start free — no card required</span>
                <span>·</span>
                <span>✓ Free to start</span>
                <span>·</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>
            <div className="fb-hero-visual">
              <div className="fb-hero-glow" aria-hidden />
              <div className="fb-hero-dash">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Tellacity%20Dash.png"
                  alt="Tellacity reputation dashboard"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="fb-hero-feedback">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Review%20Feedback.jpeg"
                  alt="Customer review feedback on Tellacity"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Social proof ticker */}
      <div className="fb-marquee" aria-hidden>
        <div className="fb-marquee-track">{marqueeItems}</div>
      </div>

      {/* 3. Why Tellacity for Business */}
      <FadeUp threshold={IO} className="fb-why">
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-accent">Why Tellacity </span>
            <span className="fb-section-dark">for Business</span>
          </h2>
          <div className="fb-why-grid">
            <div>
              <p className="fb-why-lead">
                Tellacity helps businesses collect feedback, respond publicly, and build
                durable trust instead of chasing short-term campaigns. You get a reputation
                system designed for transparency, not manipulation.
              </p>
              <p className="fb-why-lead">
                Reputation compounds over time: verified reviews, thoughtful responses, and
                visible trust signals work together to attract new customers long after a
                single marketing push ends.
              </p>
              <div className="fb-why-links">
                <Link href="/how-tellacity-works" className="fb-inline-link">
                  See how Tellacity works →
                </Link>
                <Link href="#platform-modules" className="fb-inline-link fb-inline-link--forest">
                  Explore platform modules →
                </Link>
              </div>
            </div>
            <div>
              {PRINCIPLES.map((item) => (
                <div key={item.num} className="fb-principle-row">
                  <span className="fb-principle-num" aria-hidden>
                    {item.num}
                  </span>
                  <h3 className="fb-principle-title">{item.title}</h3>
                  <p className="fb-principle-desc">{item.description}</p>
                  <p className="fb-sr-detail">{item.explain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      <ForBusinessPlatformSections part="problem" />

      {/* 4. Everything You Need */}
      <FadeUp threshold={IO}>
        <div className="fb-section-inner">
          <h2 className="fb-section-title" style={{ textAlign: "center" }}>
            <span className="fb-section-dark">Everything You Need </span>
            <span className="fb-section-accent">to Scale Trust</span>
          </h2>
          <p className="fb-features-sub">
            Everything you need to collect, manage, and showcase customer feedback, designed
            to build trust at every customer touchpoint. From automated collection to analytics
            and public profiles, Tellacity gives you practical tools to turn verified feedback
            into a growth engine, not a side project.
          </p>
          <div className="fb-features-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/People_on_streets_using_mobile.jpeg"
              alt="People using mobile devices to share customer feedback"
              loading="lazy"
              decoding="async"
            />
            <div className="fb-features-banner-overlay">
              <p className="fb-features-banner-text">Scale trust with customer feedback</p>
            </div>
          </div>
          <div className="fb-features-grid">
            {FEATURES.map((item, index) => (
              <StaggerFadeUp key={item.title} index={index} staggerMs={70} threshold={IO}>
                <article className="fb-feature-card">
                  <div className="fb-feature-card-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="fb-feature-card-body">
                    <FeatureIconEl type={item.icon} accent={item.accent} />
                    <h3 className="fb-feature-title">{item.title}</h3>
                    <p className="fb-feature-copy">{item.copy}</p>
                    <p className="fb-sr-detail">{item.detail}</p>
                    <span className="fb-feature-footer">Learn more →</span>
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
          </div>
          <Link href="/pricing" className="fb-features-pricing-link">
            View pricing to see how plans fit your stage →
          </Link>
        </div>
      </FadeUp>

      {/* 5. Fair & Transparent */}
      <FadeUp threshold={IO} className="fb-transparency">
        <div className="fb-transparency-bg" aria-hidden />
        <div className="fb-section-inner">
          <h2 className="fb-section-title" style={{ color: "#fff" }}>
            Built for Honest{" "}
            <span className="fb-section-accent">Transparent Reviews</span>
          </h2>
          <p className="fb-sr-detail">
            Tellacity is designed to protect authentic customer feedback. Businesses can
            respond, improve, and build trust without manipulation, pay-to-hide tactics, or
            review blackmail. The right to reply publicly means you can address concerns in
            the open, and transparency benefits everyone: customers see fair treatment, and
            businesses earn credibility for how they handle feedback.
          </p>
          <div className="fb-transparency-grid">
            <div className="fb-transparency-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Shopping%20Safety.png"
                alt="Fair, transparent customer reviews"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              {TRANSPARENCY_POINTS.map((item) => (
                <div key={item.title} className="fb-transparency-row">
                  <Check className="fb-transparency-check h-5 w-5 shrink-0" aria-hidden />
                  <div>
                    <h3 className="fb-transparency-row-title">{item.title}</h3>
                    <p className="fb-transparency-row-desc">{item.description}</p>
                    <p className="fb-sr-detail">{item.detail}</p>
                  </div>
                </div>
              ))}
              <div className="fb-transparency-links">
                <Link href="/safety-trust" className="fb-btn-outline-pill">
                  Read Safety &amp; Trust →
                </Link>
                <Link href="/reviewer-guidelines" className="fb-inline-link">
                  Reviewer Guidelines →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 6. Convert Visitors */}
      <FadeUp threshold={IO} className="fb-convert">
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-accent">Convert Visitors </span>
            <span className="fb-section-dark">Into Customers</span>
          </h2>
          <p className="fb-sr-detail">
            Verified reviews and public replies reduce friction and increase confidence when
            prospects compare options. Profile photos and trust signals on your Tellacity page
            help visitors feel they know your business before they reach out.
          </p>
          <div className="fb-convert-parallax">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/People_laughing_at_work.jpeg"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className="fb-convert-parallax-overlay">
              <p className="fb-convert-parallax-text">Verified reviews reduce friction.</p>
              <p className="fb-convert-parallax-text">Public replies build confidence.</p>
            </div>
          </div>
          <div className="fb-convert-split">
            <div>
              {CONVERSION_POINTS.map((item) => (
                <div key={item.title} className="fb-convert-row">
                  <span className="fb-convert-bullet" aria-hidden>
                    →
                  </span>
                  <div>
                    <h3 className="fb-convert-row-title">{item.title}</h3>
                    <p className="fb-convert-row-desc">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="fb-convert-side-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/truststartators.jpg"
                alt="Engage with customers through verified reviews"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 7. How Reviews Work */}
      <FadeUp threshold={IO}>
        <div className="fb-section-inner">
          <h2 className="fb-section-title" style={{ textAlign: "center" }}>
            <span className="fb-section-dark">How Customer Reviews </span>
            <span className="fb-section-accent">Work on Tellacity</span>
          </h2>
          <p className="fb-features-sub">
            Every customer review helps businesses improve and helps future customers make
            better decisions. The four-step flow keeps the system fair and responsive:
            customers share verified experiences, businesses are notified immediately,
            responses resolve issues in the open, and trust signals update automatically for
            everyone who follows your reputation.
          </p>
          <div className="fb-flow-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/How%20it%20Works.jpeg"
              alt="How customer reviews work on Tellacity"
              loading="lazy"
              decoding="async"
            />
            <div className="fb-flow-banner-overlay">
              <p className="fb-flow-banner-text">Fair · Verified · Transparent</p>
            </div>
          </div>
          <div className="fb-flow-steps">
            {REVIEW_FLOW_STEPS.map((step, index) => (
              <StaggerFadeUp key={step.title} index={index} staggerMs={120} threshold={IO}>
                <div className="fb-flow-step">
                  <div className="fb-flow-step-num">
                    <FlowStepIcon type={step.icon} />
                  </div>
                  <h3 className="fb-flow-step-title">{step.title}</h3>
                  <p className="fb-flow-step-desc">{step.description}</p>
                </div>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 8. Integrations */}
      <FadeUp threshold={IO} className="fb-integrations">
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-dark">Works With the Tools </span>
            <span className="fb-section-accent">You Already Use</span>
          </h2>
          <p className="fb-sr-detail">
            Tellacity fits seamlessly into your existing workflow so collecting, managing, and
            showcasing reviews happens automatically, without changing how your team works.
            Integrations and automation mean less manual work and more consistent reputation
            management, review requests, data sync, and social proof stay in step with the tools
            you already rely on.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            {INTEGRATION_POINTS.map((item) => (
              <div key={item.title} className="fb-integration-row">
                <Check className="h-5 w-5 shrink-0 text-[#00B4A6]" aria-hidden />
                <div>
                  <h3 className="text-sm font-bold text-[#124541]">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="fb-logo-grid">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.name} className="fb-logo-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/brand/${integration.logo}`}
                  alt={`${integration.name} logo`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <p className="fb-integrations-note">
            And many more via direct integrations and automation.
          </p>
          <div className="fb-integrations-cta">
            <Link href="/business/signup" className="fb-btn-primary">
              Get Started for Free
            </Link>
          </div>
        </div>
      </FadeUp>

      <ForBusinessPlatformSections part="platform" />

      {/* 9. Trust Is Infrastructure */}
      <FadeUp threshold={IO} className="fb-manifesto">
        <div className="fb-manifesto-bg" aria-hidden />
        <div className="fb-section-inner fb-manifesto-inner">
          <h2 className="fb-manifesto-quote">
            Trust Isn&apos;t Marketing.
            <br />
            <span className="fb-manifesto-quote-accent">It&apos;s Infrastructure.</span>
          </h2>
          <p className="fb-manifesto-sub">
            Reviews aren&apos;t campaigns. They&apos;re signals. Tellacity helps you build a
            reputation system that compounds over time. Marketing campaigns come and go; durable
            reputation infrastructure keeps working, collecting feedback, surfacing trust, and
            strengthening credibility with every verified review and response.
          </p>
          <p className="fb-sr-detail">
            That is how long-term trust becomes a sustainable growth channel, not a one-season
            push.
          </p>
          <div className="fb-manifesto-cards">
            <div className="fb-manifesto-card">
              <h3 className="fb-manifesto-card-title">
                <Database className="h-5 w-5 text-[#00B4A6]" aria-hidden />
                Reputation Infrastructure
              </h3>
              <p className="fb-manifesto-card-body">
                Tellacity connects the full reputation loop: collect verified feedback, respond
                transparently, showcase credibility, and improve from insights, all in one system
                built for sustainable growth.
              </p>
              <p className="fb-sr-detail">
                Choose the goals and scale that match your business today, knowing the same
                infrastructure grows with you.
              </p>
            </div>
            <div className="fb-manifesto-card">
              <h3 className="fb-manifesto-card-title">
                <Target className="h-5 w-5 text-[#00B4A6]" aria-hidden />
                By Business Goal
              </h3>
              <div className="fb-tag-row">
                {GOAL_TAGS.map((tag) => (
                  <span key={tag} className="fb-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
              {GOAL_ITEMS.map((item) => (
                <p key={item.title} className="fb-sr-detail">
                  {item.title}: {item.copy}
                </p>
              ))}
            </div>
            <div className="fb-manifesto-card">
              <h3 className="fb-manifesto-card-title">
                <Building2 className="h-5 w-5 text-[#00B4A6]" aria-hidden />
                By Business Size
              </h3>
              <div className="fb-tag-row">
                {SIZE_TAGS.map((tag) => (
                  <span key={tag} className="fb-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
              {SIZE_ITEMS.map((item) => (
                <p key={item.title} className="fb-sr-detail">
                  {item.title}: {item.copy}
                </p>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 10. Who Tellacity Is For */}
      <FadeUp threshold={IO}>
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-accent">Who Tellacity </span>
            <span className="fb-section-dark">Is For</span>
          </h2>
          <p className="fb-features-sub" style={{ textAlign: "left", marginLeft: 0, maxWidth: "42rem" }}>
            Whether you serve customers locally, sell online, or scale across teams, Tellacity
            adapts to how you collect feedback and build trust.
          </p>
          <div className="fb-audience-grid">
            {AUDIENCES.map((item) => (
              <article key={item.title} className="fb-audience-card">
                <div className="fb-audience-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="fb-audience-body">
                  <span
                    className={`fb-feature-icon ${item.accent === "teal" ? "fb-feature-icon--teal" : "fb-feature-icon--forest"}`}
                  >
                    <AudienceIcon type={item.icon} />
                  </span>
                  <h3 className="fb-feature-title">{item.title}</h3>
                  <p className="fb-feature-copy">{item.detail}</p>
                  <span
                    className={`fb-audience-tag ${item.accent === "teal" ? "fb-audience-tag--teal" : "fb-audience-tag--forest"}`}
                  >
                    {item.tag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* 11. FAQ */}
      <FadeUp threshold={IO} className="fb-faq">
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-dark">Common Questions </span>
            <span className="fb-section-accent">Answered</span>
          </h2>
          <p className="fb-sr-detail">
            Straight answers to what business owners ask most. For more detail, visit the FAQ or
            Help Center.
          </p>
          <div className="fb-faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className={`fb-faq-item${isOpen ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="fb-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.question}
                    <ChevronDown className="fb-faq-chevron h-5 w-5" aria-hidden />
                  </button>
                  <div className="fb-faq-panel">
                    <div className="fb-faq-panel-inner">
                      <p className="fb-faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fb-faq-links">
            <Link href="/faq" className="fb-inline-link">
              Visit FAQ →
            </Link>
            <Link href="/help-center" className="fb-inline-link">
              Help Center →
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* 12. Why Leaders Choose */}
      <FadeUp threshold={IO}>
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-dark">Why Industry Leaders </span>
            <span className="fb-section-accent">Choose Tellacity</span>
          </h2>
          <p className="fb-features-sub">
            Star ratings alone are not enough. Leaders choose Tellacity because verified
            feedback, transparent policies, and fair treatment create reputation customers can
            trust for the long run.
          </p>
          <div className="fb-leaders-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/Boardroom%20people.png"
              alt="Industry leaders choosing Tellacity"
              loading="lazy"
              decoding="async"
            />
            <div className="fb-leaders-banner-overlay" aria-hidden />
          </div>
          <div className="fb-leaders-grid">
            {LEADER_POINTS.map((item) => (
              <div
                key={item.title}
                className={`fb-leader-card${item.accent === "forest" ? " fb-leader-card--forest" : ""}`}
              >
                <LeaderIcon type={item.icon} accent={item.accent} />
                <div>
                  <h3 className="text-sm font-bold text-[#124541]">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Preserved: Complete Reputation Operating System */}
      <FadeUp threshold={IO} className="fb-os">
        <div className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-dark">The Complete Reputation </span>
            <span className="fb-section-accent">Operating System</span>
          </h2>
          <p className="fb-os-copy">
            Tellacity unifies feedback collection, response, analytics, and social proof into
            one workflow, so reputation is managed as a system, not a scattered set of tools.
          </p>
          <p className="fb-os-copy">
            That unified approach supports sustainable growth: trust compounds as verified
            reviews, public replies, performance insights, and published articles work together
            over time.
          </p>
          <p className="fb-os-copy">
            Already have an account?{" "}
            <Link href="/business/login" className="fb-inline-link fb-inline-link--forest">
              Sign in to your business dashboard
            </Link>
            .
          </p>
        </div>
      </FadeUp>

      {/* 13. Final CTA */}
      <FadeUp threshold={IO} className="fb-final-cta">
        <div className="fb-final-cta-bg" aria-hidden />
        <div className="fb-section-inner">
          <div className="fb-final-cta-grid">
            <div>
              <h2 className="fb-final-cta-title">
                Ready to Turn Trust
                <br />
                <span className="fb-final-cta-accent">Into Growth?</span>
              </h2>
              <p className="fb-final-cta-sub">
                Claim your free profile, start collecting verified reviews, and turn customer
                trust into a growth channel that keeps working long after your next campaign.
              </p>
            </div>
            <div className="fb-final-cta-actions">
              <Link href="/business/signup" className="fb-btn-primary">
                Get Started for Free
              </Link>
              <Link href="/pricing" className="fb-btn-outline-white">
                View Pricing
              </Link>
              <p className="fb-final-signin">
                Already have an account?{" "}
                <Link href="/business/login">Sign in →</Link>
              </p>
            </div>
          </div>
        </div>
      </FadeUp>
    </main>
  );
}
