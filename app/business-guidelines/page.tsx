import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS } from "@/lib/adminBusinessSuspensionReasons";

const PAGE_URL = "https://tellacity.com/business-guidelines";

export const metadata: Metadata = {
  title: "Business Guidelines | Tellacity",
  description:
    "Read Tellacity's Business Guidelines to understand listing requirements, review rules, verification standards, suspension reasons, and appeals.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Business Guidelines | Tellacity",
    description:
      "Read Tellacity's Business Guidelines to understand listing requirements, review rules, verification standards, suspension reasons, and appeals.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Guidelines | Tellacity",
    description:
      "Read Tellacity's Business Guidelines to understand listing requirements, review rules, verification standards, suspension reasons, and appeals.",
  },
  robots: { index: true, follow: true },
};

const businessGuidelinesJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Business Guidelines | Tellacity",
  description:
    "Read Tellacity's Business Guidelines to understand listing requirements, review rules, verification standards, suspension reasons, and appeals.",
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
        name: "Business Guidelines",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const RELATED_PAGES = [
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/help-center", label: "Help Center" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact/support", label: "Contact Support" },
  { href: "/business/dashboard", label: "Business Dashboard" },
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/reputation-platform", label: "Reputation Platform" },
];

const SUSPENSION_PLAIN_ENGLISH: Record<string, string> = {
  general:
    "Used when a listing no longer meets overall platform standards but the specific issue may need further review.",
  guidelines_violation:
    "Applied when listing content or business activity breaks community or business guidelines.",
  fake_or_misleading_listing:
    "Used when the listing may not represent a genuine, operating business customers can rely on.",
  inappropriate_or_unsafe:
    "Applied when associated content is flagged as inappropriate, unsafe, or harmful to consumers.",
  repeated_complaints:
    "Used when repeated complaints or suspicious patterns suggest ongoing trust concerns.",
  verification_or_ownership:
    "Applied when Tellacity cannot confirm verification, domain ownership, or authorised control of the listing.",
  policy_or_legal:
    "Used when a policy, legal, or trust & safety matter requires suspension pending review.",
};

export default function BusinessGuidelinesPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessGuidelinesJsonLd),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Tellacity Business Guidelines
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-lg font-medium text-[#0E0E0E]">
              The standards every business listing must meet
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
              These guidelines explain what we expect from businesses on
              Tellacity, how we evaluate listings, and the reasons a listing
              can be suspended or removed.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
              Read this page alongside our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>{" "}
              and{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust framework
              </Link>
              , together they describe how reviews, listings, and enforcement
              work for both businesses and consumers.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Who Can List a Business
            </h2>
            <p className="mt-3">
              Tellacity is for real, operating businesses that serve customers.
              Listings that misrepresent a business undermine trust for every
              other profile on the platform.
            </p>
            <p className="mt-3">
              We require one accurate profile per business so ratings,
              responses, and visibility reflect a single genuine reputation, not
              duplicated listings created to manipulate search or scores.
            </p>
            <p className="mt-4 font-medium text-[#0E0E0E]">Listings must be:</p>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Genuine</h3>
                <p className="mt-1">
                  The business actually exists and trades with consumers under
                  the name shown on the listing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Accurate</h3>
                <p className="mt-1">
                  Name, website, contact details, country, category, and
                  description must match the real business and current
                  operations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Lawful</h3>
                <p className="mt-1">
                  The business and the products or services it offers must
                  comply with the laws of the country it operates in.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Single profile per business
                </h3>
                <p className="mt-1">
                  Do not create duplicate listings for the same business to
                  influence ratings or visibility.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Verification &amp; Domain Ownership
            </h2>
            <p className="mt-3">
              Verified businesses earn a public badge and gain access to
              dashboard tools, analytics, and review-response features because
              ownership and identity have been checked.
            </p>
            <p className="mt-3">
              Business-domain emails and current ownership records reduce fraud
              and help customers know they are engaging with the authorised
              representative of a listing.
            </p>
            <p className="mt-4 font-medium text-[#0E0E0E]">To stay verified:</p>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Use a business email on your domain
                </h3>
                <p className="mt-1">
                  Owners and team members should sign in with an email tied to
                  the business&apos;s registered domain whenever possible.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Keep ownership current
                </h3>
                <p className="mt-1">
                  When ownership or operations change, transfer the listing
                  through the dashboard rather than creating a new one.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  No domain spoofing
                </h3>
                <p className="mt-1">
                  Do not claim a listing using an email or domain that
                  doesn&apos;t belong to the business.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Engaging With Reviews
            </h2>
            <p className="mt-3">
              How you respond to reviews is part of your public reputation.
              Professional, factual replies help future customers understand
              how you handle feedback, including criticism.
            </p>
            <p className="mt-3">
              Harassment, threats, bribery, and privacy violations are never
              acceptable. Tellacity may remove replies or take enforcement action
              when business conduct on the platform breaks these rules.
            </p>
            <p className="mt-4 font-medium text-[#0E0E0E]">We expect:</p>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Professional replies
                </h3>
                <p className="mt-1">
                  Be polite, factual, and solution-oriented. Avoid arguments,
                  insults, or threats.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">No retaliation</h3>
                <p className="mt-1">
                  Never threaten, harass, or penalise a customer for posting a
                  review you don&apos;t like.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">No bribery</h3>
                <p className="mt-1">
                  Do not offer discounts, refunds, free products, or other
                  incentives in exchange for changing or removing a review.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Respect privacy</h3>
                <p className="mt-1">
                  Don&apos;t publish a customer&apos;s private contact details,
                  order numbers, or sensitive information in a public reply.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Inviting Reviews the Right Way
            </h2>
            <p className="mt-3">
              Asking real customers for honest feedback is encouraged and
              supported by our review-invitation tools. That is different from
              manipulating ratings through fake reviews, coordinated posting, or
              cherry-picking only satisfied customers.
            </p>
            <p className="mt-3">
              Normal review requests sent fairly after genuine transactions are
              welcome. Suspicious bulk behaviour, rapid catalog sweeps, staff or
              family reviews, or competitor attacks, is prohibited and may trigger
              automated flags or enforcement.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">No fake reviews</h3>
                <p className="mt-1">
                  Buying reviews, posting under fake identities, or asking staff,
                  friends, or family to leave reviews is a banning offence.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  No catalog sweeps
                </h3>
                <p className="mt-1">
                  Bulk-posting reviews across many products of the same business
                  in a short time window is treated as suspicious activity and
                  will be auto-flagged for review.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  No competitor attacks
                </h3>
                <p className="mt-1">
                  Do not post negative reviews on competitors. Reviews from a
                  business&apos;s own domain on its own listing are automatically
                  blocked.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  No selective inviting
                </h3>
                <p className="mt-1">
                  Don&apos;t cherry-pick only happy customers. Invite all eligible
                  customers fairly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Additional safeguards
                </h3>
                <p className="mt-1">
                  To maintain a fair and trustworthy platform, Tellacity applies
                  additional safeguards to detect unusual or unnatural review
                  behaviour.
                </p>
                <p className="mt-2">
                  Reviews submitted in rapid succession, across multiple products
                  within a short timeframe, or in patterns that do not reflect
                  normal customer behaviour may be automatically flagged for
                  review.
                </p>
                <p className="mt-2">
                  While customers are free to review multiple products they have
                  genuinely experienced, activity that resembles bulk posting or
                  review flooding may result in temporary restrictions or
                  moderation review.
                </p>
                <p className="mt-2">
                  These measures are designed to protect both consumers and
                  businesses by ensuring that all feedback reflects real,
                  independent customer experiences.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Business-level vs product-level reviews
                </h3>
                <p className="mt-1">
                  Tellacity distinguishes between business-level reviews and
                  product-level reviews. Customers may review individual products
                  they have used, as well as their overall experience with a
                  business. However, each review must be based on a genuine
                  interaction and submitted independently. Repeated or coordinated
                  submissions that attempt to influence ratings or visibility are
                  treated as suspicious activity.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Photos, Logos, and Listing Content
            </h2>
            <p className="mt-3">
              Visual content on your listing must be owned or properly licensed,
              accurately represent what you sell or operate, and stay current.
              Misleading badges, fake awards, and unsafe imagery undermine
              consumer trust.
            </p>
            <p className="mt-3">
              Tellacity may remove or restrict content that violates these
              standards and may suspend listings that repeatedly publish misleading
              or harmful material.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Original or licensed
                </h3>
                <p className="mt-1">
                  Only upload images you own or are licensed to use. Don&apos;t use
                  stock photos to misrepresent products or premises.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Accurate products</h3>
                <p className="mt-1">
                  Product photos must depict products you actually sell. Each
                  product photo represents a unique reviewable item.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Appropriate content
                </h3>
                <p className="mt-1">
                  No nudity, violence, hate symbols, or content that endangers
                  minors. No misleading badges, fake awards, or fake review
                  counts.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Keep it current</h3>
                <p className="mt-1">
                  Photos older than our retention window may be archived. Refresh
                  your gallery so the listing reflects what customers experience
                  today.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Disputing a Review
            </h2>
            <p className="mt-3">
              If you believe a review breaks our rules or is factually incorrect,
              you can flag it from your dashboard. Our team reviews every flag
              against these guidelines.
            </p>
            <p className="mt-3">
              Negative opinions alone are not grounds for removal. Factual
              disputes, such as whether someone was ever a customer, are handled
              differently from disagreements with how a customer felt about their
              experience.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Flag from your dashboard
                </h3>
                <p className="mt-1">
                  Use the dispute or flag tools in your business dashboard to
                  report content you believe violates platform rules or contains
                  factual errors.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Factual disputes</h3>
                <p className="mt-1">
                  For factual disputes (e.g. &quot;this person was never a
                  customer&quot;), we may ask the reviewer for proof such as a
                  receipt, invoice, or booking confirmation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Negative opinions are not removed
                </h3>
                <p className="mt-1">
                  We do not remove reviews simply because they are negative.
                  Disagreement with an opinion is not grounds for removal.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Hate-speech, harassment, and privacy violations
                </h3>
                <p className="mt-1">
                  Reviews that violate hate-speech, harassment, illegal-content,
                  or privacy rules are removed immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Appeals once with new evidence
                </h3>
                <p className="mt-1">
                  Decisions can be appealed once with new evidence not previously
                  considered.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Temporary restrictions or review status
                </h3>
                <p className="mt-1">
                  In some cases, reviews may be temporarily restricted or placed
                  under review while additional checks are completed. This may
                  occur when unusual patterns, rapid submission behaviour, or
                  potential conflicts of interest are detected.
                </p>
                <p className="mt-2">
                  These reviews are not removed automatically, but may be hidden
                  from public view until they are verified as compliant with our
                  guidelines.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Reasons a Listing Can Be Suspended
            </h2>
            <p className="mt-3">
              Suspension happens when a listing no longer meets platform
              standards or raises trust concerns that require review. When our
              trust &amp; safety team suspends a listing, the registered owner
              receives an email naming one of the following reasons.
            </p>
            <p className="mt-3">
              Suspended listings are hidden from public results and new reviews on
              them are restricted while the issue is reviewed. The reason cited in
              your email is the starting point for any appeal.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    {opt.key === "general"
                      ? "General"
                      : opt.label.replace(/^General: /, "")}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600">{opt.emailLine}</p>
                  <p className="mt-2 text-xs text-gray-600">
                    {SUSPENSION_PLAIN_ENGLISH[opt.key]}
                  </p>
                  {opt.softRecipientNote ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {opt.softRecipientNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Enforcement Actions
            </h2>
            <p className="mt-3">
              We escalate based on severity and history. A first-time minor
              issue may receive a warning; repeated or severe violations can lead
              to suspension or permanent removal.
            </p>
            <p className="mt-3">
              Automated moderation may temporarily restrict content while trust
              and safety signals are assessed. Typical actions include:
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Content removal</h3>
                <p className="mt-1">
                  Reviews, replies, or photos that break the rules are taken
                  down.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Warnings</h3>
                <p className="mt-1">
                  Owners may receive a written notice with the specific rule and
                  a chance to fix the issue.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Consumer alert badge
                </h3>
                <p className="mt-1">
                  Listings with strong evidence of manipulated reviews can be
                  marked with a public alert.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Suspension</h3>
                <p className="mt-1">
                  The listing is hidden from public results pending review (see
                  reasons above).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Removal</h3>
                <p className="mt-1">
                  Repeat or severe offenders are permanently removed from the
                  platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Automated moderation
                </h3>
                <p className="mt-1">
                  Reviews that trigger trust or safety signals (such as rapid
                  submission patterns or potential conflicts of interest) may be
                  temporarily restricted, flagged for review, or limited in
                  visibility while assessed.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Appealing a Suspension
            </h2>
            <p className="mt-3">
              If your listing was suspended and you disagree with the decision,
              you may submit an appeal. Appeals should directly address the reason
              cited in the suspension email and include evidence not previously
              considered.
            </p>
            <p className="mt-3">
              You can still access your dashboard while suspended to make changes
              that resolve the underlying concern. Final decisions after appeal
              review are not reopened unless new material evidence warrants it.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Reply to the suspension email
                </h3>
                <p className="mt-1">
                  Respond to the official suspension notice with a clear
                  explanation of how the cited issue has been addressed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Contact Tellacity Support
                </h3>
                <p className="mt-1">
                  You may also contact{" "}
                  <Link href="/contact/support" className={linkClass}>
                    Tellacity Support
                  </Link>{" "}
                  if you need to escalate or clarify your appeal.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Include new evidence
                </h3>
                <p className="mt-1">
                  Provide documentation or context that was not available during
                  the original review. Include the specific reason cited in the
                  email and how the concern has been resolved.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Access business dashboard while suspended
                </h3>
                <p className="mt-1">
                  You can still access your{" "}
                  <Link href="/business/dashboard" className={linkClass}>
                    business dashboard
                  </Link>{" "}
                  while suspended to make changes that address the issue.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Final decisions</h3>
                <p className="mt-1">
                  Decisions made after appeal review are final.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Why These Standards Matter
            </h2>
            <p className="mt-3">
              A review platform is only valuable when consumers can trust it and
              businesses can build a reputation that&apos;s genuinely earned. These
              rules keep the marketplace fair for both sides.
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Trust and usefulness
                </h3>
                <p className="mt-1">
                  By holding every listing to the same standard, Tellacity stays
                  useful to consumers researching businesses and to businesses
                  building credible reputations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Consumer confidence
                </h3>
                <p className="mt-1">
                  Clear rules on fake reviews, misleading listings, and harmful
                  content help customers rely on feedback when making decisions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Business reputation
                </h3>
                <p className="mt-1">
                  Thank you for representing your business with integrity on
                  Tellacity. Fair enforcement protects honest businesses from
                  manipulation by bad actors.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Product-level reviews
                </h3>
                <p className="mt-1">
                  As Tellacity expands to include product-level reviews, these
                  standards ensure that feedback remains meaningful and
                  representative of real customer experiences. By balancing
                  openness with safeguards against manipulation, we aim to create
                  a platform where both consumers and businesses can rely on the
                  accuracy and integrity of every review.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-8">
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Related policy pages
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Use these pages to understand Tellacity&apos;s reviewer rules, trust
              framework, support options, and business tools.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {RELATED_PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-gray-600">
              Tellacity&apos;s business rules work alongside our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                reviewer
              </Link>{" "}
              and{" "}
              <Link href="/safety-trust" className={linkClass}>
                trust
              </Link>{" "}
              policies. For setup help, visit the{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>{" "}
              or explore the{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Reputation Platform
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
