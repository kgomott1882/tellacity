export default function BadgesGuidePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            TRUST SIGNALS
          </p>
          <h1 className="text-4xl font-bold mb-6">
            Badges Guide
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Learn what Tellacity badges represent and how they communicate
            trust, transparency, and credibility to customers.
          </p>
        </div>

        {/* Why Badges Matter */}
        <div className="mb-20">
          <h2 className="text-2xl font-semibold mb-6">
            Why Badges Matter
          </h2>
          <p className="text-gray-700 mb-4">
            Consumers rely heavily on visible trust signals when making
            decisions online. Badges provide immediate reassurance that a
            business has met specific transparency and credibility standards.
          </p>
          <p className="text-gray-700 mb-4">
            Clear verification markers reduce decision friction and help users
            confidently engage with businesses.
          </p>
          <p className="text-gray-700">
            Over time, consistent trust signals strengthen brand perception and
            increase long-term customer loyalty.
          </p>
        </div>

        {/* Badge Types */}
        <div className="mb-20">
          <h2 className="text-2xl font-semibold mb-10">
            Badge Types
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-100 rounded-full mb-4"></div>
              <h3 className="font-semibold mb-2">Verified Business</h3>
              <p className="text-gray-600">
                Confirms that the business has officially claimed and verified
                ownership of its Tellacity profile.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-100 rounded-full mb-4"></div>
              <h3 className="font-semibold mb-2">Top Rated</h3>
              <p className="text-gray-600">
                Awarded to businesses maintaining consistently high ratings
                over time.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-100 rounded-full mb-4"></div>
              <h3 className="font-semibold mb-2">Transparency Leader</h3>
              <p className="text-gray-600">
                Recognizes businesses that actively respond to reviews and
                engage customers openly.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-100 rounded-full mb-4"></div>
              <h3 className="font-semibold mb-2">
                Trusted Score Certified
              </h3>
              <p className="text-gray-600">
                Granted to businesses meeting credibility benchmarks across
                multiple signals.
              </p>
            </div>

          </div>
        </div>

        {/* How Earned */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            How Badges Are Earned
          </h2>

          <ul className="space-y-4 text-gray-700">
            <li>• Consistent review quality and rating stability</li>
            <li>• Authentic customer engagement and response behavior</li>
            <li>• Profile verification and business identity confirmation</li>
            <li>• Ongoing transparency signals and platform compliance</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
