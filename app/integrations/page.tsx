import Link from "next/link";
function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}


const integrations = [
  { name: "Zapier", slug: "zapier", logo: "Zapier.jpg" },
  { name: "Shopify", slug: "shopify", logo: "shopify.jpg" },
  { name: "WooCommerce", slug: "woocommerce", logo: "woocommerce.jpg" },
  { name: "HubSpot", slug: "hubspot", logo: "HubSpot.jpg" },
  { name: "Salesforce", slug: "salesforce", logo: "Salesforce.jpg" },
  {
    name: "SAP",
    slug: "sap",
    logo: "SAP.jpg",
    description:
      "Seamlessly connect SAP to sync enterprise customer data and automate review workflows.",
  },
  {
    name: "NetSuite",
    slug: "netsuite",
    logo: "NetSuite.jpg",
    description:
      "Connect NetSuite to automate review requests and synchronize customer records across systems.",
  },
  {
    name: "Marketo",
    slug: "marketo",
    logo: "Marketo.jpg",
    description:
      "Integrate Marketo to trigger automated review invitations and marketing workflows.",
  },
  { name: "Slack", slug: "slack", logo: "Slack.jpg" },
  { name: "Klaviyo", slug: "klaviyo", logo: "Klaviyo.jpg" },
  { name: "Zendesk", slug: "zendesk", logo: "Zendesk.jpg" },
  { name: "Twilio", slug: "twilio", logo: "Twilio.jpg" },
  { name: "WordPress", slug: "wordpress", logo: "WordPress.jpg" },
  { name: "Magento", slug: "magento", logo: "Magento.jpg" },
  { name: "Google Sheets", slug: "google-sheets", logo: "Googlesheets.jpg" },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl font-semibold mb-4">
          Effortless Integrations
        </h1>
        <p className="text-gray-600">
          Connect Tellacity with the tools you already use. 
          Automate review requests, sync customer data, and unlock powerful workflows.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const safeSlug = (integration.slug ?? "").trim().toLowerCase();
          if (!isValidSlug(safeSlug)) return null;
          return (
          <Link
            key={safeSlug}
            href={`/integrations/${safeSlug}`}
            className="border rounded-xl p-6 hover:shadow-lg transition block"
          >
            <div className="mb-4 h-12 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/brand/${integration.logo}`}
                alt={`${integration.name} logo`}
                className="max-h-10 w-auto"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {integration.name}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {integration.description ??
                `Seamlessly connect ${integration.name} to automate workflows and customer insights.`}
            </p>

            <span className="text-sm font-medium underline">
              View Details
            </span>
          </Link>
        );
        })}
      </div>

      <div className="mt-20 text-center">
        <h2 className="text-xl font-semibold mb-4">
          How Integrations Work
        </h2>

        <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-2">1. Connect Your Tool</p>
            <p>Choose your preferred platform and link it to Tellacity.</p>
          </div>

          <div>
            <p className="font-medium mb-2">2. Configure Automation</p>
            <p>Set triggers for review invites, CRM updates, and alerts.</p>
          </div>

          <div>
            <p className="font-medium mb-2">3. Collect Reviews</p>
            <p>Let Tellacity handle the automation while you focus on growth.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
