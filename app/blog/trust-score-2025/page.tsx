import Image from "next/image";
import ShareArticle from "@/components/blog/ShareArticle";

export default function TrustScore2025Page() {
  return (
    <main className="bg-white">
      <article className="mx-auto w-full max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Trust &amp; Safety
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            How the Tellacity Trust Score Works in 2025
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            The Tellacity Trust Score is more than just an average of star ratings; it’s a
            dynamic, multi-faceted metric designed to reflect a business&apos;s true reputation
            in real time.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src="/brand/Asian Apple.png"
              alt="Customer using a phone to read reviews"
              width={960}
              height={540}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </header>

        <section className="space-y-4 text-sm text-gray-700">
          <p>
            In 2025, the Trust Score is calculated using a sophisticated algorithm that weighs
            several key factors, ensuring a fair, accurate, and comprehensive measure of
            trustworthiness. Understanding how it works is crucial for both businesses seeking
            to improve their reputation and consumers looking to make confident decisions. This
            guide breaks down the core components of the Tellacity Trust Score.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            1. Verified vs. Unverified Reviews
          </h2>
          <p>
            The most heavily weighted factor in the Trust Score is the verification status of a
            review. A &quot;Verified&quot; review, backed by proof of experience like a receipt or
            order confirmation, carries significantly more weight than an unverified one. This is
            because verification confirms a genuine interaction, making the feedback far more
            credible. Businesses with a higher proportion of verified reviews will naturally have
            a more resilient and trustworthy score.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            2. Recency of Reviews
          </h2>
          <p>
            A business&apos;s performance can change over time, so recent reviews are more
            indicative of its current quality than older ones. The Trust Score algorithm gives
            more weight to newer reviews and gradually reduces the impact of older feedback. This
            ensures the score is a relevant reflection of the business&apos;s present service
            levels, not its performance from years ago. A steady stream of recent reviews is key
            to maintaining a high score.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            3. Star Rating Distribution
          </h2>
          <p>
            While the average rating is important, the algorithm also analyzes the distribution
            of stars. A business with a mix of 4- and 5-star reviews is often more credible than
            one with only perfect 5-star ratings, which can sometimes be a sign of manipulation.
            The system looks for natural-looking patterns in feedback, rewarding organic and
            balanced review profiles.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            4. Business Engagement and Response Time
          </h2>
          <p>
            How a business interacts with its feedback is a strong signal of its commitment to
            customer service. The Trust Score algorithm rewards businesses that respond to
            reviews, especially negative ones, in a timely and professional manner. Quick
            response times and a high response rate demonstrate that a business is attentive,
            accountable, and values its customers&apos; opinions.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            5. Fraud Detection and Penalties
          </h2>
          <p>
            Tellacity’s advanced AI fraud detection system constantly scans for suspicious
            activity, including fake reviews, review bombing, and other forms of manipulation.
            When fraudulent activity is detected and confirmed, the offending reviews are
            removed, and the business may face a temporary penalty to its Trust Score. This
            protects both consumers and honest businesses by actively penalizing attempts to game
            the system.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            6. Volume of Reviews
          </h2>
          <p>
            The total number of reviews a business has also plays a role, albeit a smaller one. A
            business with hundreds of reviews has a more statistically reliable rating than one
            with only a few. While quality and verification are more important, a healthy volume
            of reviews provides a broader, more comprehensive view of the customer experience,
            contributing to a more stable Trust Score.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            Bringing It All Together
          </h2>
          <p>
            By combining these factors, the Tellacity Trust Score provides a holistic and
            trustworthy measure of a business&apos;s reputation. It’s a system designed to reward
            transparency, authenticity, and excellent customer service, giving consumers a
            reliable metric to guide their decisions and businesses a clear roadmap for building
            trust.
          </p>
        </section>
        <ShareArticle
          title="How the Tellacity Trust Score Works in 2025"
          path="/blog/trust-score-2025"
        />
      </article>
    </main>
  );
}

