"use client";

import Link from "next/link";
import {
  Award,
  BarChart2,
  Camera,
  FileText,
  Mail,
  Shield,
  Star,
  XCircle,
} from "lucide-react";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import {
  ARTICLES_PLATFORM,
  PLATFORM_CARDS,
  PROBLEM_POINTS,
  TEAM_USE_CASES,
} from "./forBusinessData";

const IO = 0.12;

type ModuleIconType = (typeof PLATFORM_CARDS)[number]["icon"];

function ModuleIcon({ type }: { type: ModuleIconType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "star":
      return <Star className={cls} aria-hidden />;
    case "barChart2":
      return <BarChart2 className={cls} aria-hidden />;
    case "shield":
      return <Shield className={cls} aria-hidden />;
    case "camera":
      return <Camera className={cls} aria-hidden />;
    case "award":
      return <Award className={cls} aria-hidden />;
    default:
      return <Mail className={cls} aria-hidden />;
  }
}

export default function ForBusinessPlatformSections({ part }: { part: "problem" | "platform" }) {
  if (part === "problem") {
    return (
      <FadeUp threshold={IO} className="rp-problem">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            The <span className="rp-section-accent">Problem</span>
          </h2>
          <div className="rp-problem-grid">
            <div>
              <p className="rp-problem-lead">
                Most businesses collect customer feedback in five or six different places.
                When verified customer trust is split across tools, teams stop trusting their
                own numbers, and search engines see the same fragmentation.
              </p>
              {PROBLEM_POINTS.map((point) => (
                <div key={point.label} className="rp-pain-row">
                  <XCircle className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>{point.label}</strong>
                    <span>{point.detail}</span>
                  </div>
                </div>
              ))}
              <div className="rp-problem-divider" />
              <Link href="/solutions/review-invitations" className="rp-text-link">
                Start collecting verified reviews →
              </Link>
            </div>
            <div className="rp-problem-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/reputation_system.jpeg"
                alt="Scattered feedback across disconnected tools"
                loading="lazy"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Inside%20Tellacity.png"
                alt="Unified Tellacity reputation system"
                className="rp-problem-unified"
                loading="lazy"
                decoding="async"
              />
              <span className="rp-unified-label">Unified System</span>
            </div>
          </div>
        </div>
      </FadeUp>
    );
  }

  return (
    <>
      <FadeUp threshold={IO} className="rp-modules">
        <div className="rp-modules-bg" aria-hidden />
        <div id="platform-modules" className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">
            Reputation Platform <span className="rp-section-accent">Modules</span>
          </h2>
          <p className="rp-modules-sub">
            Six modules, one verified review pipeline, one dashboard, plus blogs and case
            studies when you are ready to publish thought leadership. Explore each module on
            its solution page.
          </p>
          <div className="rp-module-grid">
            {PLATFORM_CARDS.map((card, index) => (
              <StaggerFadeUp key={card.title} index={index} staggerMs={60} threshold={IO}>
                <Link
                  href={card.href === "/for-business" ? "/business/signup" : card.href}
                  className="rp-module-card h-full"
                >
                  <div
                    className={[
                      "rp-module-media",
                      card.imageFit === "contain" ? "rp-module-media--contain" : "",
                      card.imageFit === "contain-2x" ? "rp-module-media--contain-lg" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageTop ?? card.image}
                      alt={card.imageAlt ?? card.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="rp-module-body">
                    <span
                      className="rp-module-icon"
                      style={{
                        background:
                          card.iconAccent === "forest"
                            ? "rgba(18,69,65,0.1)"
                            : "rgba(0,180,166,0.12)",
                        color: card.iconAccent === "forest" ? "#124541" : "#00b4a6",
                      }}
                    >
                      <ModuleIcon type={card.icon} />
                    </span>
                    <h3>{card.title}</h3>
                    <p className="rp-module-tagline">{card.tagline}</p>
                    <p>{card.description}</p>
                    <span className="rp-module-link">Learn more →</span>
                  </div>
                </Link>
              </StaggerFadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Blogs & case studies */}
      <FadeUp threshold={IO} className="fb-why">
        <div id="blogs-case-studies" className="fb-section-inner">
          <h2 className="fb-section-title">
            <span className="fb-section-dark">{ARTICLES_PLATFORM.title} </span>
            <span className="fb-section-accent">on Tellacity</span>
          </h2>
          <p className="fb-features-sub" style={{ textAlign: "left", marginLeft: 0, maxWidth: "42rem" }}>
            {ARTICLES_PLATFORM.lead}
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
                {ARTICLES_PLATFORM.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#00B4A6]" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-4">
                {ARTICLES_PLATFORM.links.map((link) => (
                  <Link key={link.href} href={link.href} className="fb-inline-link">
                    {link.label} →
                  </Link>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ARTICLES_PLATFORM.image}
                alt="Tellacity blogs and case studies for businesses"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Team use cases */}
      <FadeUp threshold={IO} className="rp-teams">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="rp-section-title">Use Cases by Team</h2>
          <p className="rp-intro-note">
            Marketing, support, operations, leadership, and product teams work from the same
            verified customer data, not duplicate exports or conflicting scores.
          </p>
          <div className="rp-team-grid">
            {TEAM_USE_CASES.map((team, index) => (
              <StaggerFadeUp key={team.team} index={index} staggerMs={60} threshold={IO}>
                <article className="rp-team-card h-full">
                  <h3>
                    <span aria-hidden>{team.icon}</span> {team.team}
                  </h3>
                  <p className="font-medium text-gray-700">{team.benefit}</p>
                  <p>{team.body}</p>
                  <div className="rp-team-links">
                    {team.links.map((link) => (
                      <Link key={link.href} href={link.href} className="rp-team-pill">
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                </article>
              </StaggerFadeUp>
            ))}
            <StaggerFadeUp index={TEAM_USE_CASES.length} staggerMs={60} threshold={IO}>
              <div
                className="rp-team-card rp-team-card--yolk h-full"
                aria-hidden
              />
            </StaggerFadeUp>
          </div>
        </div>
      </FadeUp>
    </>
  );
}
