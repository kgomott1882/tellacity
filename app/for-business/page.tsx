import Link from "next/link";
import ForBusinessMotionSection from "./ForBusinessMotionSection";
import AnimatedLine from "./AnimatedLine";
import DashboardMock from "@/components/for-business/DashboardMock";
import ReviewFlowGraphic from "@/components/for-business/ReviewFlowGraphic";
import ReviewFlowSteps from "@/components/for-business/ReviewFlowSteps";

export default function ForBusinessPage() {
  return (
    <main className="bg-white">
      {/* HERO: dark hero, reference structure */}
      <section className="w-full bg-[#1a1a1a]">
        <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            {/* Left: sub-heading, headline, description, CTA */}
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
                Reputation &amp; Reviews
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                <span className="block text-white">Your Reputation Is</span>
                <span className="block text-white">Your Strongest</span>
                <span className="block text-[#1FAF9E]">Growth Channel</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-gray-300">
                Turn verified customer reviews and real customer feedback into powerful insights, build trust, and attract new customers.
              </p>
              <div className="mt-8">
                <Link
                  href="/business/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#FBBF24] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:bg-[#F59E0B] hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                >
                  Claim Free Profile
                </Link>
              </div>
            </div>

            {/* Right: FEATURE HERO image (review card + profile card) */}
            <div className="relative flex items-center justify-center min-h-[320px] md:min-h-[380px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/FEATURE%20HERO.png"
                alt="Tellacity review and profile cards"
                className="max-h-[320px] w-auto object-contain md:max-h-[380px]"
              />
            </div>
          </div>
        </ForBusinessMotionSection>
      </section>

      <section className="border-y border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-4 md:gap-6">
            {[
              {
                num: "01",
                title: "Verified Reviews Only",
                description: "Real customer experiences. No anonymous noise.",
              },
              {
                num: "02",
                title: "No Pay-to-Hide Reviews",
                description: "Fair for businesses. Fair for customers.",
              },
              {
                num: "03",
                title: "Right of Reply",
                description: "Businesses respond. Reviews aren't erased.",
              },
              {
                num: "04",
                title: "Built for Long-Term Trust",
                description: "Reputation that compounds over time.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="flex gap-4 text-left"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E] text-sm font-bold text-white ring-2 ring-[#1FAF9E]/30"
                  aria-hidden
                >
                  {item.num}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[#0E0E0E] sm:text-lg">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED — single card with border #124541, shadow, luminous animation */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div
          className="overflow-hidden rounded-3xl border-2 bg-white p-8 shadow-[0_25px_50px_-12px_rgba(18,69,65,0.25)] animate-card-luminate"
          style={{ borderColor: "#124541" }}
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Everything You Need to Scale Trust
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Everything you need to collect, manage, and showcase customer
                feedback, designed to build trust at every customer touchpoint.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/TWO%20PPL.png"
                alt="Scale trust with customer feedback"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Automated Review Collection",
                copy: "Collect verified customer feedback through email, QR codes, and automated workflows.",
              },
              {
                title: "Verified & Credible Feedback",
                copy: "Ensure feedback is attributable, accountable, and aligned with transparent moderation standards.",
              },
              {
                title: "Reputation Management",
                copy: "Monitor, respond to, and manage customer reviews across your business.",
              },
              {
                title: "Trust Distribution Widgets",
                copy: "Showcase verified feedback across your website and marketing channels.",
              },
              {
                title: "Performance & Insight Analytics",
                copy: "Understand trends, performance, and feedback patterns in one central dashboard.",
              },
              {
                title: "Business Profile Infrastructure",
                copy: "Maintain a structured public business profile that supports long-term trust.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] active:scale-95"
              >
                <p className="text-base font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* DIFFERENT */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Block%20Cover.png"
                  alt="Fair, transparent feedback"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Built for Fair, Transparent Feedback, Not Review Blackmail
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <div className="mt-6 grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                {[
                  "Verified reviews only",
                  "No pay-to-hide reviews",
                  "Right of reply, not deletion",
                  "Trust over tactics",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <p className="text-sm font-semibold text-[#0E0E0E]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* CONVERT + REVIEW FLOW: combined in one card */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-8">
          {/* Convert Visitors Into Customers */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Convert Visitors Into Customers
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>Build trust with verified reviews</li>
                <li>Improve conversions with visible social proof</li>
                <li>Show responsiveness through public replies</li>
                <li>Strengthen credibility across every touchpoint</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/laptom%20with%20review%20platforms.png"
                alt="Reviews and platforms for converting visitors into customers"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* What Happens After a Review Is Posted? */}
          <div className="mt-6 sm:mt-10 border-t border-gray-100 pt-6 sm:pt-10 grid gap-6 sm:gap-8 md:grid-cols-2 md:items-center min-w-0">
            <div className="order-2 md:order-1 min-w-0">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4 shadow-sm min-w-0 overflow-hidden">
                <ReviewFlowGraphic />
              </div>
            </div>
            <div className="order-1 md:order-2 min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    What Happens After a Review Is Posted?
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <ReviewFlowSteps />
            </div>
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* INTEGRATIONS */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      Works With the Tools You Already Use
                    </span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  Tellacity fits seamlessly into your existing workflow so
                  collecting, managing, and showcasing reviews happens
                  automatically, without changing how your team works.
                </p>
              </div>
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  "Sync customer data in real time",
                  "Automate review requests via SMS & email",
                  "Display verified social proof automatically",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1FAF9E] text-xs font-semibold text-[#1FAF9E]">
                      ✓
                    </span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Intergrations.png"
                alt="Integrations"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100 pt-10">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 items-center">
              {[
                { name: "Zapier", logo: "Zapier.jpg" },
                { name: "Shopify", logo: "shopify.jpg" },
                { name: "WooCommerce", logo: "woocommerce.jpg" },
                { name: "HubSpot", logo: "HubSpot.jpg" },
                { name: "Salesforce", logo: "Salesforce.jpg" },
                { name: "Slack", logo: "Slack.jpg" },
                { name: "Klaviyo", logo: "Klaviyo.jpg" },
                { name: "Zendesk", logo: "Zendesk.jpg" },
                { name: "Twilio", logo: "Twilio.jpg" },
                { name: "WordPress", logo: "WordPress.jpg" },
                { name: "Magento", logo: "Magento.jpg" },
                { name: "Google Sheets", logo: "Googlesheets.jpg" },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-center transition-all duration-300 hover:opacity-90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/brand/${integration.logo}`}
                    alt={`${integration.name} logo`}
                    className="max-h-14 w-auto"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            And many more via direct integrations and automation.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 active:shadow-inner"
          >
            Get Started for Free
          </Link>
        </div>
      </ForBusinessMotionSection>

      <ForBusinessMotionSection className="bg-[#0F1F1E] py-24">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-semibold text-white sm:text-5xl">
            Trust Isn’t Marketing.
            <br />
            <span className="text-[#1FAF9E]">It’s Infrastructure.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300">
            Reviews aren’t campaigns. They’re signals. 
            Tellacity helps you build a reputation system that compounds over time.
          </p>

          <div className="mt-16" aria-hidden="true">
            <AnimatedLine d="M40 140c80-120 160-140 240-100 80 40 160 30 240-40 80-70 160-80 240-20" />
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* FAQ + WHY + Who Tellacity Is For: combined in one card */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          {/* Common Questions, Answered */}
          <section>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">Common Questions, Answered</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {[
                {
                  question: "Can we respond to negative reviews?",
                  answer:
                    "Yes. Businesses can respond publicly or privately to clarify and resolve issues.",
                },
                {
                  question: "Are reviews moderated?",
                  answer:
                    "Yes. Reviews are reviewed to ensure they meet our fairness and trust guidelines.",
                },
                {
                  question: "Can competitors leave fake reviews?",
                  answer:
                    "We use verification and fraud checks to prevent manipulation and bad actors.",
                },
                {
                  question: "Do we need to pay to be listed?",
                  answer:
                    "No. Businesses can be listed and reviewed without any paid plan.",
                },
              ].map((item) => (
                <div key={item.question}>
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why Industry Leaders Choose Tellacity */}
          <section className="mt-10 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Why Industry Leaders Choose Tellacity
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
              <li>Verified feedback, not anonymous noise</li>
              <li>Transparent review policies</li>
              <li>Fair treatment for businesses and customers</li>
              <li>Designed for long-term trust</li>
            </ul>
          </section>

          {/* Who Tellacity Is For: at bottom of combined card */}
          <section className="mt-10 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">Who Tellacity Is For</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                "Local & service businesses",
                "Online brands & e-commerce",
                "Growing companies",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ForBusinessMotionSection>

      {/* SEGMENTATION */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-[#1FAF9E]/20 bg-gradient-to-br from-white to-[#F6FBFA] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold tracking-wide text-[#1FAF9E] uppercase mb-3">
            Reputation Infrastructure
          </p>
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            The Complete Reputation Operating System
          </h2>
          <p className="mt-4 text-sm text-gray-600 max-w-2xl">
            Collect verified feedback. Respond transparently. Showcase credibility.
            Tellacity connects every part of your reputation into one unified system
            designed for sustainable growth.
          </p>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Goal
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Engage with feedback",
                  copy:
                    "Respond to reviews publicly, resolve issues transparently, and show customers you’re listening.",
                },
                {
                  title: "Accelerate conversions",
                  copy:
                    "Use verified reviews and social proof to build confidence and turn visitors into customers.",
                },
                {
                  title: "Improve with insights",
                  copy:
                    "Understand customer sentiment, trends, and reputation performance over time.",
                },
                {
                  title: "Grow with trust",
                  copy:
                    "Build long-term credibility that compounds into sustainable business growth.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Size
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Small & Growing Businesses",
                  copy:
                    "Build credibility early, compete on trust, and grow without complexity.",
                },
                {
                  title: "Established & Multi-Location Businesses",
                  copy:
                    "Manage reputation at scale while staying fair, transparent, and consistent.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* SIMPLE SETUP */}
      <ForBusinessMotionSection
        className="mx-auto w-full max-w-7xl px-6 pb-16"
        id="pricing"
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <svg
                  viewBox="0 0 640 400"
                  className="h-full w-full"
                  role="img"
                  aria-hidden="true"
                >
                  <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                  <path
                    d="M96 276c60-88 120-120 180-96 60 24 112 16 160-24 48-40 96-48 148-24"
                    fill="none"
                    stroke="#1FAF9E"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <circle cx="140" cy="240" r="10" fill="#CBD5F5" />
                  <circle cx="276" cy="204" r="10" fill="#C7EFD9" />
                  <circle cx="408" cy="176" r="10" fill="#FADBB4" />
                </svg>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Simple Setup. Immediate Impact.
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {["Connect your business", "Collect feedback", "Grow with trust"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] active:scale-95 hover:bg-teal-50"
                    >
                      <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1FAF9E] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[#0E0E0E]">
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* FINAL CTA */}
      <ForBusinessMotionSection className="bg-[#F6FBFA]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Ready to Turn Trust Into Growth?
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
            >
              Get Started for Free
            </Link>
            <Link
              href="/for-business#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </ForBusinessMotionSection>
    </main>
  );
}
