import Image from "next/image";
import ShareArticle from "@/components/articles/ShareArticle";

export default function ClaimTellacityProfilePage() {
  return (
    <main className="bg-white">
      <article className="mx-auto w-full max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            For Businesses
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Why Every Business Should Claim Its Tellacity Profile
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            In the digital age, your online presence is your most valuable asset, and your
            Tellacity profile is a cornerstone of that presence. Claiming it unlocks powerful
            tools and puts you in control of your reputation.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src="/brand/Astonished woman.png"
              alt="Business owner surprised by positive feedback"
              width={960}
              height={540}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </header>

        <section className="space-y-4 text-sm text-gray-700">
          <p>
            For many potential customers, your Tellacity profile is the first impression they&apos;ll
            have of your business. While a profile may exist for your business, &quot;claiming&quot; it
            is a proactive step that unlocks a suite of powerful tools and benefits. It&apos;s the
            difference between being a passive subject of conversation and an active participant in
            shaping your own reputation. Here&apos;s why every business should claim its Tellacity
            profile in 2025.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            1. Take Control of Your Brand Narrative
          </h2>
          <p>
            An unclaimed profile often contains incomplete or outdated information. By claiming your
            profile, you can update your business name, address, phone number, website, and hours of
            operation. You can also add a compelling business description, upload high-quality
            photos, and showcase your logo. This ensures that the information customers find is
            accurate, professional, and aligned with your brand identity.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            2. Engage Directly with Your Customers
          </h2>
          <p>
            Claiming your profile allows you to respond to reviews. Engaging with feedback-both
            positive and negative-is one of the most powerful ways to build trust. Thanking
            customers for positive reviews shows appreciation, while responding to negative reviews
            demonstrates accountability and a commitment to customer service. This dialogue turns a
            static review page into a dynamic conversation, showing potential customers that you are
            an attentive and caring business.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            3. Unlock Powerful Reputation Management Tools
          </h2>
          <p>
            A claimed profile gives you access to a suite of tools designed to help you actively
            manage and grow your reputation. You can use Tellacity&apos;s invitation tools to
            proactively solicit reviews from your customers via email, SMS, or QR codes. A steady
            stream of fresh, authentic reviews is crucial for maintaining a high Trust Score and
            improving your visibility in search results.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            4. Gain Actionable Insights from Analytics
          </h2>
          <p>
            With a claimed profile, you unlock access to a detailed analytics dashboard. You can
            track trends in your ratings, monitor review volume, and analyze customer sentiment.
            These insights are invaluable for understanding what your customers love about your
            business and identifying areas for improvement. Data-driven decisions are the key to
            sustainable growth, and your Tellacity analytics provide the data you need.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            5. Enhance Your Visibility and SEO
          </h2>
          <p>
            Search engines like Google value trustworthy, well-maintained sources of information. A
            claimed and completed Tellacity profile sends strong signals of legitimacy and authority,
            which can boost your search engine rankings. The reviews on your profile also contribute
            to your online &quot;social proof,&quot; making your business a more attractive choice in
            search results. In a competitive market, this enhanced visibility can make all the
            difference.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            6. Protect Your Business from Fraud
          </h2>
          <p>
            Claiming your profile gives you access to advanced moderation tools. You can flag
            suspicious reviews for investigation by Tellacity&apos;s team of experts and provide
            evidence to dispute fraudulent feedback. In an era where fake reviews are a real threat,
            these tools are essential for protecting your hard-earned reputation and ensuring that
            your review profile is a fair and accurate reflection of your business.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#0E0E0E]">
            Take the Next Step
          </h2>
          <p>
            Claiming your Tellacity profile is a simple, free, and incredibly powerful step toward
            taking control of your online reputation. It&apos;s a declaration that you are an
            active, engaged business that is committed to transparency and customer satisfaction. In
            a world where trust is everything, it&apos;s one of the smartest investments you can
            make in your brand&apos;s future.
          </p>
        </section>
        <ShareArticle
          title="Why Every Business Should Claim Its Tellacity Profile"
          path="/articles/claim-tellacity-profile"
        />
      </article>
    </main>
  );
}
