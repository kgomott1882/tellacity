import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/reviewer-guidelines";

export const metadata: Metadata = {
  title: "Reviewer Guidelines | Tellacity",
  description:
    "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Reviewer Guidelines | Tellacity",
    description:
      "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reviewer Guidelines | Tellacity",
    description:
      "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
  },
  robots: { index: true, follow: true },
};

const reviewerGuidelinesJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reviewer Guidelines | Tellacity",
  description:
    "Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement.",
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
        name: "Reviewer Guidelines",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

export default function ReviewerGuidelinesPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewerGuidelinesJsonLd),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Tellacity Community &amp; Reviewer Guidelines
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
              Building a marketplace of trust requires clear rules. These
              guidelines ensure fairness, transparency, and respect for both
              consumers and businesses. They apply across the{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Platform
              </Link>{" "}
              and work alongside our{" "}
              <Link href="/how-tellacity-works" className={linkClass}>
                verification and moderation systems
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Core Principles
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity operates on three foundational pillars. Together they
              define how reviews are collected, displayed, and moderated so the
              platform stays useful for consumers and fair for businesses.
              Weighted proof matters more than anonymous noise because verified
              experiences give readers a stronger basis for trust.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Trust
            </h3>
            <p className="mt-2 leading-relaxed">
              We prioritize verified experiences over anonymous noise. Reviews
              backed by proof carry more weight in rankings, dispute handling,
              and how readers evaluate a business. Trust is the reason people
              come to Tellacity instead of relying on unverified claims.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Transparency
            </h3>
            <p className="mt-2 leading-relaxed">
              Consumers deserve the truth, and businesses deserve to know who is
              reviewing them. We do not hide negative feedback or sell removed
              reviews. Moderation decisions are based on visible evidence and
              documented process, not hidden deals.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Fairness
            </h3>
            <p className="mt-2 leading-relaxed">
              Both sides have a voice. Consumers can share their experiences,
              and businesses can respond publicly. Moderation is neutral and
              evidence-based, with the same standards applied whether feedback
              is positive or negative.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              General Rules for Everyone
            </h2>
            <p className="mt-3 leading-relaxed">
              Whether you are writing a review or replying to one, these rules
              apply to all users equally. They protect the community from abuse,
              keep content relevant, and preserve privacy for everyone involved.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Be Honest
            </h3>
            <p className="mt-2 leading-relaxed">
              Content must be factually accurate and reflect a genuine
              first-hand experience. Misleading claims, fabricated events, or
              reviews written without a real transaction undermine the platform
              for everyone.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Be Respectful
            </h3>
            <p className="mt-2 leading-relaxed">
              We have zero tolerance for hate speech, harassment,
              discrimination, threats, or obscenity. Strong criticism of a
              service is allowed; personal attacks and abusive language are not.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Stay Relevant
            </h3>
            <p className="mt-2 leading-relaxed">
              Keep content focused on the consumer experience. Do not use reviews
              for political rants or personal vendettas unrelated to the
              business transaction. Off-topic content makes it harder for
              others to find useful feedback.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Protect Privacy
            </h3>
            <p className="mt-2 leading-relaxed">
              Do not post sensitive personal data (like private phone numbers,
              addresses, or financial info) of others. Reviews should describe
              your experience without exposing people who did not choose to be
              public.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No Spam
            </h3>
            <p className="mt-2 leading-relaxed">
              Promotional content, repetitive posts, and malicious links are
              strictly prohibited. Spam dilutes genuine feedback and may result
              in content removal or account action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Guidelines for Consumers
            </h2>
            <p className="mt-3 leading-relaxed">
              Your reviews help others make better decisions. Following these
              guidelines keeps your feedback credible, useful, and harder to
              dismiss if it is ever challenged.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Provide Proof (Recommended)
            </h3>
            <p className="mt-2 leading-relaxed">
              Upload receipts, invoices, or booking confirmations. Verified
              reviews are trusted more and are harder to dispute. Proof helps
              moderators confirm that a review reflects a real customer
              relationship if a business questions it later.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Write Detailed Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Explain why you liked or disliked the service. &quot;Great
              job&quot; or &quot;Terrible&quot; is not as helpful as specific
              details about what happened, when, and how the business responded.
              Detailed reviews help other customers compare options with context.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              One Experience, One Review
            </h3>
            <p className="mt-2 leading-relaxed">
              Do not post multiple reviews for a single transaction to
              manipulate a score. You can update your existing review if the
              situation changes. One genuine experience should equal one review
              on the platform.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Conflict of Interest
            </h3>
            <p className="mt-2 leading-relaxed">
              You cannot review a business you own, work for, or is a direct
              competitor to your own business. Family members of owners are
              also restricted. In practical terms, if your review could benefit
              you financially or professionally, you should not post it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Guidelines for Businesses
            </h2>
            <p className="mt-3 leading-relaxed">
              How you respond to reviews says as much about your business as the
              reviews themselves. These rules protect consumers and prevent
              reputation manipulation.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Engage Professionally
            </h3>
            <p className="mt-2 leading-relaxed">
              Responses should be polite and solution-oriented. Avoid getting
              into arguments or insulting customers. Professional replies show
              future customers that you take feedback seriously, even when it is
              critical.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No Fake Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Soliciting fake positive reviews or paying for reviews is a
              banning offense. Asking real customers for honest feedback is
              allowed and encouraged. Fake review schemes distort Trust Scores
              and harm everyone who relies on Tellacity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No Retaliation
            </h3>
            <p className="mt-2 leading-relaxed">
              You may not threaten, harass, or penalize a customer for leaving
              a negative review. Retaliation destroys trust and may trigger
              enforcement beyond the original review dispute.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Employee Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Do not ask employees to write reviews about your business or your
              competitors. Employee reviews create a conflict of interest and
              are treated as manipulation, not genuine customer feedback.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Verified vs. Unverified Reviews
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity distinguishes between verified and unverified content so
              readers can weigh feedback appropriately. This balance protects
              openness for honest reviewers while preserving integrity against
              abuse.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Verified Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              The reviewer has submitted valid proof of purchase or experience
              (e.g., receipt, invoice) or used a verified invitation link.
              These reviews are highlighted and trusted more by our algorithm
              because they represent stronger signals of a real transaction.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Unverified Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Allowed, but flagged as &quot;Unverified&quot;. If challenged by a
              business, the reviewer must provide proof within a set timeframe,
              or the review may be removed. Unverified reviews keep the platform
              open while giving businesses a fair path to challenge suspicious
              content.
            </p>
            <p className="mt-3 leading-relaxed">
              We encourage all users to verify their reviews voluntarily to
              build a stronger reputation. See{" "}
              <Link href="/how-tellacity-works" className={linkClass}>
                How Tellacity Works
              </Link>{" "}
              for more on verification.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Dispute &amp; Moderation Process
            </h2>
            <p className="mt-3 leading-relaxed">
              We use a combination of automated systems and human moderation.
              The flow is designed to be plain and predictable: content is
              flagged, investigated, and decided on evidence—not on whether a
              business simply dislikes the outcome.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Flagging
            </h3>
            <p className="mt-2 leading-relaxed">
              Community members or businesses can flag content that violates
              these guidelines. Flags start a review; they do not automatically
              remove content.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Investigation
            </h3>
            <p className="mt-2 leading-relaxed">
              Our team reviews the flag. For factual disputes (e.g., &quot;This
              person was never a customer&quot;), we may ask the reviewer for
              proof. Opinion disputes—such as disagreement about service
              quality—are not treated the same as claims that the reviewer never
              transacted with the business.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Decision
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                If proof is provided, the review stays (unless it violates other
                rules like hate speech).
              </li>
              <li>
                If no proof is provided upon request, the review may be removed.
              </li>
              <li>
                Content violating hate speech or harassment policies is removed
                immediately.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed">
              We do not remove reviews simply because they are negative.
              Disagreement with an opinion is not grounds for removal. Read
              more in{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Enforcement Actions
            </h2>
            <p className="mt-3 leading-relaxed">
              Violating these guidelines results in consequences. Enforcement is
              meant to protect trust, not punish disagreement. A single harsh
              but honest review will not trigger removal; repeated hate speech,
              fake reviews, or retaliation will.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Content Removal
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews or replies breaking rules will be deleted. Examples include
              spam, threats, fabricated experiences, or content that clearly
              violates privacy rules.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Warnings
            </h3>
            <p className="mt-2 leading-relaxed">
              Users or businesses may receive formal warnings when conduct
              approaches a policy line or repeats after a minor issue. Warnings
              document the problem before stronger action is taken.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Consumer Ban
            </h3>
            <p className="mt-2 leading-relaxed">
              Repeat offenders may be banned from posting reviews. This applies
              to patterns of fake reviews, harassment, or deliberate score
              manipulation—not to one disputed negative experience.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Business Penalties
            </h3>
            <p className="mt-2 leading-relaxed">
              Businesses caught manipulating reviews (e.g., buying fakes) may
              receive a &quot;Consumer Alert&quot; badge on their profile
              warning users of suspicious activity, or be removed from the
              platform entirely.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Appeals
            </h2>
            <p className="mt-3 leading-relaxed">
              We understand that moderation mistakes can happen. Appeals exist so
              users can challenge a decision once, with new information—not to
              reopen the same argument indefinitely.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              One appeal only
            </h3>
            <p className="mt-2 leading-relaxed">
              If your content was removed, or a flag was rejected, you may
              appeal the decision once. This limit keeps the process fair and
              prevents endless re-litigation of the same case.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              New evidence required
            </h3>
            <p className="mt-2 leading-relaxed">
              Appeals must include new information or evidence not previously
              considered. Repeating the same claim without additional proof will
              not change the outcome.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Final decisions
            </h3>
            <p className="mt-2 leading-relaxed">
              Decisions made after an appeal review are final. See the{" "}
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>{" "}
              for common questions about disputes and moderation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Why These Guidelines Matter
            </h2>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Why trust matters
            </h3>
            <p className="mt-2 leading-relaxed">
              A review platform is only useful if it is trusted. When consumers
              cheat, businesses suffer unfairly. When businesses cheat,
              consumers lose money and trust. Honesty from both sides is what
              makes Tellacity worth using.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Why fairness matters
            </h3>
            <p className="mt-2 leading-relaxed">
              By strictly enforcing these guidelines, we ensure that Tellacity
              remains a valuable resource for finding great businesses and for
              businesses to build a genuine, hard-earned reputation. Fair
              enforcement protects reviewers with legitimate complaints and
              businesses that respond in good faith.
            </p>
            <p className="mt-3 leading-relaxed">
              These guidelines are part of the broader{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Platform
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Final Word
            </h2>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Community responsibility
            </h3>
            <p className="mt-2 leading-relaxed">
              Tellacity is a community. We rely on you—our users and business
              partners—to uphold these standards. The platform works only when
              people treat reviews and responses as a shared responsibility,
              not a tool to game rankings.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Honest participation
            </h3>
            <p className="mt-2 leading-relaxed">
              Be honest, be fair, and help us create a marketplace where the
              truth wins. Thank you for being part of Tellacity. Learn more
              about our mission on the{" "}
              <Link href="/about" className={linkClass}>
                About
              </Link>{" "}
              page.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Related trust pages
            </h2>
            <p className="mt-3 leading-relaxed">
              Learn more about how moderation, verification, and reputation
              work across Tellacity.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <Link href="/how-tellacity-works" className={linkClass}>
                  How Tellacity Works
                </Link>
              </li>
              <li>
                <Link href="/safety-trust" className={linkClass}>
                  Safety &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/reputation-platform" className={linkClass}>
                  Reputation Platform
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About Tellacity
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
