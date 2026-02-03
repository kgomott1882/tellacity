export default function HelpCenterPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Help Center – Tellacity
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
            Welcome to the Tellacity Help Center. Here you’ll find clear answers
            about how reviews work, how trust is maintained, and how both
            consumers and businesses can use Tellacity fairly and effectively.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            Use the search below or browse by topic to find what you need.
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search for answers"
                className="w-full border-0 bg-transparent text-sm text-[#0E0E0E] placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0B3B36] px-6 text-sm font-semibold text-white"
            >
              Search
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Examples: “verification”, “billing”, “reviews”, “claim business”
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 space-y-10">
          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Getting Started
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              New to Tellacity? Start here.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  What is Tellacity?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tellacity is a customer review and feedback platform designed
                  to help people make informed decisions and help businesses
                  build trust through transparency. Reviews on Tellacity are
                  tied to real users and are moderated to protect fairness for
                  both customers and businesses.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Who can use Tellacity?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tellacity is open to:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>Consumers, who can write and read reviews about businesses</li>
                  <li>
                    Businesses, who can claim their profiles, respond to reviews,
                    and manage their reputation
                  </li>
                  <li>Both groups follow the same trust and content rules.</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">Reviews</h2>
            <p className="mt-2 text-sm text-gray-600">
              Writing, editing, and managing reviews.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  How do I write a review?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  You can write a review by searching for a business on
                  Tellacity and selecting Write a Review. You’ll be asked to
                  rate your experience, describe what happened, and verify your
                  identity before the review is published.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  What is a Verified Review?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  A Verified Review means Tellacity has taken steps to confirm
                  the reviewer’s identity or experience. Verification helps
                  prevent fake reviews and ensures feedback reflects real
                  customer experiences.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Can I edit or delete my review?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  You may be able to edit your review within a limited time
                  after publishing. Reviews can only be removed if they violate
                  Tellacity’s content guidelines or moderation rules.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  When are reviews removed?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Reviews are removed only if they breach our policies — such as
                  containing abuse, false information, spam, or conflicts of
                  interest. Negative reviews are not removed simply because a
                  business disagrees with them.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Trust, Verification &amp; Moderation
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              How we keep the platform safe.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  How does the verification process work?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tellacity uses verification checks to ensure reviews are
                  linked to real people and genuine experiences. This may
                  include identity checks, email confirmation, or experience
                  validation depending on the situation.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  How does moderation work?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Moderation focuses on content quality and fairness, not
                  opinions. Tellacity does not remove reviews for being critical.
                  Moderation only applies when content breaks our rules.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  What happens during a dispute?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  If a review is disputed, Tellacity reviews the content against
                  its guidelines. Both the reviewer and the business may be
                  asked for clarification. Decisions are based on evidence and
                  policy, not payment or influence.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Can businesses pay to remove reviews?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  No. Businesses cannot pay to remove, hide, or alter reviews.
                  Trust on Tellacity is built through transparency and response
                  — not suppression.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Businesses on Tellacity
            </h2>
            <p className="mt-2 text-sm text-gray-600">Tools for business owners.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  How do I claim my business?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Businesses can claim their profile by verifying ownership or
                  association with the business. Once claimed, businesses can
                  respond to reviews, update information, and access business
                  tools.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  How should I respond to reviews?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Businesses are encouraged to respond professionally and
                  constructively — especially to negative feedback. Public
                  responses show accountability and help build trust with future
                  customers.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Does Tellacity help with SEO?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Public business profiles and reviews can improve visibility
                  and credibility online. While Tellacity does not guarantee
                  rankings, transparent feedback can positively support
                  discoverability.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Plans &amp; Billing
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Pricing, subscriptions, and payments.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Is Tellacity free?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Yes. Tellacity offers free access for consumers and basic
                  business profiles. Optional paid plans may include additional
                  tools or features for businesses.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Does paying affect my ratings?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  No. Ratings, review visibility, and trust indicators are never
                  influenced by payment or subscription level.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Platform &amp; Global Reach
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Availability and localization.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Is Tellacity available in my country?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tellacity is available in multiple regions and continues to
                  expand. Availability may vary depending on local regulations
                  and rollout phases.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  What languages are supported?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tellacity supports multiple languages, with additional
                  languages added over time to improve accessibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
