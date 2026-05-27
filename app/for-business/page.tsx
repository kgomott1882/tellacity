import type { Metadata } from "next";
import Link from "next/link";
import ForBusinessMotionSection from "./ForBusinessMotionSection";
import HeroStarField from "@/components/home/HeroStarField";
import ReviewFlowSteps from "@/components/for-business/ReviewFlowSteps";

const PAGE_URL = "https://tellacity.com/for-business";

export const metadata: Metadata = {
  title: "Reputation & Reviews for Business | Tellacity",
  description:
    "Collect verified customer reviews, respond publicly, showcase trust, and grow with Tellacity's reputation platform for businesses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Reputation & Reviews for Business | Tellacity",
    description:
      "Collect verified customer reviews, respond publicly, showcase trust, and grow with Tellacity's reputation platform for businesses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reputation & Reviews for Business | Tellacity",
    description:
      "Collect verified customer reviews, respond publicly, showcase trust, and grow with Tellacity's reputation platform for businesses.",
  },
  robots: { index: true, follow: true },
};

const forBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reputation & Reviews for Business | Tellacity",
  description:
    "Collect verified customer reviews, respond publicly, showcase trust, and grow with Tellacity's reputation platform for businesses.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Business",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const PRINCIPLES = [
  {
    num: "01",
    title: "Verified Reviews Only",
    description: "Real customer experiences. No anonymous noise.",
    explain:
      "Every review is tied to a genuine customer interaction, so feedback reflects real experiences, not anonymous noise.",
  },
  {
    num: "02",
    title: "No Pay-to-Hide Reviews",
    description: "Fair for businesses. Fair for customers.",
    explain:
      "Reviews stay visible regardless of plan. Tellacity does not sell the ability to remove or suppress legitimate feedback.",
  },
  {
    num: "03",
    title: "Right of Reply",
    description: "Businesses respond. Reviews aren't erased.",
    explain:
      "You can respond publicly or privately to clarify context, resolve issues, and show customers you are listening.",
  },
  {
    num: "04",
    title: "Built for Long-Term Trust",
    description: "Reputation that compounds over time.",
    explain:
      "Trust builds steadily as verified feedback, responses, and trust signals accumulate, not through short-term campaigns.",
  },
];

const FEATURES = [
  {
    title: "Automated Review Collection",
    copy: "Collect verified customer feedback through email, QR codes, and automated workflows.",
    detail:
      "Send review requests after purchases or appointments via email and SMS, share QR codes in-store, and trigger requests from your existing workflows so collection happens consistently without manual follow-up.",
  },
  {
    title: "Verified & Credible Feedback",
    copy: "Ensure feedback is attributable, accountable, and aligned with transparent moderation standards.",
    detail:
      "Verification and moderation standards help ensure reviews come from real customers and meet our fairness guidelines, making feedback more dependable for you and future buyers.",
  },
  {
    title: "Reputation Management",
    copy: "Monitor, respond to, and manage customer reviews across your business.",
    detail:
      "Centralize review monitoring and response in one dashboard so your team can address feedback quickly, track sentiment, and maintain a consistent voice across every review.",
  },
  {
    title: "Trust Distribution Widgets",
    copy: "Showcase verified feedback across your website and marketing channels.",
    detail:
      "Embed verified ratings and reviews on your website, landing pages, and emails so prospects see credible social proof wherever they evaluate your business.",
  },
  {
    title: "Performance & Insight Analytics",
    copy: "Understand trends, performance, and feedback patterns in one central dashboard.",
    detail:
      "Track rating trends, review volume, response times, and recurring themes so you can spot issues early and measure how reputation performance improves over time.",
  },
  {
    title: "Business Profile Infrastructure",
    copy:
      "Maintain a structured public business profile that supports long-term trust. Upload and organize business photos from your dashboard, then showcase them on your public profile so customers see the real you.",
    detail:
      "Your public profile brings together verified reviews, business details, photos, and trust signals in one structured page that strengthens credibility across search and direct visits.",
  },
];

const TRANSPARENCY_POINTS = [
  {
    title: "Verified customer reviews",
    description: "Only real, verified feedback from genuine customers.",
    detail:
      "Reviews are linked to verified customer interactions, so feedback reflects authentic experiences rather than anonymous or unverified claims.",
  },
  {
    title: "No pay-to-hide reviews",
    description: "Reviews cannot be removed or hidden through paid plans.",
    detail:
      "Tellacity does not allow businesses to pay to suppress legitimate reviews. Fair treatment applies to every business on the platform.",
  },
  {
    title: "Right to respond publicly",
    description: "Businesses can reply to reviews and show how they resolve issues.",
    detail:
      "Public replies let you address concerns transparently, demonstrate responsiveness, and show future customers how you handle feedback.",
  },
  {
    title: "Trust built on transparency",
    description: "A fair review platform built for long-term reputation and customer trust.",
    detail:
      "Clear policies, visible responses, and verified feedback create a reputation system customers can rely on over time.",
  },
];

const CONVERSION_POINTS = [
  {
    title: "Build trust with verified reviews",
    detail:
      "Verified customer reviews give prospects confidence that feedback is real, which reduces hesitation before they contact you or make a purchase.",
  },
  {
    title: "Improve conversions with visible social proof",
    detail:
      "Displaying ratings and reviews at key decision points helps visitors compare options and choose businesses with demonstrated customer satisfaction.",
  },
  {
    title: "Show responsiveness through public replies",
    detail:
      "When customers see you respond thoughtfully to feedback, positive or negative, they know you stand behind your service and take concerns seriously.",
  },
  {
    title: "Upload business photos in your dashboard",
    detail:
      "Add photos from your dashboard and showcase them on your public profile so visitors see your team, location, and work, not just a logo and text.",
  },
  {
    title: "Strengthen credibility across every touchpoint",
    detail:
      "Trust signals from your Tellacity profile and widgets reinforce credibility on your website, in search results, and across marketing channels.",
  },
];

const INTEGRATION_POINTS = [
  {
    title: "Sync customer data in real time",
    detail:
      "Connect customer and order data so review requests and profile updates stay aligned with your latest business activity.",
  },
  {
    title: "Automate review requests via SMS & email",
    detail:
      "Trigger review invitations automatically after purchases, appointments, or support interactions, without adding manual steps for your team.",
  },
  {
    title: "Display verified social proof automatically",
    detail:
      "Widgets and integrations pull verified ratings and reviews into your site and campaigns so social proof stays current without manual updates.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Can we respond to negative reviews?",
    answer:
      "Yes. Businesses can respond publicly or privately to negative reviews. Public replies show future customers how you handle concerns; private follow-up can help resolve issues directly with the reviewer.",
  },
  {
    question: "Are reviews moderated?",
    answer:
      "Yes. Reviews are moderated for fairness and policy compliance. Our team checks content against platform guidelines so feedback stays authentic, respectful, and useful for both businesses and customers.",
  },
  {
    question: "Can competitors leave fake reviews?",
    answer:
      "Tellacity uses verification and fraud checks to prevent manipulation and bad actors. Reviews tied to verified customer interactions and ongoing monitoring help keep the system fair and trustworthy.",
  },
  {
    question: "Do we need to pay to be listed?",
    answer:
      "No. Businesses can be listed and reviewed without any paid plan. You can claim your free profile, collect reviews, and respond to feedback before choosing optional paid features.",
  },
];

const LEADER_POINTS = [
  {
    title: "Verified feedback, not anonymous noise",
    detail:
      "Leaders choose Tellacity because feedback comes from verified customers, not anonymous posts that are hard to trust or act on.",
  },
  {
    title: "Transparent review policies",
    detail:
      "Clear, published policies explain how reviews are collected, moderated, and displayed so businesses and customers know what to expect.",
  },
  {
    title: "Fair treatment for businesses and customers",
    detail:
      "The platform balances the rights of both sides: customers can share honest experiences, and businesses can respond without pay-to-hide tactics.",
  },
  {
    title: "Designed for long-term trust",
    detail:
      "Tellacity is built for reputation that compounds over years, not one-off campaigns, so trust becomes a durable competitive advantage.",
  },
];

const AUDIENCES = [
  {
    title: "Local & service businesses",
    detail:
      "Shops, clinics, trades, and service providers use Tellacity to collect local reviews, respond publicly, and win customers who search for trusted providers nearby.",
  },
  {
    title: "Online brands & e-commerce",
    detail:
      "Online brands embed verified reviews and trust widgets across product pages and checkout flows to reduce purchase friction and increase conversion confidence.",
  },
  {
    title: "Growing companies",
    detail:
      "Growing teams centralize reputation management in one system so feedback, responses, and analytics scale with the business, not as an afterthought.",
  },
];

export default function ForBusinessPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(forBusinessJsonLd) }}
      />

      {/* HERO: dark hero, reference structure */}
      <section className="w-full bg-[#1a1a1a]">
        <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
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
                Turn verified customer reviews and real customer feedback into
                powerful insights, build trust, and attract new customers.
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

            <div className="relative flex min-h-[320px] items-center justify-center md:min-h-[380px]">
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

      {/* Why Tellacity for Business, four principles */}
      <section className="border-y border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Why Tellacity for Business</span>
              <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">
            Tellacity helps businesses collect feedback, respond publicly, and
            build durable trust instead of chasing short-term campaigns. You get
            a reputation system designed for transparency, not manipulation.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Reputation compounds over time: verified reviews, thoughtful
            responses, and visible trust signals work together to attract new
            customers long after a single marketing push ends.{" "}
            <Link href="/how-tellacity-works" className={linkClass}>
              See how Tellacity works
            </Link>{" "}
            or explore the{" "}
            <Link href="/reputation-platform" className={linkClass}>
              Reputation Platform
            </Link>
            .
          </p>
          <div className="mt-8 grid gap-6 sm:gap-8 md:grid-cols-4 md:gap-6">
            {PRINCIPLES.map((item) => (
              <div key={item.num} className="flex gap-4 text-left">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E] text-sm font-bold text-white ring-2 ring-[#1FAF9E]/30"
                  aria-hidden
                >
                  {item.num}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[#0E0E0E] sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.explain}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED - single card with border #124541, shadow, luminous animation */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div
          className="animate-card-luminate overflow-hidden rounded-3xl border-2 bg-white p-8 shadow-[0_25px_50px_-12px_rgba(18,69,65,0.25)]"
          style={{ borderColor: "#124541" }}
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Everything You Need to Scale Trust
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Everything you need to collect, manage, and showcase customer
                feedback, designed to build trust at every customer touchpoint.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                From automated collection to analytics and public profiles,
                Tellacity gives you practical tools to turn verified feedback
                into a growth engine, not a side project.{" "}
                <Link href="/pricing" className={linkClass}>
                  View pricing
                </Link>{" "}
                to see how plans fit your stage.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/TWO%20PPL.png"
                alt="Scale trust with customer feedback"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] active:scale-95"
              >
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* Built for Honest, Transparent Customer Reviews */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
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
                    Built for Honest, Transparent Customer Reviews
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Tellacity is designed to protect authentic customer feedback.
                Businesses can respond, improve, and build trust without
                manipulation, pay-to-hide tactics, or review blackmail.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                The right to reply publicly means you can address concerns in
                the open, and transparency benefits everyone: customers see fair
                treatment, and businesses earn credibility for how they handle
                feedback. Read our{" "}
                <Link href="/safety-trust" className={linkClass}>
                  Safety &amp; Trust
                </Link>{" "}
                and{" "}
                <Link href="/reviewer-guidelines" className={linkClass}>
                  reviewer guidelines
                </Link>{" "}
                for full policy detail.
              </p>
              <div className="mt-6 grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                {TRANSPARENCY_POINTS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ForBusinessMotionSection>

      {/* CONVERT + REVIEW FLOW: combined in one card */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Convert Visitors Into Customers
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Verified reviews and public replies reduce friction and increase
                confidence when prospects compare options. Profile photos and
                trust signals on your Tellacity page help visitors feel they know
                your business before they reach out.
              </p>
              <div className="mt-5 space-y-4">
                {CONVERSION_POINTS.map((item) => (
                  <div key={item.title}>
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/laptom%20with%20review%20platforms.png"
                alt="Reviews and platforms for converting visitors into customers"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-6 grid min-w-0 gap-6 border-t border-gray-100 pt-6 sm:mt-10 sm:gap-8 sm:pt-10 md:grid-cols-2 md:items-center">
            <div className="order-2 min-w-0 md:order-1">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Business%20Reviews%20Tools.png"
                  alt="Tellacity business review tools: collect, respond, and showcase customer feedback"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div className="order-1 min-w-0 md:order-2">
              <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    How Customer Reviews Work on Tellacity
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Every customer review helps businesses improve and helps future
                customers make better decisions. Here&apos;s what happens when
                feedback is shared on Tellacity.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                The four-step flow keeps the system fair and responsive:
                customers share verified experiences, businesses are notified
                immediately, responses resolve issues in the open, and trust
                signals update automatically for everyone who follows your
                reputation.
              </p>
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
                    <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  Tellacity fits seamlessly into your existing workflow so
                  collecting, managing, and showcasing reviews happens
                  automatically, without changing how your team works.
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  Integrations and automation mean less manual work and more
                  consistent reputation management, review requests, data sync,
                  and social proof stay in step with the tools you already rely
                  on.
                </p>
              </div>
              <div className="mt-6 space-y-4">
                {INTEGRATION_POINTS.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#1FAF9E] text-xs font-semibold text-[#1FAF9E]">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#0E0E0E]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Intergrations.png"
                alt="Integrations"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100 pt-10">
            <div className="grid grid-cols-2 items-center gap-8 sm:grid-cols-3 lg:grid-cols-5">
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
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#169786] active:scale-95 active:shadow-inner"
          >
            Get Started for Free
          </Link>
        </div>
      </ForBusinessMotionSection>

      <ForBusinessMotionSection className="relative overflow-hidden bg-[#0F1F1E] py-24">
        <HeroStarField />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-semibold text-white sm:text-5xl">
            Trust Isn&apos;t Marketing.
            <br />
            <span className="text-[#1FAF9E]">It&apos;s Infrastructure.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300">
            Reviews aren&apos;t campaigns. They&apos;re signals. Tellacity helps
            you build a reputation system that compounds over time.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300">
            Marketing campaigns come and go; durable reputation infrastructure
            keeps working, collecting feedback, surfacing trust, and strengthening
            credibility with every verified review and response. That is how
            long-term trust becomes a sustainable growth channel, not a
            one-season push.
          </p>
        </div>
      </ForBusinessMotionSection>

      {/* Reputation Infrastructure */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border border-[#1FAF9E]/20 bg-gradient-to-br from-white to-[#F6FBFA] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Reputation Infrastructure
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Tellacity connects the full reputation loop: collect verified
            feedback, respond transparently, showcase credibility, and improve
            from insights, all in one system built for sustainable growth.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Choose the goals and scale that match your business today, knowing
            the same infrastructure grows with you.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/Engage%20with%20Customers.png"
              alt="Engage with customers through Tellacity reputation infrastructure"
              className="mx-auto w-full object-contain"
            />
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Goal
            </h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Engage with feedback",
                  copy:
                    "Respond to reviews publicly, resolve issues transparently, and show customers you're listening.",
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
                  className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Size
            </h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
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
                  className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
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

      {/* FAQ + WHY + Who Tellacity Is For: combined in one card */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <section>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Common Questions, Answered
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              Straight answers to what business owners ask most. For more detail,
              visit the{" "}
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>{" "}
              or{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Why Industry Leaders Choose Tellacity
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              Star ratings alone are not enough. Leaders choose Tellacity
              because verified feedback, transparent policies, and fair
              treatment create reputation customers can trust for the long run.
            </p>
            <div className="mt-5 space-y-4">
              {LEADER_POINTS.map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">Who Tellacity Is For</span>
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              Whether you serve customers locally, sell online, or scale across
              teams, Tellacity adapts to how you collect feedback and build
              trust.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {AUDIENCES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                >
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ForBusinessMotionSection>

      {/* The Complete Reputation Operating System */}
      <ForBusinessMotionSection className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">
                The Complete Reputation Operating System
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Tellacity unifies feedback collection, response, analytics, and
            social proof into one workflow, so reputation is managed as a system,
            not a scattered set of tools.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            That unified approach supports sustainable growth: trust compounds
            as verified reviews, public replies, and performance insights work
            together over time.{" "}
            <Link href="/reputation-platform" className={linkClass}>
              Tellacity&apos;s business tools are part of the broader Reputation
              Platform
            </Link>
            .
          </p>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/business/login" className={linkClass}>
              Sign in to your business dashboard
            </Link>
            .
          </p>
        </div>
      </ForBusinessMotionSection>

      {/* FINAL CTA */}
      <ForBusinessMotionSection className="bg-[#F6FBFA]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Ready to Turn Trust Into Growth?
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-gray-600">
              Claim your free profile, start collecting verified reviews, and
              turn customer trust into a growth channel that keeps working long
              after your next campaign.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
            >
              Get Started for Free
            </Link>
            <Link
              href="/pricing"
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
