"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import ForBusinessFeatureIcon from "@/components/for-business/ForBusinessFeatureIcon";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  featureDetailHref,
  getOtherFeatures,
} from "../../forBusinessFeaturesData";
import type { ForBusinessFeature } from "../../forBusinessFeaturesData";

const IO = 0.1;

type Props = {
  feature: ForBusinessFeature;
};

export default function ForBusinessFeatureDetailClient({ feature }: Props) {
  const otherFeatures = getOtherFeatures(feature.slug, 3);
  const accentClass =
    feature.accent === "teal" ? "fb-fd--accent-teal" : "fb-fd--accent-forest";

  return (
    <main className={`fb-cinematic fb-fd ${accentClass}`}>
      <HomeScrollProgress />

      <section className="fb-fd-hero" aria-labelledby="fb-fd-hero-title">
        <div className="fb-fd-hero-bg" aria-hidden />
        <div className="fb-fd-hero-mesh" aria-hidden />
        <div className="fb-fd-hero-orb fb-fd-hero-orb--1" aria-hidden />
        <div className="fb-fd-hero-orb fb-fd-hero-orb--2" aria-hidden />

        <div className="fb-fd-hero-inner">
          <Link href="/for-business" className="fb-fd-back">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            For Business
          </Link>

          <div className="fb-fd-hero-grid">
            <div className="fb-fd-hero-copy">
              <span className="fb-fd-eyebrow">{feature.eyebrow}</span>
              <ForBusinessFeatureIcon
                type={feature.icon}
                accent={feature.accent}
                className="fb-fd-hero-icon"
              />
              <h1 id="fb-fd-hero-title" className="fb-fd-title">
                {feature.title}
              </h1>
              <p className="fb-fd-lead">{feature.lead}</p>
              <div className="fb-fd-cta-row">
                <Link href="/business/signup" className="fb-btn-primary">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
                <Link href="/pricing" className="fb-btn-outline-white">
                  View pricing
                </Link>
              </div>
            </div>

            <div className="fb-fd-hero-visual">
              <div className="fb-fd-hero-frame">
                <div className="fb-fd-hero-frame-glow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={feature.image}
                  alt=""
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="fb-fd-hero-chip">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                <span>Part of the Tellacity reputation platform</span>
              </div>
            </div>
          </div>

          <div className="fb-fd-metrics">
            {feature.metrics.map((metric, index) => (
              <div key={metric.label} className="fb-fd-metric">
                <span className="fb-fd-metric-value">{metric.value}</span>
                <span className="fb-fd-metric-label">{metric.label}</span>
                {index < feature.metrics.length - 1 ? (
                  <span className="fb-fd-metric-divider" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FadeUp threshold={IO}>
        <section className="fb-fd-bento" aria-labelledby="fb-fd-outcomes-title">
          <div className="fb-section-inner fb-fd-bento-inner">
            <div className="fb-fd-section-head">
              <p className="fb-fd-section-kicker">Key outcomes</p>
              <h2 id="fb-fd-outcomes-title" className="fb-fd-section-title">
                What you gain with{" "}
                <span className="fb-section-accent">{feature.eyebrow.toLowerCase()}</span>
              </h2>
            </div>
            <div className="fb-fd-bento-grid">
              {feature.highlights.map((item, index) => (
                <StaggerFadeUp key={item} index={index} staggerMs={80} threshold={IO}>
                  <div
                    className={`fb-fd-bento-card ${index === 0 ? "fb-fd-bento-card--featured" : ""}`}
                  >
                    <span className="fb-fd-bento-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Check className="fb-fd-bento-check" aria-hidden />
                    <p>{item}</p>
                  </div>
                </StaggerFadeUp>
              ))}
            </div>
          </div>
        </section>
      </FadeUp>

      <section className="fb-fd-deep" aria-labelledby="fb-fd-deep-title">
        <div className="fb-section-inner">
          <div className="fb-fd-section-head fb-fd-section-head--center">
            <p className="fb-fd-section-kicker">Deep dive</p>
            <h2 id="fb-fd-deep-title" className="fb-fd-section-title">
              How <span className="fb-section-accent">{feature.title.split(" ")[0]}</span> works
            </h2>
            <p className="fb-fd-section-sub">{feature.detail}</p>
          </div>
        </div>

        <div className="fb-fd-deep-stack">
          {feature.sections.map((section, index) => (
            <FadeUp key={section.title} threshold={IO}>
              <article
                className={`fb-fd-deep-row ${index % 2 === 1 ? "fb-fd-deep-row--reverse" : ""}`}
              >
                <div className="fb-fd-deep-rail" aria-hidden>
                  <span className="fb-fd-deep-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="fb-fd-deep-line" />
                </div>
                <div className="fb-fd-deep-content">
                  <h3 className="fb-fd-deep-title">{section.title}</h3>
                  <p className="fb-fd-deep-body">{section.body}</p>
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="fb-fd-deep-bullets">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="fb-fd-deep-panel" aria-hidden>
                  <div className="fb-fd-deep-panel-inner">
                    <ForBusinessFeatureIcon type={feature.icon} accent={feature.accent} />
                    <span>{section.title}</span>
                  </div>
                </div>
              </article>
            </FadeUp>
          ))}
        </div>
      </section>

      <FadeUp threshold={IO}>
        <section className="fb-fd-quote-band">
          <div className="fb-section-inner">
            <blockquote className="fb-fd-quote">
              <p>{feature.outcome}</p>
            </blockquote>
          </div>
        </section>
      </FadeUp>

      <FadeUp threshold={IO}>
        <section className="fb-fd-resources" aria-labelledby="fb-fd-resources-title">
          <div className="fb-section-inner">
            <div className="fb-fd-section-head">
              <p className="fb-fd-section-kicker">Resources</p>
              <h2 id="fb-fd-resources-title" className="fb-fd-section-title">
                Explore further
              </h2>
            </div>
            <div className="fb-fd-resource-grid">
              {feature.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="fb-fd-resource-card">
                  <span className="fb-fd-resource-label">{link.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </FadeUp>

      <FadeUp threshold={IO}>
        <section className="fb-fd-more" aria-labelledby="fb-fd-more-title">
          <div className="fb-section-inner">
            <div className="fb-fd-section-head">
              <p className="fb-fd-section-kicker">Platform</p>
              <h2 id="fb-fd-more-title" className="fb-fd-section-title">
                More capabilities
              </h2>
            </div>
            <div className="fb-fd-more-grid">
              {otherFeatures.map((item, index) => (
                <StaggerFadeUp key={item.slug} index={index} staggerMs={70} threshold={IO}>
                  <Link
                    href={featureDetailHref(item.slug)}
                    className="fb-fd-more-card"
                  >
                    <div className="fb-fd-more-card-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" loading="lazy" decoding="async" />
                    </div>
                    <div className="fb-fd-more-card-body">
                      <ForBusinessFeatureIcon type={item.icon} accent={item.accent} />
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                      <span className="fb-fd-more-link">
                        Learn more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </StaggerFadeUp>
              ))}
            </div>
            <Link href="/for-business" className="fb-fd-all-features">
              View all platform features →
            </Link>
          </div>
        </section>
      </FadeUp>

      <FadeUp threshold={IO}>
        <section className="fb-fd-final">
          <div className="fb-fd-final-mesh" aria-hidden />
          <div className="fb-section-inner fb-fd-final-inner">
            <h2 className="fb-fd-final-title">
              Ready to put {feature.title.toLowerCase()} to work?
            </h2>
            <p className="fb-fd-final-copy">
              Claim your free profile, send your first review invites, and grow trust on
              Tellacity. No card required to start.
            </p>
            <div className="fb-fd-cta-row fb-fd-cta-row--center">
              <Link href="/business/signup" className="fb-btn-primary">
                Create free account
              </Link>
              <Link href="/for-business" className="fb-btn-outline-white">
                All platform features
              </Link>
            </div>
          </div>
        </section>
      </FadeUp>
    </main>
  );
}
