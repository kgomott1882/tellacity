import Image from "next/image";
import Link from "next/link";

const highlights = [
  {
    title: "Proprietary Verification",
    description:
      "Proof-first review verification reduces manipulation and builds real trust at scale.",
  },
  {
    title: "Scalable SaaS Model",
    description:
      "Recurring revenue streams anchored by growth in verified business accounts.",
  },
  {
    title: "Transparent Trust Metrics",
    description:
      "A clear, auditable trust score system that improves confidence and adoption.",
  },
  {
    title: "Global Market Opportunity",
    description:
      "The trust economy spans every industry where reputation drives purchase.",
  },
];

const investmentReasons = [
  {
    title: "Defensible Technology",
    description:
      "Verification-first review infrastructure with expanding trust signals.",
  },
  {
    title: "Efficient Growth",
    description:
      "Strong retention and organic acquisition powered by reputation flywheels.",
  },
  {
    title: "Resilient Fundamentals",
    description:
      "Trust remains essential across economic cycles and purchase categories.",
  },
  {
    title: "Network Effects",
    description:
      "More verified reviews improve transparency and attract more businesses.",
  },
  {
    title: "Global Footprint",
    description:
      "Multi-market expansion brings verified reviews to new regions and sectors.",
  },
  {
    title: "Brand Trust",
    description:
      "A credible, neutral platform that balances consumer and business needs.",
  },
];

const milestones = [
  "Proof-first verification engine launched",
  "AI fraud detection system deployed",
  "Regional expansion into seven new markets",
  "Enterprise partnerships with payment platforms",
];

export default function InvestorRelationsPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#0B3B36]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs">
              Q4 2025 Earnings Report Available
            </div>
            <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">
              Powering the Trust Economy.
            </h1>
            <p className="mt-4 text-sm text-white/80">
              We are redefining digital reputation through verified proof.
              Join us as we build the global standard for consumer transparency.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-[#0B3B36]"
              >
                Download Investor Deck
              </button>
              <button
                type="button"
                className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold text-white"
              >
                View Annual Report
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
                Investment Opportunity
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0E0E0E]">
                Bridging the $4T Trust Gap
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                The digital economy suffers from a crisis of confidence. Fake
                reviews, AI-generated content, and paid endorsements cost the
                global economy over $4 trillion annually in lost value and fraud.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-600">
                {highlights.map((item) => (
                  <li key={item.title} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#1FAF9E]" />
                    <span>
                      <span className="font-semibold text-[#0E0E0E]">
                        {item.title}
                      </span>
                      : {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
              <Image
                src="/brand/Random numbers.png"
                alt="Trust and growth metrics"
                width={600}
                height={256}
                className="h-64 w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Why invest in Tellacity?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Our platform is designed to build trust at scale while unlocking
            sustainable growth.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investmentReasons.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-14">
          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Commitment to Integrity
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Our verification systems and transparent moderation policies are
              built to protect trust for consumers and businesses.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {milestones.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1FAF9E]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#0B3B36]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center text-white">
          <h2 className="text-2xl font-semibold">Get in Touch</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
            Contact our investor relations team to learn more about Tellacity’s
            performance, roadmap, and growth strategy.
          </p>
          <Link
            href="/investor-relations/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0B3B36] transition-colors hover:bg-white/95"
          >
            Email Investor Relations
          </Link>
        </div>
      </section>
    </main>
  );
}
