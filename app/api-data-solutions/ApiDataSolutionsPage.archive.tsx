export default function ApiDataSolutionsPage() {
  return (
    <main className="bg-white">
      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
                Tellacity for Developers
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
                API &amp; Data Solutions
              </h1>
              <p className="mt-4 text-sm text-gray-600">
                Turn customer experiences into actionable insights with the
                world&apos;s most trusted review data. Leverage our proof-aware
                verification layer to distinguish genuine consumer feedback from
                noise. Access real-time sentiment analysis, verification signals,
                and reputation metrics via our enterprise-grade API.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full bg-[#0B3B36] px-5 py-2 text-xs font-semibold text-white"
                >
                  Get in touch
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#0B3B36] px-5 py-2 text-xs font-semibold text-[#0B3B36]"
                >
                  View use cases
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl bg-gray-100">
              <div className="h-56 w-full bg-gray-200 sm:h-72" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Understand trust trends in real time
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            Data without context is just noise. Tellacity provides the
            verification layer that makes consumer data valuable.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Verified vs. Unverified",
                text: "Filter signals based on proof-of-purchase data. Distinguish between verified customer experiences and unverified claims to build cleaner datasets.",
              },
              {
                title: "Sentiment & Patterns",
                text: "Analyze semantic patterns in review text to detect emerging issues, fraud attempts, or viral positive sentiment before it hits the mainstream.",
              },
              {
                title: "Reputation Over Time",
                text: "Track historical reputation scores across industries. Identify reliable long-term players versus volatile actors in the market.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Tellacity Data Solutions
              </h2>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    Tellacity API
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Direct REST API access to our business directory, review
                    streams, and verification statuses. Integrate trust signals
                    directly into your CRM, risk engine, or market analysis
                    platform. High-throughput endpoints designed for enterprise
                    scale.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    Trust Intelligence
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Aggregated reports and raw data exports for deep learning
                    and model training. Perfect for financial institutions
                    assessing merchant risk or investors analyzing brand health
                    metrics across specific sectors.
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl bg-gray-100">
              <div className="h-64 w-full bg-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B3B36] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold">Built for responsible data use</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-white/80">
            We believe data should empower, not exploit. Our data products are
            built on a foundation of strict privacy compliance, ensuring that
            while you get the insights you need, personal consumer data remains
            protected and anonymized where appropriate.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold text-white/90">
            {["GDPR Compliant", "Privacy First", "Ethical Sourcing"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 px-4 py-2"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Embedding trust across industries
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            From risk assessment to market research, verified review data powers
            decisions across the modern economy.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "E-commerce",
                text: "Validate merchant quality and product authenticity using aggregate verification data.",
              },
              {
                title: "Financial Services",
                text: "Enhance KYB (Know Your Business) processes with real-world reputation signals.",
              },
              {
                title: "Technology",
                text: "Train LLMs and sentiment analysis models on clean, structured, and verified datasets.",
              },
              {
                title: "Research",
                text: "Conduct granular market analysis based on verified consumer behavior patterns.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                  Security, privacy &amp; compliance
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>
                    <span className="font-semibold text-[#0E0E0E]">
                      Encryption:
                    </span>{" "}
                    All data is encrypted in transit (TLS 1.2+) and at rest
                    (AES-256).
                  </li>
                  <li>
                    <span className="font-semibold text-[#0E0E0E]">
                      Access Controls:
                    </span>{" "}
                    Granular API key permissions and IP whitelisting
                    capabilities.
                  </li>
                  <li>
                    <span className="font-semibold text-[#0E0E0E]">
                      Privacy-by-Design:
                    </span>{" "}
                    PII is automatically redacted or hashed unless explicitly
                    authorized under data processing agreements.
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-gray-100 p-6">
                <div className="h-24 w-24 rounded-full border border-gray-200" />
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Example use cases
            </h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-gray-600">
              {[
                "Internal Dashboards",
                "Trust Scoring Models",
                "Market Analysis",
                "Risk Insights",
                "Platform Indicators",
                "Competitive Benchmarking",
                "Supply Chain Vetting",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-gray-200 px-4 py-2"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-2xl px-6 pb-16 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Ready to build with trust?
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Contact our data team to discuss your use case and get API
            credentials.
          </p>
          <form className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Jane"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="jane@company.com"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Acme Inc."
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Role</label>
                <input
                  type="text"
                  placeholder="Product Manager"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Intended Use Case
                </label>
                <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option>Select a use case</option>
                  <option>Market Analysis</option>
                  <option>Trust Scoring Models</option>
                  <option>Risk Insights</option>
                  <option>Competitive Benchmarking</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about your project requirements and estimated volume..."
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-[#0B3B36] px-6 py-2 text-sm font-semibold text-white"
            >
              Request API Access
            </button>
            <p className="text-xs text-gray-500">
              Access to Tellacity Data Solutions is subject to approval. We
              review all applications to ensure alignment with our responsible
              data use policies.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

