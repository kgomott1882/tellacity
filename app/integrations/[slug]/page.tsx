import { notFound } from "next/navigation";
import Link from "next/link";

const websites: Record<string, string> = {
  zapier: "https://zapier.com",
  shopify: "https://shopify.com",
  woocommerce: "https://woocommerce.com",
  hubspot: "https://hubspot.com",
  salesforce: "https://salesforce.com",
  slack: "https://slack.com",
  klaviyo: "https://klaviyo.com",
  zendesk: "https://zendesk.com",
  twilio: "https://twilio.com",
  wordpress: "https://wordpress.org",
  magento: "https://business.adobe.com/products/magento/magento-commerce.html",
  "google-sheets": "https://www.google.com/sheets/about/",
};

const categories: Record<string, string> = {
  zapier: "Automation",
  shopify: "Ecommerce",
  woocommerce: "Ecommerce",
  hubspot: "CRM",
  salesforce: "CRM",
  slack: "Collaboration",
  klaviyo: "Marketing Automation",
  zendesk: "Support",
  twilio: "Messaging",
  wordpress: "CMS",
  magento: "Ecommerce",
  "google-sheets": "Analytics",
};

const logos: Record<string, string> = {
  zapier: "Zapier.jpg",
  shopify: "shopify.jpg",
  woocommerce: "woocommerce.jpg",
  hubspot: "HubSpot.jpg",
  salesforce: "Salesforce.jpg",
  slack: "Slack.jpg",
  klaviyo: "Klaviyo.jpg",
  zendesk: "Zendesk.jpg",
  twilio: "Twilio.jpg",
  wordpress: "WordPress.jpg",
  magento: "Magento.jpg",
  "google-sheets": "Googlesheets.jpg",
};

export default async function IntegrationPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  if (!websites[slug]) {
    return notFound();
  }

  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const website = websites[slug];
  const category = categories[slug] ?? "Integration";
  const logo = logos[slug];

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/integrations" className="text-sm text-gray-500 hover:text-gray-700">
          â† Back to Integrations
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid gap-10 md:grid-cols-3 items-start">
          {/* Left column */}
          <div className="md:col-span-2 space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div>
                {logo && (
                  <div className="mb-4 h-12 flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/brand/${logo}`}
                      alt={`${name} logo`}
                      className="max-h-10 w-auto"
                    />
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-[#0E0E0E]">
                  {name}
                </h1>
                <p className="text-gray-600 mt-3">
                  Connect {name} with Tellacity to automate review workflows,
                  keep customer data in sync, and surface trust signals where
                  your teams already work.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/business/signup"
                  className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow hover:opacity-90 transition"
                >
                  Get Started
                </Link>
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                >
                  Visit Website
                </a>
              </div>
            </div>

            {/* About */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                About {name}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {name} is a powerful platform that helps teams streamline work
                and stay connected to the tools they rely on every day. When
                paired with Tellacity, it becomes a trusted layer in your
                customer experience stack, ensuring feedback and trust signals
                flow smoothly across systems.
              </p>
            </section>

            {/* Features */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-[#0E0E0E]">
                {name} Ã- Tellacity
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    title: "Post-purchase review invites",
                    text: "Automatically trigger review requests after key customer events such as purchases or onboarding milestones.",
                  },
                  {
                    title: "Team alerts for low-star reviews",
                    text: "Send real-time alerts to the right channels when critical feedback is received so teams can act quickly.",
                  },
                  {
                    title: "Push ratings to sheets/BI",
                    text: "Stream trust and review metrics into spreadsheets or BI tools for deeper reporting and analysis.",
                  },
                  {
                    title: "Enrich CRM records",
                    text: "Add Tellacity scores and review outcomes to customer profiles to support more informed conversations.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                  >
                    <h3 className="font-semibold mb-2 text-[#0E0E0E]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Setup */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#0E0E0E]">
                Setup (&lt;10 minutes)
              </h2>
              <ol className="space-y-2 text-gray-700 text-sm md:text-base list-decimal list-inside">
                <li>Click Get Started and sign up for Tellacity Business.</li>
                <li>Connect your {name} account from the Integrations area.</li>
                <li>Choose the automations and triggers that match your flow.</li>
                <li>Activate and monitor performance in your dashboard.</li>
              </ol>
            </section>

            {/* FAQs */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#0E0E0E]">
                FAQs
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <div>
                  <h3 className="font-semibold text-[#0E0E0E] mb-1">
                    Do I need developers to set this up?
                  </h3>
                  <p className="text-gray-600">
                    No. Most teams can connect {name} to Tellacity using
                    guided setup in a few minutes, without custom code.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E0E0E] mb-1">
                    Can I change automations later?
                  </h3>
                  <p className="text-gray-600">
                    Yes. You can adjust or expand automations at any time as
                    your workflows evolve.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E0E0E] mb-1">
                    What data does Tellacity sync?
                  </h3>
                  <p className="text-gray-600">
                    Tellacity focuses on trust, review, and reputation signals.
                    You stay in control of which events and fields are used.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="md:col-span-1 md:sticky md:top-24">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 text-sm text-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">Categories</p>
                  <p>{category}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Works with</p>
                  <p>Tellacity Business dashboard</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Availability</p>
                  <p>Global</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Setup time</p>
                  <p>&lt; 10 minutes</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Developer</p>
                  <p>{name}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}


