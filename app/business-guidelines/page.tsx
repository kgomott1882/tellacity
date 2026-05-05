import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS } from "@/lib/adminBusinessSuspensionReasons";

export const metadata: Metadata = {
  title: "Business Guidelines | Tellacity",
  description:
    "Standards for businesses on Tellacity: eligibility, verification, engaging with reviews, prohibited conduct, and how listings can be suspended or restored.",
  alternates: { canonical: "/business-guidelines" },
};

export default function BusinessGuidelinesPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
              Tellacity Business Guidelines
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              The standards every business listing must meet
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
              These guidelines explain what we expect from businesses on
              Tellacity, how we evaluate listings, and the reasons a listing
              can be suspended or removed. Read alongside our{" "}
              <Link
                href="/reviewer-guidelines"
                className="text-[#0E3B36] underline-offset-2 hover:underline"
              >
                Reviewer Guidelines
              </Link>{" "}
              and{" "}
              <Link
                href="/safety-trust"
                className="text-[#0E3B36] underline-offset-2 hover:underline"
              >
                Safety &amp; Trust framework
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 space-y-10 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              1. Who Can List a Business
            </h2>
            <p className="mt-3">
              Tellacity is for real, operating businesses that serve customers.
              Listings must be:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">Genuine:</span>{" "}
                The business actually exists and trades with consumers under
                the name shown on the listing.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">Accurate:</span>{" "}
                Name, website, contact details, country, category, and
                description must match the real business and current operations.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">Lawful:</span>{" "}
                The business and the products or services it offers must comply
                with the laws of the country it operates in.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Single profile per business:
                </span>{" "}
                Do not create duplicate listings for the same business to
                influence ratings or visibility.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              2. Verification &amp; Domain Ownership
            </h2>
            <p className="mt-3">
              Verified businesses earn a public badge and gain access to
              dashboard tools, analytics, and review-response features. To stay
              verified:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Use a business email on your domain:
                </span>{" "}
                Owners and team members should sign in with an email tied to
                the business&apos;s registered domain whenever possible.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Keep ownership current:
                </span>{" "}
                When ownership or operations change, transfer the listing
                through the dashboard rather than creating a new one.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  No domain spoofing:
                </span>{" "}
                Do not claim a listing using an email or domain that doesn&apos;t
                belong to the business.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              3. Engaging With Reviews
            </h2>
            <p className="mt-3">
              How you respond to reviews says as much about your business as
              the reviews themselves. We expect:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Professional replies:
                </span>{" "}
                Be polite, factual, and solution-oriented. Avoid arguments,
                insults, or threats.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  No retaliation:
                </span>{" "}
                Never threaten, harass, or penalise a customer for posting a
                review you don&apos;t like.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">No bribery:</span>{" "}
                Do not offer discounts, refunds, free products, or other
                incentives in exchange for changing or removing a review.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Respect privacy:
                </span>{" "}
                Don&apos;t publish a customer&apos;s private contact details,
                order numbers, or sensitive information in a public reply.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              4. Inviting Reviews the Right Way
            </h2>
            <p className="mt-3">
              Asking real customers for honest feedback is encouraged and
              supported by our review-invitation tools. What is not allowed:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">No fake reviews:</span>{" "}
                Buying reviews, posting under fake identities, or asking staff,
                friends, or family to leave reviews is a banning offence.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">No catalog sweeps:</span>{" "}
                Bulk-posting reviews across many products of the same business
                in a short time window is treated as suspicious activity and
                will be auto-flagged for review.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  No competitor attacks:
                </span>{" "}
                Do not post negative reviews on competitors. Reviews from a
                business&apos;s own domain on its own listing are
                automatically blocked.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  No selective inviting:
                </span>{" "}
                Don&apos;t cherry-pick only happy customers. Invite all eligible
                customers fairly.
              </li>
            </ul>
            <p className="mt-4">
              To maintain a fair and trustworthy platform, Tellacity applies
              additional safeguards to detect unusual or unnatural review
              behaviour.
            </p>
            <p className="mt-3">
              Reviews submitted in rapid succession, across multiple products
              within a short timeframe, or in patterns that do not reflect
              normal customer behaviour may be automatically flagged for
              review.
            </p>
            <p className="mt-3">
              While customers are free to review multiple products they have
              genuinely experienced, activity that resembles bulk posting or
              review flooding may result in temporary restrictions or
              moderation review.
            </p>
            <p className="mt-3">
              These measures are designed to protect both consumers and
              businesses by ensuring that all feedback reflects real,
              independent customer experiences.
            </p>
            <p className="mt-3">
              Tellacity distinguishes between business-level reviews and
              product-level reviews. Customers may review individual products
              they have used, as well as their overall experience with a
              business. However, each review must be based on a genuine
              interaction and submitted independently. Repeated or coordinated
              submissions that attempt to influence ratings or visibility are
              treated as suspicious activity.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              5. Photos, Logos, and Listing Content
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Original or licensed:
                </span>{" "}
                Only upload images you own or are licensed to use. Don&apos;t use
                stock photos to misrepresent products or premises.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Accurate products:
                </span>{" "}
                Product photos must depict products you actually sell. Each
                product photo represents a unique reviewable item.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Appropriate content:
                </span>{" "}
                No nudity, violence, hate symbols, or content that endangers
                minors. No misleading badges, fake awards, or fake review
                counts.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Keep it current:
                </span>{" "}
                Photos older than our retention window may be archived. Refresh
                your gallery so the listing reflects what customers experience
                today.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              6. Disputing a Review
            </h2>
            <p className="mt-3">
              If you believe a review breaks our rules or is factually
              incorrect, you can flag it from your dashboard. Our team reviews
              every flag against these guidelines:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                For factual disputes (e.g. &quot;this person was never a
                customer&quot;), we may ask the reviewer for proof such as a
                receipt, invoice, or booking confirmation.
              </li>
              <li>
                We do not remove reviews simply because they are negative.
                Disagreement with an opinion is not grounds for removal.
              </li>
              <li>
                Reviews that violate hate-speech, harassment, illegal-content,
                or privacy rules are removed immediately.
              </li>
              <li>
                Decisions can be appealed once with new evidence not previously
                considered.
              </li>
            </ul>
            <p className="mt-4">
              In some cases, reviews may be temporarily restricted or placed
              under review while additional checks are completed. This may
              occur when unusual patterns, rapid submission behaviour, or
              potential conflicts of interest are detected.
            </p>
            <p className="mt-3">
              These reviews are not removed automatically, but may be hidden
              from public view until they are verified as compliant with our
              guidelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              7. Reasons a Listing Can Be Suspended
            </h2>
            <p className="mt-3">
              When our trust &amp; safety team suspends a listing, the
              registered owner receives an email naming one of the following
              reasons. Suspended listings are hidden from public results and
              new reviews on them are restricted while the issue is reviewed.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    {opt.label}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">{opt.emailLine}</p>
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
              8. Enforcement Actions
            </h2>
            <p className="mt-3">
              We escalate based on severity and history. Typical actions:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Content removal:
                </span>{" "}
                Reviews, replies, or photos that break the rules are taken
                down.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">Warnings:</span>{" "}
                Owners may receive a written notice with the specific rule and
                a chance to fix the issue.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Consumer alert badge:
                </span>{" "}
                Listings with strong evidence of manipulated reviews can be
                marked with a public alert.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">Suspension:</span>{" "}
                The listing is hidden from public results pending review (see
                Section 7 for reasons).
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">Removal:</span>{" "}
                Repeat or severe offenders are permanently removed from the
                platform.
              </li>
              <li>
                <span className="font-semibold text-[#0E0E0E]">
                  Automated moderation:
                </span>{" "}
                Reviews that trigger trust or safety signals (such as rapid
                submission patterns or potential conflicts of interest) may be
                temporarily restricted, flagged for review, or limited in
                visibility while assessed.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              9. Appealing a Suspension
            </h2>
            <p className="mt-3">
              If your listing was suspended and you disagree with the decision:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                Reply to the suspension email or contact{" "}
                <Link
                  href="/contact/support"
                  className="text-[#0E3B36] underline-offset-2 hover:underline"
                >
                  Tellacity Support
                </Link>{" "}
                with new evidence not previously considered.
              </li>
              <li>
                Include the specific reason cited in the email and how the
                concern has been resolved.
              </li>
              <li>
                You can still access your{" "}
                <Link
                  href="/business/dashboard"
                  className="text-[#0E3B36] underline-offset-2 hover:underline"
                >
                  business dashboard
                </Link>{" "}
                while suspended to make changes that address the issue.
              </li>
              <li>
                Decisions made after appeal review are final.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              10. Why These Standards Matter
            </h2>
            <p className="mt-3">
              A review platform is only valuable when consumers can trust it
              and businesses can build a reputation that&apos;s genuinely
              earned. By holding every listing to the same standard, Tellacity
              stays useful to both sides of the marketplace.
            </p>
            <p className="mt-3">
              Thank you for representing your business with integrity on
              Tellacity.
            </p>
            <p className="mt-3">
              As Tellacity expands to include product-level reviews, these
              standards ensure that feedback remains meaningful and
              representative of real customer experiences. By balancing
              openness with safeguards against manipulation, we aim to create
              a platform where both consumers and businesses can rely on the
              accuracy and integrity of every review.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
