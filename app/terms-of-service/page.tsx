import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Tellacity",
  description:
    "Read Tellacity’s Terms of Service to understand the rules for using the platform, including reviews, business profiles, moderation, subscriptions, liability, and legal rights.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Terms of Service | Tellacity",
    description:
      "Read Tellacity’s Terms of Service to understand the rules for using the platform, including reviews, business profiles, moderation, subscriptions, liability, and legal rights.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Tellacity",
    description:
      "Read Tellacity’s Terms of Service to understand the rules for using the platform, including reviews, business profiles, moderation, subscriptions, liability, and legal rights.",
  },
  robots: { index: true, follow: true },
};

const termsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service | Tellacity",
  description:
    "Tellacity’s Terms of Service explain the rules for using the platform, including reviews, business profiles, moderation, subscriptions, liability, and legal rights.",
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
        name: "Terms of Service",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

export default function TermsOfServicePage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
              These Terms of Service explain the rules, responsibilities, and
              limitations that apply when you use Tellacity&apos;s website,
              mobile applications, and related services. They work alongside our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>{" "}
              and trust policies to keep the platform fair.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Definitions
            </h2>
            <p className="mt-3 leading-relaxed">
              These definitions explain who the parties are and what
              &quot;Services&quot; and &quot;Content&quot; mean throughout this
              agreement. They apply to both consumers and businesses unless a
              section states otherwise.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Tellacity
            </h3>
            <p className="mt-2 leading-relaxed">
              &quot;Tellacity&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot; refers to Tellacity, the operator of this
              platform.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Services
            </h3>
            <p className="mt-2 leading-relaxed">
              &quot;Services&quot; refers to the website, mobile applications,
              and other online products and services provided by Tellacity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">User</h3>
            <p className="mt-2 leading-relaxed">
              &quot;User&quot; or &quot;you&quot; refers to any individual or
              entity who accesses or uses the Services, whether as a consumer
              or a business.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Consumer
            </h3>
            <p className="mt-2 leading-relaxed">
              &quot;Consumer&quot; refers to a User who uses the Services
              primarily to read or write reviews.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Business
            </h3>
            <p className="mt-2 leading-relaxed">
              &quot;Business&quot; refers to a User who uses the Services to
              manage a business profile, respond to reviews, or use other
              business-focused features.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Content
            </h3>
            <p className="mt-2 leading-relaxed">
              &quot;Content&quot; refers to text, images, photos, audio, video,
              location data, and all other forms of data or communication.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Eligibility
            </h2>
            <p className="mt-3 leading-relaxed">
              You must meet the requirements below to use Tellacity. These
              conditions help ensure users can enter a binding agreement and use
              the platform lawfully.
            </p>
            <p className="mt-3 leading-relaxed">
              By using our Services, you represent and warrant that:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Age requirement
            </h3>
            <p className="mt-2 leading-relaxed">You are at least 18 years old.</p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Legal capacity
            </h3>
            <p className="mt-2 leading-relaxed">
              You have the legal capacity to enter into a binding contract.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Prior suspension or removal
            </h3>
            <p className="mt-2 leading-relaxed">
              You have not been previously suspended or removed from our
              Services.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Compliance with laws
            </h3>
            <p className="mt-2 leading-relaxed">
              Your use of the Services complies with all applicable laws and
              regulations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              User Obligations (Consumers)
            </h2>
            <p className="mt-3 leading-relaxed">
              As a consumer, you agree to post honest reviews based on real
              experiences, avoid conflicts of interest, and treat others
              respectfully. Incentives for reviews are restricted except where
              our policies explicitly allow and require disclosure.
            </p>
            <p className="mt-3 leading-relaxed">As a Consumer, you agree to:</p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Truthful and accurate reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Provide truthful and accurate information in your reviews based on
              your own genuine, first-hand experiences.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Conflict of interest
            </h3>
            <p className="mt-2 leading-relaxed">
              Not write reviews for businesses you own, work for, or have a
              direct conflict of interest with (e.g., a competitor).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No payment for reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Not accept payment or other incentives in exchange for writing,
              editing, or deleting a review, except as explicitly permitted by
              our policies (e.g., incentivized reviews must be clearly
              disclosed).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Respectful conduct
            </h3>
            <p className="mt-2 leading-relaxed">
              Treat businesses and other users with respect and refrain from
              harassment, hate speech, or threats.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Independent customer experiences
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews must reflect independent customer experiences. Users may
              review both businesses and individual products or services they
              have genuinely interacted with. However, submitting multiple
              reviews in a way that appears automated, coordinated, or
              inconsistent with normal customer behaviour may result in
              restrictions, moderation, or removal of such content.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Product and service reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Product and service reviews are allowed when they reflect genuine
              interactions. See our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>{" "}
              for detailed expectations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              User Obligations (Businesses)
            </h2>
            <p className="mt-3 leading-relaxed">
              Business users must keep profile information accurate, verify
              ownership honestly, and engage with reviewers professionally.
              Fake review schemes and harassment of reviewers are prohibited.
            </p>
            <p className="mt-3 leading-relaxed">As a Business, you agree to:</p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Accurate business profile information
            </h3>
            <p className="mt-2 leading-relaxed">
              Provide accurate and up-to-date information when claiming or
              managing your business profile.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No fraudulent verification
            </h3>
            <p className="mt-2 leading-relaxed">
              Not verify your own business using fraudulent documents or
              methods.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No fake review solicitation
            </h3>
            <p className="mt-2 leading-relaxed">
              Not solicit fake reviews or offer incentives for positive reviews
              in a way that violates our policies or applicable laws (e.g.,
              &quot;review gating&quot;).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Professional responses
            </h3>
            <p className="mt-2 leading-relaxed">
              Respond to reviews professionally and respectfully. You may not
              use the platform to harass, threaten, or doxx reviewers.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Privacy of customers
            </h3>
            <p className="mt-2 leading-relaxed">
              Respect the privacy of your customers and not disclose personal
              information in your responses without consent. See{" "}
              <Link href="/for-business" className={linkClass}>
                Tellacity for Business
              </Link>{" "}
              and our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Reviews and Platform Integrity
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity is committed to maintaining the integrity of our
              platform. We employ automated algorithms and human moderation to
              detect and remove content that violates our policies.
            </p>
            <p className="mt-3 leading-relaxed">
              Fake reviews, spam, abusive content, promotional material disguised
              as reviews, and suspicious bulk behaviour undermine trust for
              everyone. Product and service reviews are permitted when they
              reflect real customer experiences.
            </p>
            <p className="mt-3 leading-relaxed">We strictly prohibit:</p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Fake reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews not based on a genuine experience.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Conflict of interest
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews written by employees, competitors, or anyone with a
              financial interest in the business&apos;s reputation.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">Spam</h3>
            <p className="mt-2 leading-relaxed">
              Repeated, irrelevant, or promotional content.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Abusive content
            </h3>
            <p className="mt-2 leading-relaxed">
              Hate speech, threats, harassment, or obscenity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Promotional content disguised as reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews that are primarily written to promote a business, product,
              or service rather than share a genuine customer experience. This
              includes press releases, advertisements, or marketing-style
              content. Such content will be removed.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Unnatural review behaviour
            </h3>
            <p className="mt-2 leading-relaxed">
              Submitting multiple reviews in rapid succession, reviewing a large
              number of products or services within a short timeframe, or
              engaging in patterns that do not reflect typical consumer
              behaviour may be treated as suspicious activity and subject to
              moderation or restriction.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Product reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Tellacity allows reviews of individual products or services in
              addition to overall business reviews. Each product review must be
              based on a genuine experience. Attempting to artificially influence
              ratings through bulk or coordinated product reviews is prohibited.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Content quality
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews must reflect a genuine customer experience. Content that
              appears automated, overly generic, excessively long without
              substance, or structured like an article, press release, or
              advertisement may be removed.
            </p>
            <p className="mt-3 leading-relaxed">
              We reserve the right to remove any content that we determine, in
              our sole discretion, violates these Terms or our Content
              Guidelines.
            </p>
            <p className="mt-3 leading-relaxed">
              We may limit the visibility, restrict, or remove content that
              appears inconsistent with genuine user behaviour, even if it does
              not explicitly violate a single rule, where necessary to protect
              the integrity of the platform. See{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              and{" "}
              <Link href="/how-tellacity-works" className={linkClass}>
                How Tellacity Works
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Moderation and Enforcement
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity may monitor and moderate content to protect platform
              trust. Enforcement actions are taken to preserve integrity, not to
              suppress legitimate negative feedback.
            </p>
            <p className="mt-3 leading-relaxed">
              Tellacity has the right, but not the obligation, to monitor and
              moderate content posted on our Services. If we find that you have
              violated these Terms, we may take action, including but not
              limited to:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Monitoring
            </h3>
            <p className="mt-2 leading-relaxed">
              We may review content and account activity using automated systems
              and human moderators to detect policy violations and suspicious
              behaviour.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Content removal
            </h3>
            <p className="mt-2 leading-relaxed">
              Removing or hiding the offending content.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Warnings
            </h3>
            <p className="mt-2 leading-relaxed">Issuing a warning.</p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Suspension or termination
            </h3>
            <p className="mt-2 leading-relaxed">
              Suspending or terminating your account, reporting illegal activity
              to law enforcement where appropriate, or temporarily limiting
              account activity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Consumer Warning badges
            </h3>
            <p className="mt-2 leading-relaxed">
              Applying &quot;Consumer Warning&quot; badges to business profiles
              that engage in suspicious activity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Restricting submission capabilities
            </h3>
            <p className="mt-2 leading-relaxed">
              Restricting review submission capabilities or reducing visibility
              of content pending review.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Appeals
            </h3>
            <p className="mt-2 leading-relaxed">
              Decisions made by our moderation team are final. You may appeal a
              decision if provided a mechanism to do so, but we are not obligated
              to grant appeals. See our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>{" "}
              and{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Intellectual Property
            </h2>
            <p className="mt-3 leading-relaxed">
              Users retain ownership of content they post, but grant Tellacity
              a license to display and use it on the platform. Tellacity owns
              its branding, software, and other platform materials.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Your content
            </h3>
            <p className="mt-2 leading-relaxed">
              You retain ownership of the content you post to Tellacity.
              However, by posting content, you grant Tellacity a non-exclusive,
              worldwide, royalty-free, perpetual, irrevocable, and sublicensable
              right to use, reproduce, modify, adapt, publish, translate, create
              derivative works from, distribute, and display such content in
              connection with our Services.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Our content
            </h3>
            <p className="mt-2 leading-relaxed">
              The Services and all materials contained therein (excluding user
              content), including software, designs, text, graphics, and logos,
              are the property of Tellacity or our licensors and are protected
              by copyright, trademark, and other intellectual property laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Subscription Plans and Payments
            </h2>
            <p className="mt-3 leading-relaxed">
              Business users may subscribe to paid plans with different features
              and limits. Billing is recurring unless cancelled, and
              cancellation takes effect at the end of the current billing
              period.
            </p>
            <p className="mt-3 leading-relaxed">
              For our business users, we offer various subscription plans
              (&quot;Plans&quot;) with different features and limits.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">Plans</h3>
            <p className="mt-2 leading-relaxed">
              Plans may include free and paid tiers with different tools for
              reputation management, analytics, and business features. Current
              options are described on our pricing page.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">Fees</h3>
            <p className="mt-2 leading-relaxed">
              By subscribing to a paid Plan, you agree to pay the applicable
              fees. Fees are billed in advance on a recurring basis (e.g.,
              monthly or annually).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Payment method
            </h3>
            <p className="mt-2 leading-relaxed">
              You must provide a valid payment method. Payments are processed by
              our third-party payment processor. You authorize us to charge your
              payment method for all applicable fees.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Changes to fees
            </h3>
            <p className="mt-2 leading-relaxed">
              We reserve the right to change our pricing at any time. We will
              provide notice of any price changes before they take effect.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Cancellation
            </h3>
            <p className="mt-2 leading-relaxed">
              You may cancel your subscription at any time. Your cancellation
              will take effect at the end of the current billing period. We do
              not provide refunds for partial billing periods. See{" "}
              <Link href="/for-business" className={linkClass}>
                Tellacity for Business
              </Link>{" "}
              for plan details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Third-Party Services
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity may link to external websites and services. Those
              third parties operate under their own terms and privacy practices,
              which are outside Tellacity&apos;s control.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              External links
            </h3>
            <p className="mt-2 leading-relaxed">
              Our Services may contain links to third-party websites or services
              that are not owned or controlled by Tellacity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No responsibility for third-party content
            </h3>
            <p className="mt-2 leading-relaxed">
              We have no control over, and assume no responsibility for, the
              content, privacy policies, or practices of any third-party
              websites or services. You acknowledge and agree that Tellacity
              shall not be responsible or liable, directly or indirectly, for
              any damage or loss caused or alleged to be caused by or in
              connection with the use of or reliance on any such content, goods,
              or services available on or through any such websites or services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Disclaimers
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity provides the Services on an as-is basis and does not
              guarantee that user-generated content is accurate or complete.
              Your use of reviews and other user content is at your own risk.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              AS-IS service
            </h3>
            <p className="mt-2 leading-relaxed">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              User content disclaimer
            </h3>
            <p className="mt-2 leading-relaxed">
              WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR USEFULNESS OF
              ANY CONTENT POSTED BY USERS. WE DO NOT ENDORSE ANY OPINIONS
              EXPRESSED BY USERS. YOUR RELIANCE ON ANY CONTENT IS AT YOUR OWN
              RISK.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Limitation of Liability
            </h2>
            <p className="mt-3 leading-relaxed">
              To the maximum extent permitted by law, Tellacity&apos;s liability
              for damages arising from use of the Services is limited as
              described below. Some jurisdictions do not allow certain
              limitations, so these may not apply to you in full.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Direct and indirect losses
            </h3>
            <p className="mt-2 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TELLACITY SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
              INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
              GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR
              ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES;
              (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR
              (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS
              OR CONTENT.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Data loss and unauthorized access
            </h3>
            <p className="mt-2 leading-relaxed">
              This limitation includes losses related to data loss, service
              interruption, third-party conduct on the platform, and
              unauthorized access to or alteration of your transmissions or
              content, subject to applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Indemnification
            </h2>
            <p className="mt-3 leading-relaxed">
              If your use of Tellacity causes legal claims against the platform,
              you agree to defend and hold Tellacity harmless as described
              below.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              User responsibility
            </h3>
            <p className="mt-2 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Tellacity, its
              officers, directors, employees, and agents from and against any
              claims, liabilities, damages, losses, and expenses, including
              reasonable legal and accounting fees, arising out of or in any way
              connected with your access to or use of the Services, your
              violation of these Terms, or your violation of any third-party
              right, including without limitation any intellectual property
              right, publicity, confidentiality, property, or privacy right.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Termination
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity may suspend or end your access to the Services if you
              breach these Terms or for other reasons described below.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Suspension or termination
            </h3>
            <p className="mt-2 leading-relaxed">
              We may terminate or suspend your account and access to the Services
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Effect of termination
            </h3>
            <p className="mt-2 leading-relaxed">
              Upon termination, your right to use the Services will immediately
              cease.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Changes to Terms
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity may update these Terms from time to time. You should
              review this page periodically to stay informed of changes.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Material changes
            </h3>
            <p className="mt-2 leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. What constitutes a material change will
              be determined at our sole discretion.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Notice period
            </h3>
            <p className="mt-2 leading-relaxed">
              If a revision is material, we will try to provide at least 30
              days&apos; notice prior to any new terms taking effect.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Continued use
            </h3>
            <p className="mt-2 leading-relaxed">
              By continuing to access or use our Service after those revisions
              become effective, you agree to be bound by the revised terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Governing Law and Jurisdiction
            </h2>
            <p className="mt-3 leading-relaxed">
              These Terms are interpreted under applicable laws in the
              jurisdictions where Tellacity operates. Local consumer and data
              protection laws may give you additional rights.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Applicable laws
            </h3>
            <p className="mt-2 leading-relaxed">
              These Terms are governed by applicable laws in the jurisdictions
              where Tellacity operates.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Local consumer rights
            </h3>
            <p className="mt-2 leading-relaxed">
              Users may also have rights under their local consumer protection
              and data protection laws. See our{" "}
              <Link href="/data-protection" className={linkClass}>
                Data Protection
              </Link>{" "}
              page for more information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Contact Us
            </h2>
            <p className="mt-3 leading-relaxed">
              For questions about these Terms or legal notices, contact Tellacity
              using the channels below.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Contact form
            </h3>
            <p className="mt-2 leading-relaxed">
              If you have any questions about these Terms, please contact us via
              our{" "}
              <Link href="/contact" className={linkClass}>
                contact form
              </Link>
              .
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Legal email
            </h3>
            <p className="mt-2 leading-relaxed">
              You may also email legal@tellacity.com.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Related legal and trust pages
            </h2>
            <p className="mt-3 leading-relaxed">
              Learn more about Tellacity&apos;s trust, moderation, privacy, and
              support policies.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className={linkClass}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/data-protection" className={linkClass}>
                  Data Protection
                </Link>
              </li>
              <li>
                <Link href="/reviewer-guidelines" className={linkClass}>
                  Reviewer Guidelines
                </Link>
              </li>
              <li>
                <Link href="/help-center" className={linkClass}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/safety-trust" className={linkClass}>
                  Safety &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/how-tellacity-works" className={linkClass}>
                  How Tellacity Works
                </Link>
              </li>
              <li>
                <Link href="/for-business" className={linkClass}>
                  Tellacity for Business
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
            <p className="mt-6 leading-relaxed">
              These Terms work alongside Tellacity&apos;s{" "}
              <Link href="/privacy-policy" className={linkClass}>
                privacy
              </Link>{" "}
              and{" "}
              <Link href="/safety-trust" className={linkClass}>
                trust
              </Link>{" "}
              policies. Tellacity&apos;s terms, privacy, and trust policies work
              together to keep the platform fair.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
